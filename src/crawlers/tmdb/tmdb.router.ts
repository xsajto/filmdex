import { log } from '@crawlus/core';
import { ApiRouter } from '@crawlus/api';
import {
    handleMovie,
    handleTvSeries,
    handleSeason,
    handleEpisode,
    handlePerson,
    MovieParams,
    TvParams,
    SeasonParams,
    EpisodeParams,
    PersonParams
} from './handlers';

export function createTmdbV2Router(): ApiRouter {
    const router = new ApiRouter();
    
    // Debug middleware to log all incoming requests
    router.middleware(async (context, next) => {
        log.debug(`🔍 Router received request: ${context.request.url}`, {
            method: 'POST',
            path: context.request.getUrl().pathname,
            requestParams: context.requestParams
        });
        await next();
    });

    // Movie route with optimized append_to_response
    router.get<MovieParams>('/3/movie/:movieId', handleMovie);

    // TV Show route with optimized append_to_response
    router.get<TvParams>('/3/tv/:tvId', handleTvSeries);

    // Season details route
    router.get<SeasonParams>('/3/tv/:tvId/season/:seasonNumber', handleSeason);
    
    // Episode details route
    router.get<EpisodeParams>('/3/tv/:tvId/season/:seasonNumber/episode/:episodeNumber', handleEpisode);

    // Enhanced person details route
    router.get<PersonParams>('/3/person/:personId', handlePerson);

    // Fallback route for any unmatched TMDB API endpoints
    router.setDefault(async (context) => {
        log.warn(`Unmatched TMDB API route: ${context.request.url}`);
    });

    return router;
}