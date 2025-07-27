import { Prisma } from '../../../../generated/prisma';

/**
 * Transform TMDB recommendations data to ContentRelations models
 */
export function transformRecommendations(
    sourceContentId: number, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recommendationsData: any
): {
    relations: Prisma.ContentRelationsCreateInput[];
    targetContent: Prisma.ContentCreateInput[];
} {
    const relations: Prisma.ContentRelationsCreateInput[] = [];
    const targetContent: Prisma.ContentCreateInput[] = [];
    
    if (recommendationsData.results && Array.isArray(recommendationsData.results)) {
        for (const recommendation of recommendationsData.results) {
            if (recommendation.id) {
                // Create minimal target content record
                const contentType = recommendation.media_type === 'tv' ? 'series' : (recommendation.media_type || 'movie');
                const title = recommendation.title || recommendation.name || `Unknown ${contentType}`;
                
                const targetContentData = {
                    remoteId: recommendation.id.toString(),
                    remoteSource: 'tmdb',
                    title: title,
                    originalTitle: recommendation.original_title || recommendation.original_name || title,
                    type: contentType,
                    year: recommendation.release_date ? new Date(recommendation.release_date).getFullYear() : 
                          recommendation.first_air_date ? new Date(recommendation.first_air_date).getFullYear() : null,
                    releaseDate: recommendation.release_date ? new Date(recommendation.release_date) : 
                               recommendation.first_air_date ? new Date(recommendation.first_air_date) : null,
                    description: recommendation.overview || null,
                    rating: recommendation.vote_average || null,
                    popularity: recommendation.popularity || null,
                    voteCount: recommendation.vote_count || null,
                    sourceUrl: `https://www.themoviedb.org/${contentType === 'series' ? 'tv' : 'movie'}/${recommendation.id}`,
                    sourceMetadata: JSON.stringify(recommendation),
                    lastCrawledAt: new Date()
                };
                
                targetContent.push(targetContentData);
                
                // Create the relation
                relations.push({
                    sourceContent: {
                        connect: { id: sourceContentId }
                    },
                    targetContent: {
                        connectOrCreate: {
                            where: {
                                remoteId_remoteSource: {
                                    remoteId: recommendation.id.toString(),
                                    remoteSource: 'tmdb'
                                }
                            },
                            create: targetContentData
                        }
                    },
                    type: 'recommendation',
                    remoteSource: 'tmdb'
                });
            }
        }
    }
    
    return { relations, targetContent };
}

/**
 * Transform TMDB similar content data to ContentRelations models
 */
export function transformSimilarContent(
    sourceContentId: number, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    similarData: any
): {
    relations: Prisma.ContentRelationsCreateInput[];
    targetContent: Prisma.ContentCreateInput[];
} {
    const relations: Prisma.ContentRelationsCreateInput[] = [];
    const targetContent: Prisma.ContentCreateInput[] = [];
    
    if (similarData.results && Array.isArray(similarData.results)) {
        for (const similar of similarData.results) {
            if (similar.id) {
                // Create minimal target content record
                const contentType = similar.media_type === 'tv' ? 'series' : (similar.media_type || 'movie');
                const title = similar.title || similar.name || `Unknown ${contentType}`;
                
                const targetContentData = {
                    remoteId: similar.id.toString(),
                    remoteSource: 'tmdb',
                    title: title,
                    originalTitle: similar.original_title || similar.original_name || title,
                    type: contentType,
                    year: similar.release_date ? new Date(similar.release_date).getFullYear() : 
                          similar.first_air_date ? new Date(similar.first_air_date).getFullYear() : null,
                    releaseDate: similar.release_date ? new Date(similar.release_date) : 
                               similar.first_air_date ? new Date(similar.first_air_date) : null,
                    description: similar.overview || null,
                    rating: similar.vote_average || null,
                    popularity: similar.popularity || null,
                    voteCount: similar.vote_count || null,
                    sourceUrl: `https://www.themoviedb.org/${contentType === 'series' ? 'tv' : 'movie'}/${similar.id}`,
                    sourceMetadata: JSON.stringify(similar),
                    lastCrawledAt: new Date()
                };
                
                targetContent.push(targetContentData);
                
                // Create the relation
                relations.push({
                    sourceContent: {
                        connect: { id: sourceContentId }
                    },
                    targetContent: {
                        connectOrCreate: {
                            where: {
                                remoteId_remoteSource: {
                                    remoteId: similar.id.toString(),
                                    remoteSource: 'tmdb'
                                }
                            },
                            create: targetContentData
                        }
                    },
                    type: 'similar',
                    remoteSource: 'tmdb'
                });
            }
        }
    }
    
    return { relations, targetContent };
}

