import { Prisma } from '../../../../generated/prisma';
import type { MovieDetailsData } from '../types/movie.types';

/**
 * Transform raw TMDB movie data to Prisma Content model
 */
export function transformMovieToContent(movieData: MovieDetailsData, remoteId: string | number, sourceUrl: string): Prisma.ContentCreateInput {
    return {
        remoteId: String(remoteId),
        remoteSource: 'tmdb',
        title: movieData.title || `Movie ${remoteId}`,
        originalTitle: movieData.original_title || movieData.title,
        type: 'movie',
        year: movieData.release_date ? new Date(movieData.release_date).getFullYear() : null,
        releaseDate: movieData.release_date ? new Date(movieData.release_date) : null,
        duration: movieData.runtime || null,
        description: movieData.overview || null,
        tagline: movieData.tagline || null,
        rating: movieData.vote_average || null,
        voteCount: movieData.vote_count || null,
        popularity: movieData.popularity || null,
        status: movieData.status || null,
        budget: movieData.budget || null,
        revenue: movieData.revenue || null,
        sourceUrl: sourceUrl,
        sourceMetadata: JSON.stringify(movieData),
        lastCrawledAt: new Date()
    };
}

/**
 * Transform TMDB movie data for upsert operation
 */
export function transformMovieForUpsert(movieData: MovieDetailsData, remoteId: string | number, sourceUrl: string): {
    where: Prisma.ContentWhereUniqueInput;
    create: Prisma.ContentCreateInput;
    update: Prisma.ContentUpdateInput;
} {
    const baseData = transformMovieToContent(movieData, remoteId, sourceUrl);
    
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
 * Transform TMDB genres to Prisma Genre models
 */
export function transformGenres(genres: Array<{ id: number; name: string }>): Prisma.GenreCreateInput[] {
    return genres.map(genre => ({
        slug: createSlug(genre.name),
        name: genre.name,
        remoteId: genre.id.toString(),
        remoteSource: 'tmdb'
    }));
}

/**
 * Transform TMDB production countries to Prisma Country models
 */
export function transformProductionCountries(countries: Array<{ iso_3166_1: string; name: string }>): Prisma.CountryCreateInput[] {
    return countries.map(country => ({
        code: country.iso_3166_1,
        name: country.name
    }));
}

/**
 * Transform TMDB spoken languages to Prisma Language models
 */
export function transformSpokenLanguages(languages: Array<{ iso_639_1: string; name: string; english_name?: string }>): Prisma.LanguageCreateInput[] {
    return languages.map(language => ({
        code: language.iso_639_1,
        name: language.english_name || language.name,
        nativeName: language.name
    }));
}

/**
 * Transform TMDB production companies to Prisma Organization models
 */
export function transformProductionCompanies(companies: Array<{ id: number; name: string; logo_path?: string; origin_country?: string }>): Prisma.OrganizationCreateInput[] {
    return companies.map(company => ({
        remoteId: company.id.toString(),
        remoteSource: 'tmdb',
        type: 'company',
        name: company.name,
        logoPath: company.logo_path || null,
        originCountry: company.origin_country || null
    }));
}

/**
 * Transform TMDB collection to Prisma Collection model
 */
export function transformCollection(collection: { id: number; name: string; poster_path?: string; backdrop_path?: string }): Prisma.CollectionCreateInput {
    return {
        remoteId: collection.id.toString(),
        remoteSource: 'tmdb',
        name: collection.name,
        description: null
    };
}

/**
 * Transform TMDB keywords to Prisma Keyword models
 */
export function transformKeywords(keywords: Array<{ id: number; name: string }>): Prisma.KeywordCreateInput[] {
    return keywords.map(keyword => ({
        slug: createSlug(keyword.name),
        name: keyword.name,
        remoteId: keyword.id.toString(),
        remoteSource: 'tmdb'
    }));
}

/**
 * Transform TMDB external IDs to Prisma ExternalId models
 */
export function transformExternalIds(externalIds: Record<string, string | null>, entityType: string, entityId: number): Prisma.ExternalIdCreateInput[] {
    const results: Prisma.ExternalIdCreateInput[] = [];
    
    for (const [provider, externalId] of Object.entries(externalIds)) {
        if (externalId && String(externalId).trim()) {
            results.push({
                entityType: entityType,
                entityId: entityId,
                source: provider,
                externalId: String(externalId).trim()
            });
        }
    }
    
    return results;
}

/**
 * Transform TMDB images to Prisma Media models
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformImages(images: any, entityType: string, entityId: number): Prisma.MediaCreateInput[] {
    const results: Prisma.MediaCreateInput[] = [];
    
    // Transform backdrops
    if (images.backdrops && Array.isArray(images.backdrops)) {
        for (const backdrop of images.backdrops) {
            results.push({
                ...(entityType === 'content' ? { contentId: entityId } : { personId: entityId }),
                type: 'image',
                subtype: 'backdrop',
                url: backdrop.file_path,
                width: backdrop.width || null,
                height: backdrop.height || null,
                aspectRatio: backdrop.aspect_ratio || null,
                language: backdrop.iso_639_1 || null,
                voteAverage: backdrop.vote_average || null,
                voteCount: backdrop.vote_count || null,
                sourceUrl: `https://image.tmdb.org/t/p/original${backdrop.file_path}`,
                remoteSource: 'tmdb'
            });
        }
    }
    
    // Transform posters
    if (images.posters && Array.isArray(images.posters)) {
        for (const poster of images.posters) {
            results.push({
                ...(entityType === 'content' ? { contentId: entityId } : { personId: entityId }),
                type: 'image',
                subtype: 'poster',
                url: poster.file_path,
                width: poster.width || null,
                height: poster.height || null,
                aspectRatio: poster.aspect_ratio || null,
                language: poster.iso_639_1 || null,
                voteAverage: poster.vote_average || null,
                voteCount: poster.vote_count || null,
                sourceUrl: `https://image.tmdb.org/t/p/original${poster.file_path}`,
                remoteSource: 'tmdb'
            });
        }
    }
    
    // Transform logos
    if (images.logos && Array.isArray(images.logos)) {
        for (const logo of images.logos) {
            results.push({
                ...(entityType === 'content' ? { contentId: entityId } : { personId: entityId }),
                type: 'image',
                subtype: 'logo',
                url: logo.file_path,
                width: logo.width || null,
                height: logo.height || null,
                aspectRatio: logo.aspect_ratio || null,
                language: logo.iso_639_1 || null,
                voteAverage: logo.vote_average || null,
                voteCount: logo.vote_count || null,
                sourceUrl: `https://image.tmdb.org/t/p/original${logo.file_path}`,
                remoteSource: 'tmdb'
            });
        }
    }
    
    return results;
}

/**
 * Transform TMDB videos to Prisma Media models
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformVideos(videos: any, entityType: string, entityId: number): Prisma.MediaCreateInput[] {
    const results: Prisma.MediaCreateInput[] = [];
    
    if (videos.results && Array.isArray(videos.results)) {
        for (const video of videos.results) {
            results.push({
                ...(entityType === 'content' ? { contentId: entityId } : { personId: entityId }),
                type: 'video',
                subtype: video.type?.toLowerCase() || 'video',
                title: video.name || null,
                url: video.key || null,
                site: video.site || null,
                language: video.iso_639_1 || null,
                size: video.size || null,
                publishedAt: video.published_at ? new Date(video.published_at) : null,
                sourceUrl: `https://www.youtube.com/watch?v=${video.key}`,
                remoteSource: 'tmdb'
            });
        }
    }
    
    return results;
}

/**
 * Utility function to create URL-friendly slugs
 */
function createSlug(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
}

/**
 * Transform TMDB reviews to Prisma Review models
 */
export function transformReviews(reviews: any, contentId: number): Prisma.ReviewCreateInput[] {
    if (!reviews?.results || !Array.isArray(reviews.results)) {
        return [];
    }

    return reviews.results.map((review: any) => ({
        remoteId: review.id || null,
        remoteSource: 'tmdb',
        author: review.author || 'Unknown',
        rating: review.author_details?.rating || null,
        title: null,
        content: review.content || null,
        language: review.iso_639_1 || null,
        publishedAt: review.created_at ? new Date(review.created_at) : null,
        sourceMetadata: JSON.stringify(review),
        sourceUrl: review.url || '',
        detailUrl: review.url || '',
        contentItem: {
            connect: { id: contentId }
        }
    }));
}

/**
 * Transform TMDB translations to Prisma Translation models
 */
export function transformTranslations(translations: any, contentId: number): Prisma.TranslationCreateInput[] {
    if (!translations?.translations || !Array.isArray(translations.translations)) {
        return [];
    }

    const results: Prisma.TranslationCreateInput[] = [];
    
    for (const translation of translations.translations) {
        const languageCode = translation.iso_639_1 || 'unknown';
        const data = translation.data || {};
        
        // Create translation for each field that has content
        if (data.title) {
            results.push({
                translatable_type: 'Content',
                translatable_id: contentId,
                field_name: 'title',
                country_code: translation.iso_3166_1 || null,
                translated_value: data.title,
                original_value: null,
                remote_source: 'tmdb',
                source_metadata: JSON.stringify(translation),
                language: {
                    connectOrCreate: {
                        where: { code: languageCode },
                        create: {
                            code: languageCode,
                            name: translation.english_name || translation.name || 'Unknown',
                            nativeName: translation.name || null
                        }
                    }
                }
            });
        }
        
        if (data.overview) {
            results.push({
                translatable_type: 'Content',
                translatable_id: contentId,
                field_name: 'overview',
                country_code: translation.iso_3166_1 || null,
                translated_value: data.overview,
                original_value: null,
                remote_source: 'tmdb',
                source_metadata: JSON.stringify(translation),
                language: {
                    connectOrCreate: {
                        where: { code: languageCode },
                        create: {
                            code: languageCode,
                            name: translation.english_name || translation.name || 'Unknown',
                            nativeName: translation.name || null
                        }
                    }
                }
            });
        }
        
        if (data.tagline) {
            results.push({
                translatable_type: 'Content',
                translatable_id: contentId,
                field_name: 'tagline',
                country_code: translation.iso_3166_1 || null,
                translated_value: data.tagline,
                original_value: null,
                remote_source: 'tmdb',
                source_metadata: JSON.stringify(translation),
                language: {
                    connectOrCreate: {
                        where: { code: languageCode },
                        create: {
                            code: languageCode,
                            name: translation.english_name || translation.name || 'Unknown',
                            nativeName: translation.name || null
                        }
                    }
                }
            });
        }
    }
    
    return results;
}

/**
 * Transform TMDB watch providers to Metadata models
 */
export function transformWatchProviders(watchProviders: any, contentId: number): Prisma.MetadataCreateInput[] {
    if (!watchProviders?.results) {
        return [];
    }

    const metadata: Prisma.MetadataCreateInput[] = [];

    // Process each country's watch providers
    for (const [countryCode, providers] of Object.entries(watchProviders.results)) {
        if (providers && typeof providers === 'object') {
            metadata.push({
                metadatable_type: 'Content',
                metadatable_id: contentId,
                type: 'watch_providers',
                subtype: countryCode,
                value: JSON.stringify(providers),
                country_code: countryCode,
                remote_source: 'tmdb',
                source_data: JSON.stringify(providers)
            });
        }
    }

    return metadata;
}

/**
 * Transform TMDB content ratings to Metadata models
 */
export function transformContentRatings(contentRatings: any, contentId: number): Prisma.MetadataCreateInput[] {
    if (!contentRatings?.results || !Array.isArray(contentRatings.results)) {
        return [];
    }

    return contentRatings.results.map((rating: any) => ({
        metadatable_type: 'Content',
        metadatable_id: contentId,
        type: 'content_rating',
        subtype: rating.iso_3166_1,
        value: rating.rating || '',
        country_code: rating.iso_3166_1,
        remote_source: 'tmdb',
        source_data: JSON.stringify(rating)
    }));
}

/**
 * Transform TMDB alternative titles to Metadata models
 */
export function transformAlternativeTitles(altTitles: any, contentId: number): Prisma.MetadataCreateInput[] {
    if (!altTitles?.titles || !Array.isArray(altTitles.titles)) {
        return [];
    }

    return altTitles.titles.map((title: any) => ({
        metadatable_type: 'Content',
        metadatable_id: contentId,
        type: 'alternative_title',
        subtype: title.iso_3166_1 || 'unknown',
        value: title.title || '',
        country_code: title.iso_3166_1 || null,
        remote_source: 'tmdb',
        source_data: JSON.stringify(title)
    }));
}