import { PrismaClient } from '../../generated/prisma';

export interface ExternalIdsUtil {
    saveTmdbExternalIds(entityType: string, entityId: number, externalIds: Record<string, string | null>): Promise<void>;
}

export function createExternalIdsUtil(prisma: PrismaClient): ExternalIdsUtil {
    return {
        async saveTmdbExternalIds(entityType: string, entityId: number, externalIds: Record<string, string | null>): Promise<void> {
            try {
                // Handle different external ID sources
                const externalIdMappings = [
                    { source: 'imdb', field: 'imdb_id' },
                    { source: 'facebook', field: 'facebook_id' },
                    { source: 'instagram', field: 'instagram_id' },
                    { source: 'twitter', field: 'twitter_id' },
                    { source: 'wikidata', field: 'wikidata_id' },
                    { source: 'freebase', field: 'freebase_id' },
                    { source: 'tvdb', field: 'tvdb_id' },
                    { source: 'tvrage', field: 'tvrage_id' }
                ];

                for (const mapping of externalIdMappings) {
                    const externalId = externalIds[mapping.field];
                    if (externalId && String(externalId).trim() !== '') {
                        // Upsert the external ID
                        await prisma.externalId.upsert({
                            where: {
                                source_externalId_entityType_entityId: {
                                    source: mapping.source,
                                    externalId: String(externalId).trim(),
                                    entityType: entityType,
                                    entityId: entityId
                                }
                            },
                            update: {
                                updatedAt: new Date()
                            },
                            create: {
                                source: mapping.source,
                                externalId: String(externalId).trim(),
                                entityType: entityType,
                                entityId: entityId
                            }
                        });
                    }
                }


            } catch (error) {
                console.error(`Error saving external IDs for ${entityType} ${entityId}:`, error);
                throw error;
            }
        }
    };
}