import { Prisma } from '../../../generated/prisma';
import { BaseDatabaseService } from './base.database.service';

/**
 * Database Service - Pure Prisma operations only
 * No business logic, no data transformation, just database operations
 */
export class DatabaseService extends BaseDatabaseService {

    // ===== CONTENT OPERATIONS =====

    /**
     * Create new content
     */
    async createContent(data: Prisma.ContentCreateInput): Promise<{ id: number }> {
        return this.prisma.content.create({
            data,
            select: { id: true }
        });
    }

    /**
     * Upsert content
     */
    async upsertContent(params: {
        where: Prisma.ContentWhereUniqueInput;
        create: Prisma.ContentCreateInput;
        update: Prisma.ContentUpdateInput;
    }): Promise<{ id: number }> {
        return this.prisma.content.upsert({
            ...params,
            select: { id: true }
        });
    }

    /**
     * Find content by criteria
     */
    async findContent(where: Prisma.ContentWhereInput): Promise<{ id: number } | null> {
        return this.prisma.content.findFirst({
            where,
            select: { id: true }
        });
    }

    /**
     * Find content by unique criteria
     */
    async findUniqueContent(where: Prisma.ContentWhereUniqueInput): Promise<{ id: number } | null> {
        return this.prisma.content.findUnique({
            where,
            select: { id: true }
        });
    }

    // ===== PERSON OPERATIONS =====

    /**
     * Create new person
     */
    async createPerson(data: Prisma.PersonCreateInput): Promise<{ id: number }> {
        return this.prisma.person.create({
            data,
            select: { id: true }
        });
    }

    /**
     * Upsert person
     */
    async upsertPerson(params: {
        where: Prisma.PersonWhereUniqueInput;
        create: Prisma.PersonCreateInput;
        update: Prisma.PersonUpdateInput;
    }): Promise<{ id: number }> {
        return this.prisma.person.upsert({
            ...params,
            select: { id: true }
        });
    }

    /**
     * Find person by criteria
     */
    async findPerson(where: Prisma.PersonWhereInput): Promise<{ id: number } | null> {
        return this.prisma.person.findFirst({
            where,
            select: { id: true }
        });
    }

    // ===== CAST OPERATIONS =====

    /**
     * Create cast members in batch
     */
    async createCastMembers(data: Prisma.CastCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.cast.createMany({
            data,
            skipDuplicates: true
        });
    }

    /**
     * Create single cast member
     */
    async createCastMember(data: Prisma.CastCreateInput): Promise<void> {
        const contentId = data.content?.connect?.id;
        const personId = data.person?.connect?.id || data.person?.connectOrCreate?.where?.remoteId_remoteSource?.remoteId;
        
        if (!contentId || !personId) {
            // If we can't extract IDs, use create with constraint violation handling
            try {
                await this.prisma.cast.create({ data });
            } catch (error) {
                // Handle constraint violations gracefully
                if ((error as any)?.code === 'P2002') {
                    console.debug('Cast relationship already exists, skipping duplicate');
                } else {
                    throw error;
                }
            }
            return;
        }

        try {
            await this.prisma.cast.upsert({
                where: {
                    contentId_personId_role_character: {
                        contentId: contentId,
                        personId: typeof personId === 'string' ? parseInt(personId) : personId,
                        role: data.role,
                        character: data.character || ''
                    }
                },
                create: data,
                update: {
                    character: data.character,
                    department: data.department,
                    order: data.order,
                    episodeCount: data.episodeCount,
                    remoteSource: data.remoteSource
                }
            });
        } catch (error) {
            // Handle race condition where multiple workers try to create the same cast member
            if ((error as any)?.code === 'P2002') {
                console.debug('Cast relationship already exists, skipping duplicate');
            } else {
                throw error;
            }
        }
    }

    /**
     * Upsert cast member
     */
    async upsertCastMember(params: {
        where: Prisma.CastWhereUniqueInput;
        create: Prisma.CastCreateInput;
        update: Prisma.CastUpdateInput;
    }): Promise<void> {
        try {
            await this.prisma.cast.upsert(params);
        } catch (error) {
            // Handle race condition where multiple workers try to create the same cast member
            if ((error as any)?.code === 'P2002') {
                console.debug('Cast relationship already exists, skipping duplicate');
            } else {
                throw error;
            }
        }
    }

    /**
     * Delete cast members for content
     */
    async deleteCastByContent(contentId: number): Promise<{ count: number }> {
        return this.prisma.cast.deleteMany({
            where: { contentId }
        });
    }

    // ===== CONTENT RELATIONS OPERATIONS =====

