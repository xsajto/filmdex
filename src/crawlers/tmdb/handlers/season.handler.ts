import { log } from '@crawlus/core';
import { ApiContext } from '@crawlus/api';
import { DatabaseService } from '../../../shared/database';
import {
    transformSeasonForUpsert,
    transformExternalIds,
    transformImages,
    transformVideos,
    transformCredits,
    transformRecommendations,
    transformSimilarContent
} from '../transformations';
import type { TvSeasonDetailsData } from '../types/tv.types';
import type { TvSeasonCreditsData } from '../types/credits.types';

export interface SeasonParams {
    tvId: string;
    seasonNumber: string;
}

export async function handleSeason(context: ApiContext): Promise<void> {
    const { tvId, seasonNumber } = context.requestParams;
    const url = context.request.url;
    log.info(`Processing season request: TV ${tvId} Season ${seasonNumber}`);
    
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    try {
        // Get raw season data
        let seasonData = context.data?.body || context.data;
        
        // If basic season data, fetch full data with append_to_response
        if (!seasonData?.credits && !seasonData?.images) {
            log.debug(`Fetching complete season data with append_to_response for TV ${tvId} Season ${seasonNumber}`);
            const appendParams = [
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
            
            const response = await context.apiRequest(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?append_to_response=${appendParams}`);
            seasonData = response.body || response;
        }
        
        if (!seasonData) {
            log.error(`No season data found for TV ${tvId} Season ${seasonNumber}`, { url, data: seasonData });
            return;
        }

        const sourceUrl = `https://www.themoviedb.org/tv/${tvId}/season/${seasonNumber}`;
        const savedCounts: Record<string, number> = {};

        // Find parent TV show content ID
        const parentContent = await dbService.findContent({
            remoteId: tvId,
            remoteSource: 'tmdb',
            type: 'series'
        });

        // 1. SAVE MAIN SEASON CONTENT
        const contentTransform = transformSeasonForUpsert(
            seasonData as TvSeasonDetailsData, 
            tvId, 
            parseInt(seasonNumber), 
            sourceUrl,
            parentContent?.id
        );
        const content = await dbService.upsertContent(contentTransform);

        // 2. SAVE EXTERNAL IDS
        if (seasonData.external_ids) {
            const externalIdData = transformExternalIds(seasonData.external_ids, 'content', content.id);
            await dbService.saveExternalIds(externalIdData);
            savedCounts.external_ids = externalIdData.length;
        }

        // 3. SAVE IMAGES
        if (seasonData.images) {
            const imageData = transformImages(seasonData.images, 'content', content.id);
            await dbService.saveMedia(imageData);
            savedCounts.images = imageData.length;
        }

        // 4. SAVE VIDEOS
        if (seasonData.videos) {
            const videoData = transformVideos(seasonData.videos, 'content', content.id);
            await dbService.saveMedia(videoData);
            savedCounts.videos = videoData.length;
        }

        // 5. SAVE CREDITS
        if (seasonData.credits) {
            const creditsData = transformCredits(seasonData.credits as TvSeasonCreditsData, content.id);
            await dbService.saveCredits(content.id, creditsData);
            
            // Enqueue persons for detailed processing
            for (const personData of creditsData.persons) {
                await context.enqueue(`https://api.themoviedb.org/3/person/${personData.remoteId}?append_to_response=external_ids,images,combined_credits,translations`);
            }
            
            savedCounts.cast = creditsData.allMembers.filter(m => m.role === 'cast').length;
            savedCounts.crew = creditsData.allMembers.filter(m => m.role === 'crew').length;
        }

        // 6. SAVE RECOMMENDATIONS
        if (seasonData.recommendations) {
            const recommendationsData = transformRecommendations(content.id, seasonData.recommendations);
            await dbService.saveContentRelations(recommendationsData.relations);
            savedCounts.recommendations = recommendationsData.relations.length;
        }

        // 7. SAVE SIMILAR CONTENT
        if (seasonData.similar) {
            const similarData = transformSimilarContent(content.id, seasonData.similar);
            await dbService.saveContentRelations(similarData.relations);
            savedCounts.similar = similarData.relations.length;
        }

        savedCounts.episodes = seasonData.episodes?.length || 0;
        
        // Enqueue episodes for processing if they exist
        if (seasonData.episodes && Array.isArray(seasonData.episodes)) {
            for (const episode of seasonData.episodes) {
                if (episode.episode_number !== null && episode.episode_number !== undefined) {
                    // Enqueue episode with full append_to_response
                    const episodeAppendParams = [
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
                    
                    await context.enqueue(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}/episode/${episode.episode_number}?append_to_response=${episodeAppendParams}`);
                }
            }
        }
        
        // Single summary log
        log.info(`✅ Season ${tvId} S${seasonNumber} (${seasonData.name || `Season ${seasonNumber}`})`, savedCounts);
        
    } catch (error) {
        log.error(`Error processing season TV ${tvId} Season ${seasonNumber}:`, error as Error);
        throw error;
    } finally {
        await dbService.close();
    }
}