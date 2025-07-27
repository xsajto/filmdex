import { log } from '@crawlus/core';
import { ApiContext } from '@crawlus/api';
import { DatabaseService } from '../../../shared/database';
import {
    transformTvSeriesForUpsert,
    transformGenres,
    transformOriginCountries,
    transformSpokenLanguages,
    transformProductionCompanies,
    transformNetworks,
    transformKeywords,
    transformExternalIds,
    transformImages,
    transformVideos,
    transformCredits,
    transformRecommendations,
    transformSimilarContent,
    transformReviews,
    transformTranslations,
    transformWatchProviders,
    transformContentRatings,
    transformAlternativeTitles
} from '../transformations';
import type { TvSeriesDetailsData } from '../types/tv.types';
import type { TvSeriesCreditsData } from '../types/credits.types';

export interface TvParams {
    tvId: string;
}

export async function handleTvSeries(context: ApiContext): Promise<void> {
    const { tvId } = context.requestParams;
    const url = context.request.url;
    log.info(`Processing TV request: ${url} (ID: ${tvId})`);
    
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    try {
        // Get raw TV data
        let tvData = context.data?.body || context.data;
        
        // If basic TV data, fetch full data with append_to_response
        if (!tvData?.alternative_titles && !tvData?.credits) {
            log.debug(`Fetching complete TV data with append_to_response for ${tvId}`);
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
                'content_ratings',
                'episode_groups',
                'screened_theatrically'
            ].join(',');
            
            const response = await context.apiRequest(`https://api.themoviedb.org/3/tv/${tvId}?append_to_response=${appendParams}`);
            tvData = response.body || response;
        }
        
        if (!tvData || !tvData.name) {
            log.error(`No TV data found for ID ${tvId}`, { url, data: tvData });
            return;
        }
        
        const sourceUrl = `https://www.themoviedb.org/tv/${tvId}`;
        const savedCounts: Record<string, number> = {};

        // 1. SAVE MAIN CONTENT
        const contentTransform = transformTvSeriesForUpsert(tvData as TvSeriesDetailsData, tvId, sourceUrl);
        const content = await dbService.upsertContent(contentTransform);
        
        // 2. SAVE GENRES
        if (tvData.genres && Array.isArray(tvData.genres)) {
            const genreData = transformGenres(tvData.genres);
            await dbService.saveGenres(content.id, genreData);
            savedCounts.genres = genreData.length;
        }

        // 3. SAVE ORIGIN COUNTRIES
        if (tvData.origin_country && Array.isArray(tvData.origin_country)) {
            const { countries } = transformOriginCountries(tvData.origin_country, content.id);
            await dbService.saveCountries(content.id, countries, 'origin');
            savedCounts.countries = countries.length;
        }

        // 4. SAVE SPOKEN LANGUAGES
        if (tvData.spoken_languages && Array.isArray(tvData.spoken_languages)) {
            const languageData = transformSpokenLanguages(tvData.spoken_languages);
            await dbService.saveLanguages(content.id, languageData, 'spoken');
            savedCounts.languages = languageData.length;
        }

        // 5. SAVE PRODUCTION COMPANIES
        if (tvData.production_companies && Array.isArray(tvData.production_companies)) {
            const companyData = transformProductionCompanies(tvData.production_companies);
            await dbService.saveOrganizations(content.id, companyData, 'production_company');
            savedCounts.companies = companyData.length;
        }

        // 6. SAVE NETWORKS
        if (tvData.networks && Array.isArray(tvData.networks)) {
            const networkData = transformNetworks(tvData.networks);
            await dbService.saveOrganizations(content.id, networkData, 'network');
            savedCounts.networks = networkData.length;
        }

        // 7. SAVE KEYWORDS
        if (tvData.keywords?.results && Array.isArray(tvData.keywords.results)) {
            const keywordData = transformKeywords(tvData.keywords.results);
            await dbService.saveKeywords(content.id, keywordData);
            savedCounts.keywords = keywordData.length;
        }

        // 8. SAVE EXTERNAL IDS
        if (tvData.external_ids) {
            const externalIdData = transformExternalIds(tvData.external_ids, 'content', content.id);
            await dbService.saveExternalIds(externalIdData);
            savedCounts.external_ids = externalIdData.length;
        }

        // 9. SAVE IMAGES
        if (tvData.images) {
            const imageData = transformImages(tvData.images, 'content', content.id);
            await dbService.saveMedia(imageData);
            savedCounts.images = imageData.length;
        }

        // 10. SAVE VIDEOS
        if (tvData.videos) {
            const videoData = transformVideos(tvData.videos, 'content', content.id);
            await dbService.saveMedia(videoData);
            savedCounts.videos = videoData.length;
        }

        // 11. SAVE CREDITS
        if (tvData.credits) {
            const creditsData = transformCredits(tvData.credits as TvSeriesCreditsData, content.id);
            await dbService.saveCredits(content.id, creditsData);
            
            // Enqueue persons for detailed processing
            for (const personData of creditsData.persons) {
                await context.enqueue(`https://api.themoviedb.org/3/person/${personData.remoteId}?append_to_response=external_ids,images,combined_credits,translations`);
            }
            
            savedCounts.cast = creditsData.allMembers.filter(m => m.role === 'cast').length;
            savedCounts.crew = creditsData.allMembers.filter(m => m.role === 'crew').length;
        }

        // 12. SAVE RECOMMENDATIONS
        if (tvData.recommendations) {
            const recommendationsData = transformRecommendations(content.id, tvData.recommendations);
            await dbService.saveContentRelations(recommendationsData.relations);
            savedCounts.recommendations = recommendationsData.relations.length;
        }

        // 13. SAVE SIMILAR CONTENT
        if (tvData.similar) {
            const similarData = transformSimilarContent(content.id, tvData.similar);
            await dbService.saveContentRelations(similarData.relations);
            savedCounts.similar = similarData.relations.length;
        }

        // 14. SAVE REVIEWS
        if (tvData.reviews) {
            const reviewData = transformReviews(tvData.reviews, content.id);
            await dbService.saveReviews(reviewData);
            savedCounts.reviews = reviewData.length;
        }

        // 15. SAVE TRANSLATIONS
        if (tvData.translations) {
            const translationData = transformTranslations(tvData.translations, content.id);
            await dbService.saveTranslations(translationData);
            savedCounts.translations = translationData.length;
        }

        // 16. SAVE WATCH PROVIDERS
        if (tvData['watch/providers']) {
            const watchProviderData = transformWatchProviders(tvData['watch/providers'], content.id);
            await dbService.saveMetadata(watchProviderData);
            savedCounts.watch_providers = watchProviderData.length;
        }

        // 17. SAVE CONTENT RATINGS
        if (tvData.content_ratings) {
            const contentRatingData = transformContentRatings(tvData.content_ratings, content.id);
            await dbService.saveMetadata(contentRatingData);
            savedCounts.content_ratings = contentRatingData.length;
        }

        // 18. SAVE ALTERNATIVE TITLES
        if (tvData.alternative_titles) {
            const altTitleData = transformAlternativeTitles(tvData.alternative_titles, content.id);
            await dbService.saveMetadata(altTitleData);
            savedCounts.alternative_titles = altTitleData.length;
        }

        // Count seasons and episodes for summary
        let seasonsCount = 0;
        let episodesCount = 0;
        if (tvData.seasons && Array.isArray(tvData.seasons)) {
            seasonsCount = tvData.seasons.length;
            for (const season of tvData.seasons) {
                if (season.episode_count) {
                    episodesCount += season.episode_count;
                }
            }
        }
        savedCounts.seasons = seasonsCount;
        savedCounts.episodes = episodesCount;

        // Enqueue seasons for processing if they exist
        if (tvData.seasons && Array.isArray(tvData.seasons)) {
            for (const season of tvData.seasons) {
                if (season.season_number !== null && season.season_number !== undefined) {
                    // Enqueue season with full append_to_response
                    const seasonAppendParams = [
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
                    
                    await context.enqueue(`https://api.themoviedb.org/3/tv/${tvId}/season/${season.season_number}?append_to_response=${seasonAppendParams}`);
                }
            }
        }
        
        // Single summary log
        log.info(`✅ TV Show ${tvId} (${tvData.name})`, savedCounts);
        
    } catch (error) {
        log.error(`Error processing TV show from ${url}:`, error as Error);
        throw error;
    } finally {
        await dbService.close();
    }
}