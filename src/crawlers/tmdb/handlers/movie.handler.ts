import { log } from '@crawlus/core';
import { ApiContext } from '@crawlus/api';
import { DatabaseService } from '../../../shared/database';
import {
    transformMovieForUpsert,
    transformGenres,
    transformProductionCountries,
    transformSpokenLanguages,
    transformProductionCompanies,
    transformCollection,
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
import type { MovieDetailsData } from '../types/movie.types';
import type { MovieCreditsData } from '../types/credits.types';

export interface MovieParams {
    movieId: string;
}

export async function handleMovie(context: ApiContext): Promise<void> {
    const { movieId } = context.requestParams;
    const url = context.request.url;
    log.info(`Processing movie request: ${url} (ID: ${movieId})`);
    
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    try {
        // Get raw movie data
        let movieData = context.data?.body || context.data;
        
        // If basic movie data, fetch full data with append_to_response
        if (!movieData?.alternative_titles && !movieData?.credits) {
            log.debug(`Fetching complete movie data with append_to_response for ${movieId}`);
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
            
            const response = await context.apiRequest(`https://api.themoviedb.org/3/movie/${movieId}?append_to_response=${appendParams}`);
            movieData = response.body || response;
        }
        
        if (!movieData || !movieData.title) {
            log.error(`No movie data found for ID ${movieId}`, { url, data: movieData });
            return;
        }

        const sourceUrl = `https://www.themoviedb.org/movie/${movieId}`;
        const savedCounts: Record<string, number> = {};

        // 1. SAVE MAIN CONTENT
        const contentTransform = transformMovieForUpsert(movieData as MovieDetailsData, movieId, sourceUrl);
        const content = await dbService.upsertContent(contentTransform);
        
        // 2. SAVE GENRES
        if (movieData.genres && Array.isArray(movieData.genres)) {
            const genreData = transformGenres(movieData.genres);
            await dbService.saveGenres(content.id, genreData);
            savedCounts.genres = genreData.length;
        }

        // 3. SAVE PRODUCTION COUNTRIES
        if (movieData.production_countries && Array.isArray(movieData.production_countries)) {
            const countryData = transformProductionCountries(movieData.production_countries);
            await dbService.saveCountries(content.id, countryData, 'production');
            savedCounts.countries = countryData.length;
        }

        // 4. SAVE SPOKEN LANGUAGES
        if (movieData.spoken_languages && Array.isArray(movieData.spoken_languages)) {
            const languageData = transformSpokenLanguages(movieData.spoken_languages);
            await dbService.saveLanguages(content.id, languageData, 'spoken');
            savedCounts.languages = languageData.length;
        }

        // 5. SAVE PRODUCTION COMPANIES
        if (movieData.production_companies && Array.isArray(movieData.production_companies)) {
            const companyData = transformProductionCompanies(movieData.production_companies);
            await dbService.saveOrganizations(content.id, companyData, 'production_company');
            savedCounts.companies = companyData.length;
        }

        // 6. SAVE COLLECTION
        if (movieData.belongs_to_collection) {
            const collectionData = transformCollection(movieData.belongs_to_collection);
            await dbService.saveCollection(content.id, collectionData);
            savedCounts.collection = 1;
        }

        // 7. SAVE KEYWORDS
        if (movieData.keywords?.keywords && Array.isArray(movieData.keywords.keywords)) {
            const keywordData = transformKeywords(movieData.keywords.keywords);
            await dbService.saveKeywords(content.id, keywordData);
            savedCounts.keywords = keywordData.length;
        }

        // 8. SAVE EXTERNAL IDS
        if (movieData.external_ids) {
            const externalIdData = transformExternalIds(movieData.external_ids, 'content', content.id);
            await dbService.saveExternalIds(externalIdData);
            savedCounts.external_ids = externalIdData.length;
        }

        // 9. SAVE IMAGES
        if (movieData.images) {
            const imageData = transformImages(movieData.images, 'content', content.id);
            await dbService.saveMedia(imageData);
            savedCounts.images = imageData.length;
        }

        // 10. SAVE VIDEOS
        if (movieData.videos) {
            const videoData = transformVideos(movieData.videos, 'content', content.id);
            await dbService.saveMedia(videoData);
            savedCounts.videos = videoData.length;
        }

        // 11. SAVE CREDITS
        if (movieData.credits) {
            const creditsData = transformCredits(movieData.credits as MovieCreditsData, content.id);
            await dbService.saveCredits(content.id, creditsData);
            
            // Enqueue persons for detailed processing
            for (const personData of creditsData.persons) {
                await context.enqueue(`https://api.themoviedb.org/3/person/${personData.remoteId}?append_to_response=external_ids,images,combined_credits,translations`);
            }
            
            savedCounts.cast = creditsData.allMembers.filter(m => m.role === 'cast').length;
            savedCounts.crew = creditsData.allMembers.filter(m => m.role === 'crew').length;
        }

        // 12. SAVE RECOMMENDATIONS
        if (movieData.recommendations) {
            const recommendationsData = transformRecommendations(content.id, movieData.recommendations);
            await dbService.saveContentRelations(recommendationsData.relations);
            savedCounts.recommendations = recommendationsData.relations.length;
        }

        // 13. SAVE SIMILAR CONTENT
        if (movieData.similar) {
            const similarData = transformSimilarContent(content.id, movieData.similar);
            await dbService.saveContentRelations(similarData.relations);
            savedCounts.similar = similarData.relations.length;
        }

        // 14. SAVE REVIEWS
        if (movieData.reviews) {
            const reviewData = transformReviews(movieData.reviews, content.id);
            await dbService.saveReviews(reviewData);
            savedCounts.reviews = reviewData.length;
        }

        // 15. SAVE TRANSLATIONS
        if (movieData.translations) {
            const translationData = transformTranslations(movieData.translations, content.id);
            await dbService.saveTranslations(translationData);
            savedCounts.translations = translationData.length;
        }

        // 16. SAVE WATCH PROVIDERS
        if (movieData['watch/providers']) {
            const watchProviderData = transformWatchProviders(movieData['watch/providers'], content.id);
            await dbService.saveMetadata(watchProviderData);
            savedCounts.watch_providers = watchProviderData.length;
        }

        // 17. SAVE CONTENT RATINGS (MPAA ratings, etc.)
        if (movieData.release_dates) {
            const contentRatingData = transformContentRatings(movieData.release_dates, content.id);
            await dbService.saveMetadata(contentRatingData);
            savedCounts.content_ratings = contentRatingData.length;
        }

        // 18. SAVE ALTERNATIVE TITLES
        if (movieData.alternative_titles) {
            const altTitleData = transformAlternativeTitles(movieData.alternative_titles, content.id);
            await dbService.saveMetadata(altTitleData);
            savedCounts.alternative_titles = altTitleData.length;
        }

        // Single summary log
        log.info(`✅ Movie ${movieId} (${movieData.title})`, savedCounts);
        
    } catch (error) {
        log.error(`Error processing movie from ${url}:`, error as Error);
        throw error;
    } finally {
        await dbService.close();
    }
}