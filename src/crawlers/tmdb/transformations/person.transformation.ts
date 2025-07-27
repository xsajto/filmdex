import { Prisma } from '../../../../generated/prisma';
import type { PersonDetailsData } from '../types/person.types';
import type { MovieCreditsData, TvSeriesCreditsData } from '../types/credits.types';

/**
 * Convert TMDB gender number to string representation
 */
function convertGender(genderCode: number | null | undefined): string | null {
    if (genderCode === null || genderCode === undefined || genderCode === 0) {
        return null; // Not specified
    }
    
    switch (genderCode) {
        case 1:
            return 'female';
        case 2:
            return 'male';
        case 3:
            return 'nonbinary';
        default:
            return null;
    }
}

/**
 * Transform raw TMDB person data to Prisma Person model
 */
export function transformPersonToPersonModel(personData: PersonDetailsData, remoteId: string, sourceUrl: string): Prisma.PersonCreateInput {
    return {
        remoteId: remoteId,
        remoteSource: 'tmdb',
        name: personData.name || `Person ${remoteId}`,
        biography: personData.biography || null,
        birthDate: personData.birthday ? new Date(personData.birthday) : null,
        deathDate: personData.deathday ? new Date(personData.deathday) : null,
        birthPlace: personData.place_of_birth || null,
        profileUrl: personData.profile_path || null,
        knownForDepartment: personData.known_for_department || null,
        gender: convertGender(personData.gender),
        popularity: personData.popularity || null,
        sourceUrl: sourceUrl,
        sourceMetadata: JSON.stringify(personData),
        lastCrawledAt: new Date()
    };
}

/**
 * Transform TMDB person data for upsert operation
 */
export function transformPersonForUpsert(personData: PersonDetailsData, remoteId: string, sourceUrl: string): {
    where: Prisma.PersonWhereUniqueInput;
    create: Prisma.PersonCreateInput;
    update: Prisma.PersonUpdateInput;
} {
    const baseData = transformPersonToPersonModel(personData, remoteId, sourceUrl);
    
    return {
        where: {
            remoteId_remoteSource: {
                remoteId: remoteId,
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
 * Transform TMDB cast data to Prisma Cast models
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformCastMembers(cast: any[], contentId: number): {
    castMembers: Prisma.CastCreateInput[];
    persons: Prisma.PersonCreateInput[];
} {
    const castMembers: Prisma.CastCreateInput[] = [];
    const persons: Prisma.PersonCreateInput[] = [];
    
    for (const member of cast) {
        if (member.id) {
            // Create minimal person record
            persons.push({
                remoteId: member.id.toString(),
                remoteSource: 'tmdb',
                name: member.name || member.original_name || `Person ${member.id}`,
                profileUrl: member.profile_path || null,
                knownForDepartment: member.known_for_department || null,
                gender: convertGender(member.gender),
                popularity: member.popularity || null,
                sourceUrl: `https://www.themoviedb.org/person/${member.id}`,
                sourceMetadata: JSON.stringify(member),
                lastCrawledAt: new Date()
            });
            
            // Create cast relationship
            castMembers.push({
                content: {
                    connect: { id: contentId }
                },
                role: 'Actor',
                person: {
                    connectOrCreate: {
                        where: {
                            remoteId_remoteSource: {
                                remoteId: member.id.toString(),
                                remoteSource: 'tmdb'
                            }
                        },
                        create: persons[persons.length - 1]
                    }
                },
                character: member.character || null,
                order: member.order || null,
                remoteSource: 'tmdb'
            });
        }
    }
    
    return { castMembers, persons };
}

/**
 * Transform TMDB crew data to Prisma Crew models (using Cast table with role differentiation)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformCrewMembers(crew: any[], contentId: number): {
    crewMembers: Prisma.CastCreateInput[];
    persons: Prisma.PersonCreateInput[];
} {
    const crewMembers: Prisma.CastCreateInput[] = [];
    const persons: Prisma.PersonCreateInput[] = [];
    
    for (const member of crew) {
        if (member.id) {
            // Create minimal person record
            persons.push({
                remoteId: member.id.toString(),
                remoteSource: 'tmdb',
                name: member.name || member.original_name || `Person ${member.id}`,
                knownForDepartment: member.known_for_department || member.department || null,
                gender: convertGender(member.gender),
                popularity: member.popularity || null,
                sourceUrl: `https://www.themoviedb.org/person/${member.id}`,
                sourceMetadata: JSON.stringify(member),
                lastCrawledAt: new Date()
            });
            
            // Create crew relationship (stored in Cast table with different role type)
            crewMembers.push({
                content: {
                    connect: { id: contentId }
                },
                person: {
                    connectOrCreate: {
                        where: {
                            remoteId_remoteSource: {
                                remoteId: member.id.toString(),
                                remoteSource: 'tmdb'
                            }
                        },
                        create: persons[persons.length - 1]
                    }
                },
                role: member.role || member.job,
                department: member.department || null,
                remoteSource: 'tmdb'
            });
        }
    }
    
    return { crewMembers, persons };
}

/**
 * Transform TMDB credits data to combined Cast models
 */
export function transformCredits(credits: MovieCreditsData | TvSeriesCreditsData, contentId: number): {
    allMembers: Prisma.CastCreateInput[];
    persons: Prisma.PersonCreateInput[];
} {
    const allMembers: Prisma.CastCreateInput[] = [];
    const persons: Prisma.PersonCreateInput[] = [];
    
    // Transform cast
    if (credits.cast && Array.isArray(credits.cast)) {
        const { castMembers, persons: castPersons } = transformCastMembers(credits.cast, contentId);
        allMembers.push(...castMembers);
        persons.push(...castPersons);
    }
    
    // Transform crew
    if (credits.crew && Array.isArray(credits.crew)) {
        const { crewMembers, persons: crewPersons } = transformCrewMembers(credits.crew, contentId);
        allMembers.push(...crewMembers);
        persons.push(...crewPersons);
    }
    
    return { allMembers, persons };
}

