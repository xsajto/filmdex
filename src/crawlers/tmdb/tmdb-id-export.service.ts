/**
 * TMDB ID Exports Service
 * 
 * Downloads and processes TMDB's daily ID exports instead of using discovery pagination.
 * This bypasses the 500-page limit by getting comprehensive lists of all valid IDs.
 * 
 * Files are updated daily at 7:00 AM UTC and available for 3 months.
 * Format: [media_type]_ids_MM_DD_YYYY.json.gz
 * URL: http://files.tmdb.org/p/exports/[filename]
 */

import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import { createInterface } from 'readline';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { request } from 'https';
import { request as httpRequest } from 'http';

export interface TMDBIdExport {
    id: number;
    adult: boolean;
    video?: boolean;
    popularity?: number;
}

export interface TMDBIdExportsOptions {
    cacheDir?: string;
    maxAge?: number; // Maximum age in milliseconds before re-downloading
    includeAdult?: boolean;
}

export class TMDBIdExportsService {
    private readonly baseUrl = 'http://files.tmdb.org/p/exports';
    private readonly cacheDir: string;
    private readonly maxAge: number;
    private readonly includeAdult: boolean;

    /**
     * Helper function to make HTTP HEAD request
     */
    private async makeHeadRequest(url: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const requestFn = url.startsWith('https://') ? request : httpRequest;
            const req = requestFn(url, { method: 'HEAD', timeout: 10000 }, (res) => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(true);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            req.end();
        });
    }

    /**
     * Helper function to download file
     */
    private async downloadFile(url: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const requestFn = url.startsWith('https://') ? request : httpRequest;
            const req = requestFn(url, { timeout: 30000 }, (res) => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    const chunks: Buffer[] = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(chunks)));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Download timeout')));
            req.end();
        });
    }

    constructor(options: TMDBIdExportsOptions = {}) {
        this.cacheDir = options.cacheDir || './cache/tmdb-exports';
        this.maxAge = options.maxAge || 24 * 60 * 60 * 1000; // 24 hours default
        this.includeAdult = options.includeAdult || false;
    }

    /**
     * Get the most recent export file date (tries today, then yesterday, etc.)
     */
    private async findLatestExportDate(mediaType: string): Promise<string | null> {
        
        // Try the last 14 days instead of 7 to account for potential delays
        for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            
            const dateStr = this.formatDate(date);
            const filename = `${mediaType}_ids_${dateStr}.json.gz`;
            const url = `${this.baseUrl}/${filename}`;
            
            try {
                // Check if file exists with HEAD request
                await this.makeHeadRequest(url);
                console.log(`Found latest export for ${mediaType}: ${dateStr}`);
                return dateStr;
            } catch (error) {
                // Log the error for debugging but continue trying
                if (daysAgo < 3) {
                    console.log(`Export file not found for ${mediaType} on ${dateStr}: ${error instanceof Error ? error.message : String(error)}`);
                }
                continue;
            }
        }
        
        console.warn(`No export files found for ${mediaType} in the last 14 days`);
        return null;
    }

    /**
     * Format date as MM_DD_YYYY
     */
    private formatDate(date: Date): string {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${month}_${day}_${year}`;
    }

    /**
     * Download and cache an export file
     */
    private async downloadExportFile(mediaType: string, dateStr: string): Promise<string> {
        const filename = `${mediaType}_ids_${dateStr}.json.gz`;
        const url = `${this.baseUrl}/${filename}`;
        const localPath = join(this.cacheDir, filename);
        
        // Ensure cache directory exists
        await mkdir(this.cacheDir, { recursive: true });
        
        console.log(`Downloading ${mediaType} export from ${url}...`);
        
        const responseBuffer = await this.downloadFile(url);
        
        await writeFile(localPath, responseBuffer);
        console.log(`Downloaded and cached: ${localPath}`);
        
        return localPath;
    }

    /**
     * Check if cached file exists and is not too old
     */
    private async isCacheValid(filePath: string): Promise<boolean> {
        try {
            await access(filePath);
            const fs = await import('fs');
            const stats = await fs.promises.stat(filePath);
            const age = Date.now() - stats.mtime.getTime();
            return age < this.maxAge;
        } catch {
            return false;
        }
    }

    /**
     * Find any cached file for the given media type (even if old)
     */
    private async findAnyCachedFile(mediaType: string): Promise<string | null> {
        try {
            const fs = await import('fs');
            await mkdir(this.cacheDir, { recursive: true });
            const files = await fs.promises.readdir(this.cacheDir);
            
            // Look for any file matching the media type pattern
            const pattern = new RegExp(`^${mediaType}_ids_\\d{2}_\\d{2}_\\d{4}\\.json\\.gz$`);
            const matchingFiles = files.filter(file => pattern.test(file));
            
            if (matchingFiles.length === 0) {
                return null;
            }
            
            // Return the most recent file by filename (latest date)
            matchingFiles.sort().reverse();
            const latestFile = matchingFiles[0];
            
            return join(this.cacheDir, latestFile);
        } catch {
            return null;
        }
    }

    /**
     * Get cached file path or download if needed
     */
    private async getCachedOrDownload(mediaType: string): Promise<string | null> {
        const latestDate = await this.findLatestExportDate(mediaType);
        if (!latestDate) {
            console.error(`No export files found for ${mediaType} in the last 14 days. TMDB exports may be temporarily unavailable.`);
            
            // Check if we have any cached files for this media type (even if old)
            const cachedFile = await this.findAnyCachedFile(mediaType);
            if (cachedFile) {
                console.warn(`Using old cached file as fallback: ${cachedFile}`);
                return cachedFile;
            }
            
            throw new Error(`No export files found for ${mediaType} in the last 14 days and no cached files available`);
        }
        
        const filename = `${mediaType}_ids_${latestDate}.json.gz`;
        const cachedPath = join(this.cacheDir, filename);
        
        if (await this.isCacheValid(cachedPath)) {
            console.log(`Using cached export: ${cachedPath}`);
            return cachedPath;
        }
        
        return await this.downloadExportFile(mediaType, latestDate);
    }

    /**
     * Process a gzipped export file and yield IDs
     */
    async *processExportFile(mediaType: string): AsyncGenerator<TMDBIdExport, void, unknown> {
        const filePath = await this.getCachedOrDownload(mediaType);
        
        if (!filePath) {
            console.error(`No export file available for ${mediaType}, skipping processing`);
            return;
        }
        
        console.log(`Processing ${mediaType} export file: ${filePath}`);
        
        const fileStream = createReadStream(filePath);
        const gunzip = createGunzip();
        const rl = createInterface({
            input: fileStream.pipe(gunzip),
            crlfDelay: Infinity
        });
        
        let processedCount = 0;
        
        for await (const line of rl) {
            if (line.trim()) {
                try {
                    const data = JSON.parse(line) as TMDBIdExport;
                    
                    // Filter out adult content if not requested
                    if (!this.includeAdult && data.adult) {
                        continue;
                    }
                    
                    // Filter out video content for movies (usually trailers, not full movies)
                    if (mediaType === 'movie' && data.video) {
                        continue;
                    }
                    
                    // Filter out very low IDs that might be test data
                    if (data.id < 10) {
                        continue;
                    }
                    
                    processedCount++;
                    yield data;
                    
                    // Log progress every 10,000 entries
                    if (processedCount % 10000 === 0) {
                        console.log(`Processed ${processedCount} ${mediaType} IDs...`);
                    }
                } catch (error) {
                    console.warn(`Failed to parse line: ${line}`, error);
                }
            }
        }
        
        console.log(`Finished processing ${processedCount} ${mediaType} IDs`);
    }

    /**
     * Get all movie IDs from the latest export
     */
    async *getMovieIds(): AsyncGenerator<TMDBIdExport, void, unknown> {
        yield* this.processExportFile('movie');
    }

    /**
     * Get all TV show IDs from the latest export
     */
    async *getTVIds(): AsyncGenerator<TMDBIdExport, void, unknown> {
        yield* this.processExportFile('tv_series');
    }




    /**
     * Get all items from export file as array
     */
    private async getAllFromExport(mediaType: string): Promise<TMDBIdExport[]> {
        const results: TMDBIdExport[] = [];
        
        for await (const item of this.processExportFile(mediaType)) {
            results.push(item);
        }
        
        return results;
    }

    /**
     * Get all movie IDs as array
     */
    async getMovieIdsArray(): Promise<TMDBIdExport[]> {
        return await this.getAllFromExport('movie');
    }

    /**
     * Get all TV show IDs as array
     */
    async getTVIdsArray(): Promise<TMDBIdExport[]> {
        return await this.getAllFromExport('tv_series');
    }


}

