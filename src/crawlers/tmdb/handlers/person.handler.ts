import { log } from '@crawlus/core';
import { ApiContext } from '@crawlus/api';
import { DatabaseService } from '../../../shared/database';
import { transformPersonForUpsert, transformExternalIds, transformImages } from '../transformations';
import type { PersonDetailsData } from '../types/person.types';

export interface PersonParams {
    personId: string;
}

export async function handlePerson(context: ApiContext): Promise<void> {
    const { personId } = context.requestParams;
    const url = context.request.url;
    log.debug(`Processing person request: ${url} (ID: ${personId})`);
    
    const dbService = new DatabaseService();
    await dbService.initialize();
    
    try {
        // Get raw person data
        let personData = context.data?.body || context.data;
        
        // If basic person data, fetch enhanced data with append_to_response
        if (!personData?.external_ids && !personData?.images) {
            log.debug(`Fetching enhanced person data with append_to_response for ${personId}`);
            const appendParams = [
                'external_ids',
                'images',
                'combined_credits',
                'translations'
            ].join(',');
            
            const response = await context.apiRequest(`https://api.themoviedb.org/3/person/${personId}?append_to_response=${appendParams}`);
            personData = response.body || response;
        }
        
        if (!personData || !personData.name) {
            log.error(`No person data found for ID ${personId}`, { url, data: personData });
            return;
        }

        const sourceUrl = `https://www.themoviedb.org/person/${personId}`;
        const savedCounts: Record<string, number> = {};

        // 1. SAVE MAIN PERSON
        const personTransform = transformPersonForUpsert(personData as PersonDetailsData, personId, sourceUrl);
        const person = await dbService.upsertPerson(personTransform);

        // 2. SAVE EXTERNAL IDS
        if (personData.external_ids) {
            const externalIdData = transformExternalIds(personData.external_ids, 'person', person.id);
            await dbService.saveExternalIds(externalIdData);
            savedCounts.external_ids = externalIdData.length;
        }

        // 3. SAVE IMAGES
        if (personData.images) {
            const imageData = transformImages(personData.images, 'person', person.id);
            await dbService.saveMedia(imageData);
            savedCounts.images = imageData.length;
        }

        // Count credits for summary
        if (personData.combined_credits) {
            savedCounts.cast_credits = personData.combined_credits.cast?.length || 0;
            savedCounts.crew_credits = personData.combined_credits.crew?.length || 0;
        }
        
        log.info(`✅ Person ${personId} (${personData.name})`, savedCounts);
        
    } catch (error) {
        log.error(`Error processing person from ${url}:`, error as Error);
        throw error;
    } finally {
        await dbService.close();
    }
}