    /**
     * Create content relations in batch
     */
    async createContentRelations(data: Prisma.ContentRelationsCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.contentRelations.createMany({
            data,
            skipDuplicates: true
        });
    }

    /**
     * Create single content relation
     */
    async createContentRelation(data: Prisma.ContentRelationsCreateInput): Promise<void> {
        const sourceContentId = data.sourceContent?.connect?.id;
        const targetContentId = data.targetContent?.connect?.id;
        
        // Handle different relation patterns
        if (sourceContentId && targetContentId) {
            // Simple connect pattern - use upsert with known IDs
            try {
                await this.prisma.contentRelations.upsert({
                    where: {
                        sourceContentId_targetContentId_type_remoteSource: {
                            sourceContentId: sourceContentId,
                            targetContentId: targetContentId,
                            type: data.type,
                            remoteSource: data.remoteSource
                        }
                    },
                    create: data,
                    update: {
                        remoteSource: data.remoteSource
                    }
                });
            } catch (error) {
                // Ignore constraint violations - relation already exists
                if ((error as any)?.code !== 'P2002') {
                    throw error;
                }
            }
        } else {
            // ConnectOrCreate pattern - let Prisma handle it, but catch constraint violations
            try {
                await this.prisma.contentRelations.create({ data });
            } catch (error) {
                // Ignore constraint violations - relation already exists
                if ((error as any)?.code !== 'P2002') {
                    throw error;
                }
            }
        }
    }

    /**
     * Upsert content relation
     */
    async upsertContentRelation(params: {
        where: Prisma.ContentRelationsWhereUniqueInput;
        create: Prisma.ContentRelationsCreateInput;
        update: Prisma.ContentRelationsUpdateInput;
    }): Promise<void> {
        await this.prisma.contentRelations.upsert(params);
    }

    /**
     * Delete content relations by source
     */
    async deleteContentRelationsBySource(sourceContentId: number, type?: string): Promise<{ count: number }> {
        const where: Prisma.ContentRelationsWhereInput = { sourceContentId };
        if (type) where.type = type;
        
        return this.prisma.contentRelations.deleteMany({ where });
    }

    // ===== GENRE OPERATIONS =====

    /**
     * Upsert genre
     */
    async upsertGenre(params: {
        where: Prisma.GenreWhereUniqueInput;
        create: Prisma.GenreCreateInput;
        update: Prisma.GenreUpdateInput;
    }): Promise<{ id: number }> {
        return this.prisma.genre.upsert({
            ...params,
            select: { id: true }
        });
    }

    /**
     * Create content-genre relationship
     */
    async createContentGenre(data: Prisma.ContentGenreCreateInput): Promise<void> {
        const contentId = data.content?.connect?.id;
        const genreId = data.genre?.connect?.id;
        
        if (!contentId || !genreId) {
            throw new Error('ContentGenre requires valid contentId and genreId');
        }

        try {
            await this.prisma.contentGenre.upsert({
                where: {
                    contentId_genreId: {
                        contentId: contentId,
                        genreId: genreId
                    }
                },
                create: data,
                update: {
                    remoteSource: data.remoteSource
                }
            });
        } catch (error) {
            // Handle constraint violations gracefully
            if ((error as any)?.code === 'P2002') {
                // Relationship already exists, try to update it
                try {
                    await this.prisma.contentGenre.updateMany({
                        where: {
                            contentId: contentId,
                            genreId: genreId
                        },
                        data: {
                            remoteSource: data.remoteSource
                        }
                    });
                } catch {
                    // If update also fails, the relationship exists and is fine
                    console.debug(`ContentGenre relationship ${contentId}-${genreId} already exists`);
                }
            } else {
                throw error;
            }
        }
    }

    /**
     * Create content-genre relationships in batch
     */
    async createContentGenres(data: Prisma.ContentGenreCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.contentGenre.createMany({
            data,
            skipDuplicates: true
        });
    }

    // ===== COUNTRY OPERATIONS =====

    /**
     * Upsert country
     */
    async upsertCountry(params: {
        where: Prisma.CountryWhereUniqueInput;
        create: Prisma.CountryCreateInput;
        update: Prisma.CountryUpdateInput;
    }): Promise<{ id: number }> {
        return this.prisma.country.upsert({
            ...params,
            select: { id: true }
        });
    }

    /**
     * Create content-country relationships in batch
     */
    async createContentCountries(data: Prisma.ContentCountryCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.contentCountry.createMany({
            data,
            skipDuplicates: true
        });
    }

    // ===== LANGUAGE OPERATIONS =====

