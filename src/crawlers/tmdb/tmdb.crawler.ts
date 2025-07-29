import 'dotenv/config';
import { ApiCrawler, ApiRouter } from '@crawlus/api';
import { RequestQueue, log } from '@crawlus/core';
import { TMDBIdExportsService } from './tmdb-id-export.service';

import { createTmdbV2Router } from './tmdb.router';
import { PrismaRequestQueueStorage } from '../../shared/prisma-request-queue-storage';

export class TmdbV2Crawler {
    protected crawler: ApiCrawler;
    private router: ApiRouter;
    private tmdbIdExportsSerivce: TMDBIdExportsService;

    constructor(apiKey: string | string[]) {
        this.router = createTmdbV2Router();
        this.tmdbIdExportsSerivce = new TMDBIdExportsService();

        if (!Array.isArray(apiKey)) {
            apiKey = [apiKey];
        }


        this.crawler = new ApiCrawler({
            requestHandler: this.router,
            requestQueue: new RequestQueue({ name: 'tmdb', storage: new PrismaRequestQueueStorage('tmdb') }),
            maxConcurrency: 6, // Reduce concurrent requests to respect rate limits
            clearOnStart: false,
            auth: apiKey.map(key => ({
                type: 'bearer',
                apiKey: key,
                rateLimiter: {
                    requestsPerSecond: 49, // Conservative rate per API key
                    dailyQuota: 24*60*60*49 // TMDB daily quota per API key
                }
            })),
            apiEndpoint: {
                baseUrl: 'https://api.themoviedb.org',
                timeout: 30000,
                autoParseJson: true,
                autoHandlePagination: false
            },
            monitoring: {
                enabled: true,
                autoStart: true,
                includePoolMetrics: true
            }
        });
    }

    /**
     * Enqueue URLs in batches to avoid memory/string length limits
     */
    private async enqueueBatch(urls: string[], batchSize = 5000): Promise<void> {
        const totalBatches = Math.ceil(urls.length / batchSize);

        for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, urls.length);
            const batch = urls.slice(start, end);

            log.info(`Enqueueing batch ${i + 1}/${totalBatches}`, {
                batchSize: batch.length,
                processed: end,
                total: urls.length
            });

            try {
                await this.crawler.enqueue(batch);
                log.debug(`Successfully enqueued batch ${i + 1}/${totalBatches}`);
            } catch (error) {
                log.error(`Failed to enqueue batch ${i + 1}/${totalBatches}:`, error as Error);
                throw error;
            }
        }
    }

    async run() {
        log.info('Starting TMDB v2 crawler with Crawlus API Crawler');

        // Enqueue tv show URLs with append_to_response in batches
        log.info('Loading ids export for tv shows');
        const tvShowIds = await this.tmdbIdExportsSerivce.getTVIdsArray();
        const tvAppendParams = [
            'alternative_titles',
            'external_ids',
            'credits',
            'images',
            'keywords',
            'translations',
            'videos',
            'reviews',
            'recommendations',
            'similar',
            'watch/providers',
            'content_ratings',
            'episode_groups',
            'screened_theatrically'
        ].join(',');
        const tvShowUrls = tvShowIds.map(tvShow => `https://api.themoviedb.org/3/tv/${tvShow.id}?append_to_response=${tvAppendParams}`);
        log.info('Enqueueing optimized tv show URLs in batches...', { count: tvShowUrls.length });
        await this.enqueueBatch(tvShowUrls, 5000); // Batch size of 5000
        log.info('Enqueued optimized tv show URLs', { count: tvShowUrls.length });

        // Enqueue movie URLs with append_to_response in batches
        log.info('Loading ids export for movies');
        const movieIds = await this.tmdbIdExportsSerivce.getMovieIdsArray();
        const movieAppendParams = [
            'alternative_titles',
            'external_ids',
            'credits',
            'images',
            'keywords',
            'translations',
            'videos',
            'reviews',
            'recommendations',
            'similar',
            'watch/providers',
            'release_dates',
            'lists'
        ].join(',');
        const movieUrls = movieIds.map(movie => `https://api.themoviedb.org/3/movie/${movie.id}?append_to_response=${movieAppendParams}`);
        log.info('Enqueueing optimized movie URLs in batches...', { count: movieUrls.length });
        await this.enqueueBatch(movieUrls, 5000); // Batch size of 5000
        log.info('Enqueued optimized movie URLs', { count: movieUrls.length });

        await this.crawler.run();
        log.info('Crawler finished');
    }

    /**
     * Resume crawler - only processes existing queue without enqueueing new items
     */
    async runResume() {
        log.info('🔄 Resuming TMDB crawler - skipping enqueue phase');
        log.info('📋 Processing existing requests in queue only...');

        // Skip enqueue and just run the crawler to process existing queue
        await this.crawler.run();
        log.info('✅ Crawler finished processing existing queue');
    }
}

// Main execution
async function main() {
    const apiKey = process.env.TMDB_API_KEY;
    const apiKeys = process.env.TMDB_API_KEYS; // Support multiple keys separated by comma

    let keys: string | string[];

    if (apiKeys) {
        // Multiple API keys provided
        keys = apiKeys.split(',').map(key => key.trim()).filter(key => key.length > 0);
        log.info(`Using ${keys.length} TMDB API keys for enhanced rate limiting`);
    } else if (apiKey) {
        // Single API key provided
        keys = [apiKey];
        log.info('Using single TMDB API key');
    } else {
        console.error('TMDB_API_KEY or TMDB_API_KEYS environment variable is required');
        process.exit(1);
    }

    const crawler = new TmdbV2Crawler(keys);
    try {
        await crawler.run();
    } catch (error) {
        console.error('Crawler failed:', error);
        process.exit(1);
    }
}

// Resume execution
async function mainResume() {
    const apiKey = process.env.TMDB_API_KEY;
    const apiKeys = process.env.TMDB_API_KEYS; // Support multiple keys separated by comma

    let keys: string | string[];

    if (apiKeys) {
        // Multiple API keys provided
        keys = apiKeys.split(',').map(key => key.trim()).filter(key => key.length > 0);
        console.log(`🔑 Using ${keys.length} TMDB API keys for enhanced rate limiting`);
    } else if (apiKey) {
        // Single API key provided
        keys = [apiKey];
        console.log('🔑 Using single TMDB API key');
    } else {
        console.error('❌ TMDB_API_KEY or TMDB_API_KEYS environment variable is required');
        process.exit(1);
    }

    const crawler = new TmdbV2Crawler(keys);
    try {
        await crawler.runResume();
        console.log('🎉 Resume crawler completed successfully!');
    } catch (error) {
        console.error('💥 Resume crawler failed:', error);
        process.exit(1);
    }
}

// CommonJS: Run if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

// Export the resume function for script usage
export { mainResume };