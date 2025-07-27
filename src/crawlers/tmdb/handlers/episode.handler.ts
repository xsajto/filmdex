import { log } from '@crawlus/core';
import { ApiContext } from '@crawlus/api';
import { DatabaseService } from '../../../shared/database';
import {
    transformEpisodeForUpsert,
    transformExternalIds,
    transformImages,
    transformVideos,
    transformCredits,
    transformRecommendations,
    transformSimilarContent
} from '../transformations';
import type { TvEpisodeDetailsData } from '../types/tv.types';
import type { TvEpisodeCreditsData } from '../types/credits.types';

export interface EpisodeParams {
    tvId: string;
    seasonNumber: string;
    episodeNumber: string;
}

export async function handleEpisode(context: ApiContext): Promise<void> {
    const { tvId, seasonNumber, episodeNumber } = context.requestParams;
    const url = context.request.url;
    log.info(`Processing episode request: TV ${tvId} S${seasonNumber}E${episodeNumber}`);
    
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    try {
        // Get raw episode data
        let episodeData = context.data?.body || context.data;
        
        // If basic episode data, fetch full data with append_to_response
        if (!episodeData?.credits && !episodeData?.images) {
            log.debug(`Fetching complete episode data with append_to_response for TV ${tvId} S${seasonNumber}E${episodeNumber}`);
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
            
            const response = await context.apiRequest(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?append_to_response=${appendParams}`);
            episodeData = response.body || response;
        }
        
        if (!episodeData) {
            log.error(`No episode data found for TV ${tvId} S${seasonNumber}E${episodeNumber}`, { url, data: episodeData });
            return;
        }

        const sourceUrl = `https://www.themoviedb.org/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`;
        const savedCounts: Record<string, number> = {};

        // Find parent season content ID
        const seasonRemoteId = `${tvId}-season-${seasonNumber}`;
        const parentContent = await dbService.findContent({
            remoteId: seasonRemoteId,
            remoteSource: 'tmdb',
            type: 'season'
        });

        // 1. SAVE MAIN EPISODE CONTENT
        const contentTransform = transformEpisodeForUpsert(
            episodeData as TvEpisodeDetailsData,
            tvId,
            parseInt(seasonNumber),
            parseInt(episodeNumber),
            sourceUrl,
            parentContent?.id
        );
        const content = await dbService.upsertContent(contentTransform);

        // 2. SAVE EXTERNAL IDS
        if (episodeData.external_ids) {
            const externalIdData = transformExternalIds(episodeData.external_ids, 'content', content.id);
            await dbService.saveExternalIds(externalIdData);
            savedCounts.external_ids = externalIdData.length;
        }

        // 3. SAVE IMAGES
        if (episodeData.images) {
            const imageData = transformImages(episodeData.images, 'content', content.id);
            await dbService.saveMedia(imageData);
            savedCounts.images = imageData.length;
        }

        // 4. SAVE VIDEOS
        if (episodeData.videos) {
            const videoData = transformVideos(episodeData.videos, 'content', content.id);
            await dbService.saveMedia(videoData);
            savedCounts.videos = videoData.length;
        }

        // 5. SAVE CREDITS
        if (episodeData.credits) {
            const creditsData = transformCredits(episodeData.credits as TvEpisodeCreditsData, content.id);
            await dbService.saveCredits(content.id, creditsData);
            
            // Enqueue persons for detailed processing
            for (const personData of creditsData.persons) {
                await context.enqueue(`https://api.themoviedb.org/3/person/${personData.remoteId}?append_to_response=external_ids,images,combined_credits,translations`);
            }
            
            savedCounts.cast = creditsData.allMembers.filter(m => m.role === 'cast').length;
            savedCounts.crew = creditsData.allMembers.filter(m => m.role === 'crew').length;
        }

        // 6. SAVE RECOMMENDATIONS
        if (episodeData.recommendations) {
            const recommendationsData = transformRecommendations(content.id, episodeData.recommendations);
            await dbService.saveContentRelations(recommendationsData.relations);
            savedCounts.recommendations = recommendationsData.relations.length;
        }

        // 7. SAVE SIMILAR CONTENT
        if (episodeData.similar) {
            const similarData = transformSimilarContent(content.id, episodeData.similar);
            await dbService.saveContentRelations(similarData.relations);
            savedCounts.similar = similarData.relations.length;
        }
        
        // Single summary log
        log.info(`✅ Episode ${tvId} S${seasonNumber}E${episodeNumber} (${episodeData.name || `Episode ${episodeNumber}`})`, savedCounts);
        
    } catch (error) {
        log.error(`Error processing episode TV ${tvId} S${seasonNumber}E${episodeNumber}:`, error as Error);
        throw error;
    } finally {
        await dbService.close();
    }
}