    /**
     * Upsert language
     */
    async upsertLanguage(params: {
        where: Prisma.LanguageWhereUniqueInput;
        create: Prisma.LanguageCreateInput;
        update: Prisma.LanguageUpdateInput;
    }): Promise<{ id: number }> {
        try {
            return await this.prisma.language.upsert({
                ...params,
                select: { id: true }
            });
        } catch (error) {
            // If constraint violation, try to find existing record
            if ((error as any)?.code === 'P2002') {
                const existing = await this.prisma.language.findFirst({
                    where: { 
                        OR: [
                            { code: (params.create as any).code },
                            { name: (params.create as any).name }
                        ]
                    },
                    select: { id: true }
                });
                if (existing) {
                    return existing;
                }
            }
            throw error;
        }
    }

    /**
     * Create content-language relationships in batch
     */
    async createContentLanguages(data: Prisma.ContentLanguageCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.contentLanguage.createMany({
            data,
            skipDuplicates: true
        });
    }

    // ===== ORGANIZATION OPERATIONS =====

    /**
     * Upsert organization
     */
    async upsertOrganization(params: {
        where: Prisma.OrganizationWhereUniqueInput;
        create: Prisma.OrganizationCreateInput;
        update: Prisma.OrganizationUpdateInput;
    }): Promise<{ id: number }> {
        return this.prisma.organization.upsert({
            ...params,
            select: { id: true }
        });
    }

    /**
     * Create content-organization relationships in batch
     */
    async createContentOrganizations(data: Prisma.ContentOrganizationCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.contentOrganization.createMany({
            data,
            skipDuplicates: true
        });
    }

    // ===== KEYWORD OPERATIONS =====

    /**
     * Upsert keyword
     */
    async upsertKeyword(params: {
        where: Prisma.KeywordWhereUniqueInput;
        create: Prisma.KeywordCreateInput;
        update: Prisma.KeywordUpdateInput;
    }): Promise<{ slug: string }> {
        const result = await this.prisma.keyword.upsert(params);
        return { slug: result.slug };
    }

    /**
     * Create keyword associations in batch
     */
    async createKeywordAssociations(data: Prisma.KeywordAssociationCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.keywordAssociation.createMany({
            data,
            skipDuplicates: true
        });
    }

    // ===== EXTERNAL ID OPERATIONS =====

    /**
     * Create external IDs in batch
     */
    async createExternalIds(data: Prisma.ExternalIdCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.externalId.createMany({
            data,
            skipDuplicates: true
        });
    }

    // ===== MEDIA OPERATIONS =====

    /**
     * Create media items in batch
     */
    async createMedia(data: Prisma.MediaCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.media.createMany({
            data,
            skipDuplicates: true
        });
    }

    // ===== COLLECTION OPERATIONS =====

    /**
     * Upsert collection
     */
    async upsertCollection(params: {
        where: Prisma.CollectionWhereUniqueInput;
        create: Prisma.CollectionCreateInput;
        update: Prisma.CollectionUpdateInput;
    }): Promise<{ id: number }> {
        return this.prisma.collection.upsert({
            ...params,
            select: { id: true }
        });
    }

    // ===== METADATA OPERATIONS =====

    /**
     * Create metadata items in batch
     */
    async createMetadata(data: Prisma.MetadataCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.metadata.createMany({
            data,
            skipDuplicates: true
        });
    }

    /**
     * Upsert metadata item
     */
    async upsertMetadata(params: {
        where: Prisma.MetadataWhereUniqueInput;
        create: Prisma.MetadataCreateInput;
        update: Prisma.MetadataUpdateInput;
    }): Promise<void> {
        await this.prisma.metadata.upsert(params);
    }

    // ===== TRANSLATION OPERATIONS =====

    /**
     * Create translations in batch
     */
    async createTranslations(data: Prisma.TranslationCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.translation.createMany({
            data,
            skipDuplicates: true
        });
    }

    /**
     * Upsert translation
     */
    async upsertTranslation(params: {
        where: Prisma.TranslationWhereUniqueInput;
        create: Prisma.TranslationCreateInput;
        update: Prisma.TranslationUpdateInput;
    }): Promise<void> {
        try {
            await this.prisma.translation.upsert(params);
        } catch (error) {
            // Handle race condition where multiple workers try to create the same translation
            if ((error as any)?.code === 'P2002') {
                console.debug('Translation already exists, skipping duplicate');
            } else {
                throw error;
            }
        }
    }

    // ===== REVIEW OPERATIONS =====

    /**
     * Create reviews in batch
     */
    async createReviews(data: Prisma.ReviewCreateManyInput[]): Promise<{ count: number }> {
        return this.prisma.review.createMany({
            data,
            skipDuplicates: true
        });
    }

