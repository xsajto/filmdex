import { Prisma } from '../../../../generated/prisma';
import type { TvSeriesDetailsData, TvSeasonDetailsData, TvEpisodeDetailsData } from '../types/tv.types';

/**
 * Transform raw TMDB TV series data to Prisma Content model
 */
export function transformTvSeriesToContent(tvData: TvSeriesDetailsData, remoteId: string | number, sourceUrl: string): Prisma.ContentCreateInput {
    return {
        remoteId: String(remoteId),
        remoteSource: 'tmdb',
        title: tvData.name || `TV Show ${remoteId}`,
        originalTitle: tvData.original_name || tvData.name,
        type: 'series',
        year: tvData.first_air_date ? new Date(tvData.first_air_date).getFullYear() : null,
        releaseDate: tvData.first_air_date ? new Date(tvData.first_air_date) : null,
        duration: tvData.episode_run_time?.[0] || null,
        description: tvData.overview || null,
        tagline: tvData.tagline || null,
        rating: tvData.vote_average || null,
        voteCount: tvData.vote_count || null,
        popularity: tvData.popularity || null,
        status: tvData.status || null,
        sourceUrl: sourceUrl,
        sourceMetadata: JSON.stringify(tvData),
        lastCrawledAt: new Date()
    };
}

/**
 * Transform TMDB TV series data for upsert operation
 */
export function transformTvSeriesForUpsert(tvData: TvSeriesDetailsData, remoteId: string | number, sourceUrl: string): {
    where: Prisma.ContentWhereUniqueInput;
    create: Prisma.ContentCreateInput;
    update: Prisma.ContentUpdateInput;
} {
    const baseData = transformTvSeriesToContent(tvData, remoteId, sourceUrl);
    
    return {
        where: {
            remoteId_remoteSource: {
                remoteId: String(remoteId),
                remoteSource: 'tmdb'
            }
        },
        create: baseData,
        update: {
            ...baseData,
            updatedAt: new Date()
        }
    };
}

/**
 * Transform TMDB season data to Prisma Content model
 */
export function transformSeasonToContent(
    seasonData: TvSeasonDetailsData, 
    tvId: string, 
    seasonNumber: number, 
    sourceUrl: string,
    parentContentId?: number
): Prisma.ContentCreateInput {
    const remoteId = `${tvId}-season-${seasonNumber}`;
    
    const baseData: Prisma.ContentCreateInput = {
        remoteId: remoteId,
        remoteSource: 'tmdb',
        title: seasonData.name || `Season ${seasonNumber}`,
        originalTitle: seasonData.name || `Season ${seasonNumber}`,
        type: 'season',
        year: seasonData.air_date ? new Date(seasonData.air_date).getFullYear() : null,
        releaseDate: seasonData.air_date ? new Date(seasonData.air_date) : null,
        description: seasonData.overview || null,
        rating: seasonData.vote_average || null,
        sourceUrl: sourceUrl,
        sourceMetadata: JSON.stringify(seasonData),
        lastCrawledAt: new Date()
    };
    
    // Add parent relationship if provided
    if (parentContentId) {
        baseData.parent = {
            connect: { id: parentContentId }
        };
    }
    
    return baseData;
}

/**
 * Transform TMDB season data for upsert operation
 */
export function transformSeasonForUpsert(
    seasonData: TvSeasonDetailsData,
    tvId: string,
    seasonNumber: number,
    sourceUrl: string,
    parentContentId?: number
): {
    where: Prisma.ContentWhereUniqueInput;
    create: Prisma.ContentCreateInput;
    update: Prisma.ContentUpdateInput;
} {
    const remoteId = `${tvId}-season-${seasonNumber}`;
    const baseData = transformSeasonToContent(seasonData, tvId, seasonNumber, sourceUrl, parentContentId);
    
    return {
        where: {
            remoteId_remoteSource: {
                remoteId: String(remoteId),
                remoteSource: 'tmdb'
            }
        },
        create: baseData,
        update: {
            ...baseData,
            updatedAt: new Date()
        }
    };
}

/**
 * Transform TMDB episode data to Prisma Content model
 */
export function transformEpisodeToContent(
    episodeData: TvEpisodeDetailsData,
    tvId: string,
    seasonNumber: number,
    episodeNumber: number,
    sourceUrl: string,
    parentContentId?: number
): Prisma.ContentCreateInput {
    const remoteId = `${tvId}-season-${seasonNumber}-episode-${episodeNumber}`;
    
    const baseData: Prisma.ContentCreateInput = {
        remoteId: remoteId,
        remoteSource: 'tmdb',
        title: episodeData.name || `Episode ${episodeNumber}`,
        originalTitle: episodeData.name || `Episode ${episodeNumber}`,
        type: 'episode',
        year: episodeData.air_date ? new Date(episodeData.air_date).getFullYear() : null,
        releaseDate: episodeData.air_date ? new Date(episodeData.air_date) : null,
        duration: episodeData.runtime || null,
        description: episodeData.overview || null,
        rating: episodeData.vote_average || null,
        voteCount: episodeData.vote_count || null,
        sourceUrl: sourceUrl,
        sourceMetadata: JSON.stringify(episodeData),
        lastCrawledAt: new Date()
    };
    
    // Add parent relationship if provided
    if (parentContentId) {
        baseData.parent = {
            connect: { id: parentContentId }
        };
    }
    
    return baseData;
}

/**
 * Transform TMDB episode data for upsert operation
 */
export function transformEpisodeForUpsert(
    episodeData: TvEpisodeDetailsData,
    tvId: string,
    seasonNumber: number,
    episodeNumber: number,
    sourceUrl: string,
    parentContentId?: number
): {
    where: Prisma.ContentWhereUniqueInput;
    create: Prisma.ContentCreateInput;
    update: Prisma.ContentUpdateInput;
} {
    const remoteId = `${tvId}-season-${seasonNumber}-episode-${episodeNumber}`;
    const baseData = transformEpisodeToContent(episodeData, tvId, seasonNumber, episodeNumber, sourceUrl, parentContentId);
    
    return {
        where: {
            remoteId_remoteSource: {
                remoteId: String(remoteId),
                remoteSource: 'tmdb'
            }
        },
        create: baseData,
        update: {
            ...baseData,
            updatedAt: new Date()
        }
    };
}

/**
 * Transform TMDB networks to Prisma Organization models
 */
export function transformNetworks(networks: Array<{ id: number; name: string; logo_path?: string; origin_country?: string }>): Prisma.OrganizationCreateInput[] {
    return networks.map(network => ({
        remoteId: network.id.toString(),
        remoteSource: 'tmdb',
        type: 'network',
        name: network.name,
        logoPath: network.logo_path || null,
        originCountry: network.origin_country || null
    }));
}

/**
 * Transform origin countries to content-country relationships
 */
export function transformOriginCountries(
    originCountries: string[],
    contentId: number
): {
    countries: Prisma.CountryCreateInput[];
    contentCountries: Prisma.ContentCountryCreateManyInput[];
} {
    const countries: Prisma.CountryCreateInput[] = [];
    const contentCountries: Prisma.ContentCountryCreateManyInput[] = [];
    
    for (const countryCode of originCountries) {
        countries.push({
            code: countryCode,
            name: countryCode // We only have the code from TMDB
        });
        
        contentCountries.push({
            contentId: contentId,
            countryId: 0, // Will be resolved during database operation
            role: 'origin',
            remoteSource: 'tmdb'
        });
    }
    
    return { countries, contentCountries };
}