    // ===== HIGH-LEVEL OPERATIONS (Business Logic Layer) =====

    /**
     * Save genres for content
     */
    async saveGenres(contentId: number, genreData: Prisma.GenreCreateInput[]): Promise<void> {
        for (const genreInput of genreData) {
            const genre = await this.upsertGenre({
                where: { slug: genreInput.slug },
                create: genreInput,
                update: { ...genreInput, updatedAt: new Date() }
            });
            
            await this.createContentGenre({
                content: { connect: { id: contentId } },
                genre: { connect: { id: genre.id } },
                remoteSource: 'tmdb'
            });
        }
    }

    /**
     * Save countries for content
     */
    async saveCountries(contentId: number, countryData: Prisma.CountryCreateInput[], type: string): Promise<void> {
        for (const countryInput of countryData) {
            const country = await this.upsertCountry({
                where: { code: countryInput.code },
                create: countryInput,
                update: { ...countryInput, updatedAt: new Date() }
            });
            
            await this.prisma.contentCountry.upsert({
                where: {
                    contentId_countryId_role: {
                        contentId: contentId,
                        countryId: country.id,
                        role: type
                    }
                },
                create: {
                    contentId: contentId,
                    countryId: country.id,
                    role: type,
                    remoteSource: 'tmdb'
                },
                update: {
                    remoteSource: 'tmdb'
                }
            });
        }
    }

    /**
     * Save languages for content
     */
    async saveLanguages(contentId: number, languageData: Prisma.LanguageCreateInput[], type: string): Promise<void> {
        for (const languageInput of languageData) {
            const language = await this.upsertLanguage({
                where: { code: languageInput.code },
                create: languageInput,
                update: { ...languageInput, updatedAt: new Date() }
            });
            
            await this.prisma.contentLanguage.upsert({
                where: {
                    contentId_languageId_role: {
                        contentId: contentId,
                        languageId: language.id,
                        role: type
                    }
                },
                create: {
                    contentId: contentId,
                    languageId: language.id,
                    role: type,
                    remoteSource: 'tmdb'
                },
                update: {
                    remoteSource: 'tmdb'
                }
            });
        }
    }

    /**
     * Save organizations for content
     */
    async saveOrganizations(contentId: number, organizationData: Prisma.OrganizationCreateInput[], type: string): Promise<void> {
        for (const orgInput of organizationData) {
            const organization = await this.upsertOrganization({
                where: { name_type_remoteSource: { name: orgInput.name, type: orgInput.type, remoteSource: 'tmdb' } },
                create: orgInput,
                update: { ...orgInput, updatedAt: new Date() }
            });
            
            await this.prisma.contentOrganization.upsert({
                where: {
                    contentId_organizationId_role: {
                        contentId: contentId,
                        organizationId: organization.id,
                        role: type
                    }
                },
                create: {
                    contentId: contentId,
                    organizationId: organization.id,
                    role: type,
                    remoteSource: 'tmdb'
                },
                update: {
                    remoteSource: 'tmdb'
                }
            });
        }
    }

    /**
     * Save collection for content
     */
    async saveCollection(contentId: number, collectionData: Prisma.CollectionCreateInput): Promise<void> {
        await this.upsertCollection({
            where: { name_remoteSource: { name: collectionData.name, remoteSource: 'tmdb' } },
            create: collectionData,
            update: { ...collectionData, updatedAt: new Date() }
        });
    }

    /**
     * Save keywords for content
     */
    async saveKeywords(contentId: number, keywordData: Prisma.KeywordCreateInput[]): Promise<void> {
        for (const keywordInput of keywordData) {
            const keyword = await this.upsertKeyword({
                where: { slug: keywordInput.slug },
                create: keywordInput,
                update: { ...keywordInput, updatedAt: new Date() }
            });
            
            await this.prisma.keywordAssociation.upsert({
                where: {
                    keywordSlug_entityType_entityId: {
                        keywordSlug: keyword.slug,
                        entityType: 'Content',
                        entityId: contentId
                    }
                },
                create: {
                    entityType: 'Content',
                    entityId: contentId,
                    keywordSlug: keyword.slug,
                    remoteSource: 'tmdb'
                },
                update: {
                    remoteSource: 'tmdb'
                }
            });
        }
    }

    /**
     * Save external IDs
     */
    async saveExternalIds(externalIdData: Prisma.ExternalIdCreateInput[]): Promise<void> {
        if (externalIdData.length > 0) {
            await this.createExternalIds(externalIdData);
        }
    }

    /**
     * Save media (images/videos)
     */
    async saveMedia(mediaData: Prisma.MediaCreateInput[]): Promise<void> {
        if (mediaData.length > 0) {
            await this.createMedia(mediaData);
        }
    }

    /**
     * Save credits (cast/crew)
     */
    async saveCredits(contentId: number, creditsData: { allMembers: Prisma.CastCreateInput[]; persons: Prisma.PersonCreateInput[] }): Promise<void> {
        // First ensure all persons exist
        for (const personData of creditsData.persons) {
            await this.upsertPerson({
                where: { remoteId_remoteSource: { remoteId: personData.remoteId, remoteSource: 'tmdb' } },
                create: personData,
                update: { ...personData, updatedAt: new Date() }
            });
        }
        
        // Then create cast relationships
        for (const castData of creditsData.allMembers) {
            await this.createCastMember(castData);
        }
    }

    /**
     * Save content relations (recommendations/similar)
     */
    async saveContentRelations(relationData: Prisma.ContentRelationsCreateInput[]): Promise<void> {
        for (const relationInput of relationData) {
            await this.createContentRelation(relationInput);
        }
    }

    /**
     * Save reviews
     */
    async saveReviews(reviewData: Prisma.ReviewCreateInput[]): Promise<void> {
        for (const reviewInput of reviewData) {
            // Convert ReviewCreateInput to ReviewCreateManyInput by extracting contentItem.connect.id
            const contentId = (reviewInput.contentItem as { connect?: { id: number } })?.connect?.id;
            if (!contentId) {
                console.warn('Review missing contentId, skipping');
                continue;
            }
            
            const reviewCreateManyInput = {
                remoteId: reviewInput.remoteId,
                remoteSource: reviewInput.remoteSource,
                author: reviewInput.author,
                rating: reviewInput.rating,
                title: reviewInput.title,
                content: reviewInput.content,
                language: reviewInput.language,
                publishedAt: reviewInput.publishedAt,
                sourceMetadata: reviewInput.sourceMetadata,
                sourceUrl: reviewInput.sourceUrl,
                detailUrl: reviewInput.detailUrl,
                contentId: contentId,
                createdAt: reviewInput.createdAt,
                updatedAt: reviewInput.updatedAt
            };
            
            await this.createReviews([reviewCreateManyInput]);
        }
    }

    /**
     * Save translations
     */
    async saveTranslations(translationData: Prisma.TranslationCreateInput[]): Promise<void> {
        // Process each translation to ensure language exists first
        for (const translationInput of translationData) {
            // First ensure the language exists
            const languageConnectOrCreate = translationInput.language as any;
            let languageId: number;
            
            if (languageConnectOrCreate?.connectOrCreate) {
                const languageData = languageConnectOrCreate.connectOrCreate;
                const language = await this.upsertLanguage({
                    where: languageData.where,
                    create: languageData.create,
                    update: { ...languageData.create, updatedAt: new Date() }
                });
                languageId = language.id;
            } else if (languageConnectOrCreate?.connect?.id) {
                languageId = languageConnectOrCreate.connect.id;
            } else {
                console.warn('Translation missing language reference, skipping');
                continue;
            }
            
            // Use upsert to handle duplicates
            await this.upsertTranslation({
                where: {
                    translatable_type_translatable_id_field_name_language_id_country_code: {
                        translatable_type: translationInput.translatable_type,
                        translatable_id: translationInput.translatable_id,
                        field_name: translationInput.field_name,
                        language_id: languageId,
                        country_code: translationInput.country_code || ''
                    }
                },
                create: {
                    ...translationInput,
                    language: { connect: { id: languageId } }
                },
                update: {
                    translated_value: translationInput.translated_value,
                    updated_at: new Date()
                }
            });
        }
    }

    /**
     * Save metadata
     */
    async saveMetadata(metadataData: Prisma.MetadataCreateInput[]): Promise<void> {
        for (const metadataInput of metadataData) {
            await this.upsertMetadata({
                where: {
                    metadatable_type_metadatable_id_type_subtype_country_code: {
                        metadatable_type: metadataInput.metadatable_type,
                        metadatable_id: metadataInput.metadatable_id,
                        type: metadataInput.type,
                        subtype: metadataInput.subtype || '',
                        country_code: metadataInput.country_code || ''
                    }
                },
                create: metadataInput,
                update: {
                    value: metadataInput.value,
                    numeric_value: metadataInput.numeric_value,
                    date_value: metadataInput.date_value,
                    remote_source: metadataInput.remote_source,
                    remote_id: metadataInput.remote_id,
                    source_data: metadataInput.source_data,
                    updated_at: new Date()
                }
            });
        }
    }
}