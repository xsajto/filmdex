import express from 'express';
import { PrismaClient } from '../../generated/prisma';
import { log } from '@crawlus/core';

const app: express.Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// API base path
const API_PREFIX = '/api/v1';

// Helper function for pagination
const getPagination = (page: any, limit: any) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    return {
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        page: pageNum,
        limit: limitNum
    };
};

// Helper function for error responses
const handleError = (res: express.Response, error: any, message: string) => {
    log.error(message, error);
    res.status(500).json({ error: message });
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// =============================================================================
// CONTENT ENDPOINTS (Movies, TV Shows, Seasons, Episodes)
// =============================================================================

// List all movies/series with basic info
app.get('/titles', async (req, res) => {
    try {
        const { page, limit, type, source, year, minRating, maxRating, genre, country, language, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: any = {};
        if (type && typeof type === 'string') whereClause.type = type;
        if (source && typeof source === 'string') whereClause.remoteSource = source;
        if (year) whereClause.year = parseInt(year as string);
        if (minRating || maxRating) {
            whereClause.rating = {};
            if (minRating) whereClause.rating.gte = parseFloat(minRating as string);
            if (maxRating) whereClause.rating.lte = parseFloat(maxRating as string);
        }
        if (search && typeof search === 'string') {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { originalTitle: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (genre && typeof genre === 'string') {
            whereClause.genres = { some: { genre: { slug: genre } } };
        }
        if (country && typeof country === 'string') {
            whereClause.countries = { some: { country: { code: country } } };
        }
        if (language && typeof language === 'string') {
            whereClause.languages = { some: { language: { code: language } } };
        }

        const orderBy: any = {};
        if (sortBy === 'rating') orderBy.rating = sortOrder;
        else if (sortBy === 'year') orderBy.year = sortOrder;
        else if (sortBy === 'title') orderBy.title = sortOrder;
        else orderBy.createdAt = sortOrder;

        const [content, total] = await Promise.all([
            prisma.content.findMany({
                where: whereClause,
                select: {
                    id: true,
                    title: true,
                    originalTitle: true,
                    year: true,
                    type: true,
                    remoteSource: true,
                    remoteId: true,
                    rating: true,
                    releaseDate: true,
                    duration: true,
                    description: true,
                    status: true,
                    episodeCount: true,
                    seasonCount: true,
                    genres: {
                        select: { genre: { select: { name: true, slug: true } } }
                    },
                    countries: {
                        select: { country: { select: { name: true, code: true } } }
                    },
                    createdAt: true
                },
                skip: pagination.skip,
                take: pagination.take,
                orderBy
            }),
            prisma.content.count({ where: whereClause })
        ]);

        res.json({
            data: content,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                pages: Math.ceil(total / pagination.limit)
            }
        });
    } catch (err) {
        handleError(res, err, 'Failed to fetch content');
    }
});

// Get detailed content by ID with full relationships
app.get(`${API_PREFIX}/content/:id`, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const content = await prisma.content.findUnique({
            where: { id },
            include: {
                cast: {
                    include: {
                        person: {
                            select: {
                                id: true,
                                name: true,
                                remoteId: true,
                                remoteSource: true,
                                profileUrl: true,
                                knownForDepartment: true
                            }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
                media: {
                    select: {
                        id: true,
                        type: true,
                        subtype: true,
                        title: true,
                        url: true,
                        width: true,
                        height: true,
                        isPrimary: true
                    }
                },
                genres: {
                    select: { genre: { select: { name: true, slug: true } } }
                },
                countries: {
                    select: { 
                        country: { select: { name: true, code: true } },
                        role: true
                    }
                },
                languages: {
                    select: { 
                        language: { select: { name: true, code: true } },
                        role: true
                    }
                },
                organizations: {
                    select: {
                        organization: {
                            select: { id: true, name: true, type: true }
                        },
                        role: true
                    }
                },
                collections: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
                children: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        type: true,
                        seasonNumber: true,
                        episodeNumber: true,
                        rating: true
                    },
                    orderBy: [{ seasonNumber: 'asc' }, { episodeNumber: 'asc' }]
                },
                parent: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        type: true
                    }
                },
                reviews: {
                    select: {
                        id: true,
                        author: true,
                        rating: true,
                        title: true,
                        content: true,
                        publishedAt: true
                    },
                    orderBy: { publishedAt: 'desc' },
                    take: 10
                }
            }
        });
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.json(content);
    } catch (err) {
        handleError(res, err, 'Failed to fetch content details');
    }
});

// Get content by type (movies, series, seasons, episodes)
app.get(`${API_PREFIX}/content/type/:type`, async (req, res) => {
    try {
        const { type } = req.params;
        const { page, limit, search, year, minRating, maxRating, genre, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: any = { type };
        if (search && typeof search === 'string') {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { originalTitle: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (year) whereClause.year = parseInt(year as string);
        if (minRating || maxRating) {
            whereClause.rating = {};
            if (minRating) whereClause.rating.gte = parseFloat(minRating as string);
            if (maxRating) whereClause.rating.lte = parseFloat(maxRating as string);
        }
        if (genre && typeof genre === 'string') {
            whereClause.genres = { some: { genre: { slug: genre } } };
        }

        const orderBy: any = {};
        if (sortBy === 'rating') orderBy.rating = sortOrder;
        else if (sortBy === 'year') orderBy.year = sortOrder;
        else if (sortBy === 'title') orderBy.title = sortOrder;
        else orderBy.createdAt = sortOrder;

        const [content, total] = await Promise.all([
            prisma.content.findMany({
                where: whereClause,
                select: {
                    id: true,
                    title: true,
                    originalTitle: true,
                    year: true,
                    type: true,
                    remoteSource: true,
                    rating: true,
                    duration: true,
                    episodeCount: true,
                    seasonCount: true,
                    seasonNumber: true,
                    episodeNumber: true,
                    genres: {
                        select: { genre: { select: { name: true, slug: true } } }
                    },
                    createdAt: true
                },
                skip: pagination.skip,
                take: pagination.take,
                orderBy
            }),
            prisma.content.count({ where: whereClause })
        ]);

        res.json({
            data: content,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                pages: Math.ceil(total / pagination.limit)
            }
        });
    } catch (err) {
        handleError(res, err, `Failed to fetch ${req.params.type} content`);
    }
});

// Get series with seasons and episodes
app.get(`${API_PREFIX}/content/:id/hierarchy`, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const content = await prisma.content.findUnique({
            where: { id },
            include: {
                children: {
                    include: {
                        children: {
                            select: {
                                id: true,
                                title: true,
                                episodeNumber: true,
                                rating: true,
                                duration: true,
                                releaseDate: true
                            },
                            orderBy: { episodeNumber: 'asc' }
                        }
                    },
                    orderBy: { seasonNumber: 'asc' }
                }
            }
        });
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.json(content);
    } catch (err) {
        handleError(res, err, 'Failed to fetch content hierarchy');
    }
});

// =============================================================================
// PERSON ENDPOINTS
// =============================================================================

// List all persons with filtering
app.get(`${API_PREFIX}/persons`, async (req, res) => {
    try {
        const { page, limit, search, department, minPopularity, sortBy = 'popularity', sortOrder = 'desc' } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: any = {};
        if (search && typeof search === 'string') {
            whereClause.name = { contains: search, mode: 'insensitive' };
        }
        if (department && typeof department === 'string') {
            whereClause.knownForDepartment = department;
        }
        if (minPopularity) {
            whereClause.popularity = { gte: parseFloat(minPopularity as string) };
        }

        const orderBy: any = {};
        if (sortBy === 'name') orderBy.name = sortOrder;
        else if (sortBy === 'popularity') orderBy.popularity = sortOrder;
        else orderBy.createdAt = sortOrder;

        const [persons, total] = await Promise.all([
            prisma.person.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    remoteId: true,
                    remoteSource: true,
                    birthDate: true,
                    deathDate: true,
                    birthPlace: true,
                    knownForDepartment: true,
                    popularity: true,
                    profileUrl: true,
                    createdAt: true
                },
                skip: pagination.skip,
                take: pagination.take,
                orderBy
            }),
            prisma.person.count({ where: whereClause })
        ]);

        res.json({
            data: persons,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                pages: Math.ceil(total / pagination.limit)
            }
        });
    } catch (err) {
        handleError(res, err, 'Failed to fetch persons');
    }
});

// Get detailed person by ID
app.get(`${API_PREFIX}/persons/:id`, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const person = await prisma.person.findUnique({
            where: { id },
            include: {
                cast: {
                    include: {
                        content: {
                            select: {
                                id: true,
                                title: true,
                                originalTitle: true,
                                year: true,
                                type: true,
                                rating: true,
                                remoteSource: true
                            }
                        }
                    },
                    orderBy: [{ content: { year: 'desc' } }, { order: 'asc' }]
                },
                media: {
                    select: {
                        id: true,
                        type: true,
                        subtype: true,
                        title: true,
                        url: true,
                        width: true,
                        height: true,
                        isPrimary: true
                    }
                }
            }
        });
        
        if (!person) {
            return res.status(404).json({ error: 'Person not found' });
        }
        
        res.json(person);
    } catch (err) {
        handleError(res, err, 'Failed to fetch person details');
    }
});

// Get person filmography grouped by role
app.get(`${API_PREFIX}/persons/:id/filmography`, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const filmography = await prisma.cast.findMany({
            where: { personId: id },
            include: {
                content: {
                    select: {
                        id: true,
                        title: true,
                        originalTitle: true,
                        year: true,
                        type: true,
                        rating: true,
                        remoteSource: true
                    }
                }
            },
            orderBy: [{ content: { year: 'desc' } }]
        });
        
        // Group by role/department
        const grouped = filmography.reduce((acc: any, item) => {
            const key = item.department || item.role;
            if (!acc[key]) acc[key] = [];
            acc[key].push({
                ...item.content,
                character: item.character,
                role: item.role,
                department: item.department,
                order: item.order
            });
            return acc;
        }, {});
        
        res.json(grouped);
    } catch (err) {
        handleError(res, err, 'Failed to fetch person filmography');
    }
});

// Search movies/series
app.get(`${API_PREFIX}/search`, async (req, res) => {
    const { q, type, source, page = 1, limit = 20 } = req.query;
    
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    try {
        const offset = (Number(page) - 1) * Number(limit);
        const whereClause: {
            OR: Array<{ title?: { contains: string; mode: 'insensitive' }; originalTitle?: { contains: string; mode: 'insensitive' } }>;
            type?: string;
            remoteSource?: string;
        } = {
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { originalTitle: { contains: q, mode: 'insensitive' } }
            ]
        };
        
        if (type && typeof type === 'string') whereClause.type = type;
        if (source && typeof source === 'string') whereClause.remoteSource = source;

        const pagination = getPagination(page, limit);
        
        const [content, total] = await Promise.all([
            prisma.content.findMany({
                where: whereClause,
                select: {
                    id: true,
                    title: true,
                    originalTitle: true,
                    year: true,
                    type: true,
                    remoteSource: true,
                    remoteId: true,
                    rating: true,
                    description: true,
                    genres: {
                        select: { genre: { select: { name: true, slug: true } } }
                    }
                },
                skip: pagination.skip,
                take: pagination.take,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.content.count({ where: whereClause })
        ]);

        res.json({
            data: content,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                pages: Math.ceil(total / pagination.limit)
            }
        });
    } catch (err) {
        handleError(res, err, 'Failed to search content');
    }
});

// =============================================================================
// MEDIA ENDPOINTS
// =============================================================================

// Get media for content or person
app.get(`${API_PREFIX}/media`, async (req, res) => {
    try {
        const { contentId, personId, type, subtype, page, limit } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: any = {};
        if (contentId) whereClause.contentId = parseInt(contentId as string);
        if (personId) whereClause.personId = parseInt(personId as string);
        if (type && typeof type === 'string') whereClause.type = type;
        if (subtype && typeof subtype === 'string') whereClause.subtype = subtype;

        const [media, total] = await Promise.all([
            prisma.media.findMany({
                where: whereClause,
                select: {
                    id: true,
                    type: true,
                    subtype: true,
                    title: true,
                    url: true,
                    width: true,
                    height: true,
                    duration: true,
                    isPrimary: true,
                    language: true,
                    publishedAt: true,
                    contentId: true,
                    personId: true
                },
                skip: pagination.skip,
                take: pagination.take,
                orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
            }),
            prisma.media.count({ where: whereClause })
        ]);

        res.json({
            data: media,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                pages: Math.ceil(total / pagination.limit)
            }
        });
    } catch (err) {
        handleError(res, err, 'Failed to fetch media');
    }
});

// =============================================================================
// METADATA ENDPOINTS
// =============================================================================

// Get all genres
app.get(`${API_PREFIX}/genres`, async (req, res) => {
    try {
        const genres = await prisma.genre.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: { content: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({ data: genres });
    } catch (err) {
        handleError(res, err, 'Failed to fetch genres');
    }
});

// Get all countries
app.get(`${API_PREFIX}/countries`, async (req, res) => {
    try {
        const countries = await prisma.country.findMany({
            select: {
                id: true,
                name: true,
                code: true,
                _count: {
                    select: { content: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({ data: countries });
    } catch (err) {
        handleError(res, err, 'Failed to fetch countries');
    }
});

// Get all languages
app.get(`${API_PREFIX}/languages`, async (req, res) => {
    try {
        const languages = await prisma.language.findMany({
            select: {
                id: true,
                name: true,
                code: true,
                nativeName: true,
                _count: {
                    select: { content: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({ data: languages });
    } catch (err) {
        handleError(res, err, 'Failed to fetch languages');
    }
});

// Get collections
app.get(`${API_PREFIX}/collections`, async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: any = {};
        if (search && typeof search === 'string') {
            whereClause.name = { contains: search, mode: 'insensitive' };
        }

        const [collections, total] = await Promise.all([
            prisma.collection.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    remoteSource: true,
                    _count: {
                        select: { content: true }
                    }
                },
                skip: pagination.skip,
                take: pagination.take,
                orderBy: { name: 'asc' }
            }),
            prisma.collection.count({ where: whereClause })
        ]);

        res.json({
            data: collections,
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total,
                pages: Math.ceil(total / pagination.limit)
            }
        });
    } catch (err) {
        handleError(res, err, 'Failed to fetch collections');
    }
});

// Get collection details with content
app.get(`${API_PREFIX}/collections/:id`, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const collection = await prisma.collection.findUnique({
            where: { id },
            include: {
                content: {
                    select: {
                        id: true,
                        title: true,
                        originalTitle: true,
                        year: true,
                        type: true,
                        rating: true,
                        remoteSource: true
                    },
                    orderBy: { year: 'asc' }
                }
            }
        });
        
        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }
        
        res.json(collection);
    } catch (err) {
        handleError(res, err, 'Failed to fetch collection details');
    }
});

// =============================================================================
// STATISTICS ENDPOINTS
// =============================================================================

// Get comprehensive statistics
app.get(`${API_PREFIX}/stats`, async (req, res) => {
    try {
        const [totalMovies, totalSeries, totalSeasons, totalEpisodes, totalPersons, sources, topGenres, recentContent] = await Promise.all([
            prisma.content.count({ where: { type: 'movie' } }),
            prisma.content.count({ where: { type: 'series' } }),
            prisma.content.count({ where: { type: 'season' } }),
            prisma.content.count({ where: { type: 'episode' } }),
            prisma.person.count(),
            prisma.content.groupBy({
                by: ['remoteSource'],
                _count: { id: true }
            }),
            prisma.contentGenre.groupBy({
                by: ['genreId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10
            }),
            prisma.content.count({
                where: {
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            })
        ]);

        // Get genre names for top genres
        const genreIds = topGenres.map(g => g.genreId);
        const genres = await prisma.genre.findMany({
            where: { id: { in: genreIds } },
            select: { id: true, name: true }
        });
        
        const topGenresWithNames = topGenres.map(tg => ({
            ...genres.find(g => g.id === tg.genreId),
            count: tg._count.id
        }));

        res.json({
            content: {
                totalMovies,
                totalSeries,
                totalSeasons,
                totalEpisodes,
                totalContent: totalMovies + totalSeries + totalSeasons + totalEpisodes
            },
            persons: {
                total: totalPersons
            },
            sources: sources.map(s => ({
                source: s.remoteSource,
                count: s._count.id
            })),
            topGenres: topGenresWithNames,
            recentlyAdded: recentContent
        });
    } catch (err) {
        handleError(res, err, 'Failed to fetch statistics');
    }
});

// =============================================================================
// EXPORT ENDPOINTS
// =============================================================================

// Export content to JSON
app.get(`${API_PREFIX}/export/content/:id`, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const content = await prisma.content.findUnique({
            where: { id },
            include: {
                cast: {
                    include: { person: true },
                    orderBy: { order: 'asc' }
                },
                media: true,
                genres: {
                    include: { genre: true }
                },
                countries: {
                    include: { country: true }
                },
                languages: {
                    include: { language: true }
                },
                organizations: {
                    include: { organization: true }
                },
                collections: true,
                reviews: true,
                children: {
                    include: {
                        cast: {
                            include: { person: true }
                        },
                        media: true
                    },
                    orderBy: [{ seasonNumber: 'asc' }, { episodeNumber: 'asc' }]
                },
                parent: {
                    include: {
                        cast: {
                            include: { person: true }
                        }
                    }
                }
            }
        });
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${content.title.replace(/[^a-zA-Z0-9]/g, '_')}.json"`);
        res.json(content);
    } catch (err) {
        handleError(res, err, 'Failed to export content');
    }
});

// Export person to JSON
app.get(`${API_PREFIX}/export/person/:id`, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const person = await prisma.person.findUnique({
            where: { id },
            include: {
                cast: {
                    include: {
                        content: {
                            include: {
                                genres: {
                                    include: { genre: true }
                                }
                            }
                        }
                    },
                    orderBy: [{ content: { year: 'desc' } }]
                },
                media: true
            }
        });
        
        if (!person) {
            return res.status(404).json({ error: 'Person not found' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${person.name.replace(/[^a-zA-Z0-9]/g, '_')}.json"`);
        res.json(person);
    } catch (err) {
        handleError(res, err, 'Failed to export person');
    }
});

// =============================================================================
// UTILITY ENDPOINTS
// =============================================================================

// Advanced search across all entities
app.get(`${API_PREFIX}/search/all`, async (req, res) => {
    try {
        const { q, page, limit } = req.query;
        
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        
        const pagination = getPagination(page, limit);
        const searchTerm = q.trim();

        const [contentResults, personResults] = await Promise.all([
            prisma.content.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { originalTitle: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    originalTitle: true,
                    year: true,
                    type: true,
                    rating: true,
                    remoteSource: true
                },
                take: Math.floor(pagination.take / 2),
                orderBy: { rating: 'desc' }
            }),
            prisma.person.findMany({
                where: {
                    name: { contains: searchTerm, mode: 'insensitive' }
                },
                select: {
                    id: true,
                    name: true,
                    knownForDepartment: true,
                    popularity: true,
                    remoteSource: true
                },
                take: Math.floor(pagination.take / 2),
                orderBy: { popularity: 'desc' }
            })
        ]);

        res.json({
            content: contentResults,
            persons: personResults,
            totalResults: contentResults.length + personResults.length
        });
    } catch (err) {
        handleError(res, err, 'Failed to perform universal search');
    }
});

// Get trending content (high rating, recent)
app.get(`${API_PREFIX}/trending`, async (req, res) => {
    try {
        const { type, period = 'week', limit = 20 } = req.query;
        
        let dateFilter: Date;
        if (period === 'day') dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
        else if (period === 'month') dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        else dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // week
        
        const whereClause: any = {
            createdAt: { gte: dateFilter },
            rating: { gte: 6.0 }
        };
        if (type && typeof type === 'string') whereClause.type = type;

        const trending = await prisma.content.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                originalTitle: true,
                year: true,
                type: true,
                rating: true,
                popularity: true,
                remoteSource: true,
                genres: {
                    select: { genre: { select: { name: true, slug: true } } }
                }
            },
            take: Number(limit),
            orderBy: [
                { rating: 'desc' },
                { popularity: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({ data: trending });
    } catch (err) {
        handleError(res, err, 'Failed to fetch trending content');
    }
});

// Get recommendations based on content
app.get(`${API_PREFIX}/content/:id/recommendations`, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const { limit = 10 } = req.query;
        
        // Get content details first
        const content = await prisma.content.findUnique({
            where: { id },
            include: {
                genres: { select: { genreId: true } },
                sourceRelations: {
                    include: {
                        targetContent: {
                            select: {
                                id: true,
                                title: true,
                                year: true,
                                type: true,
                                rating: true
                            }
                        }
                    },
                    where: { type: 'recommendation' },
                    take: Number(limit)
                }
            }
        });
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        // If we have direct recommendations, return them
        if (content.sourceRelations.length > 0) {
            const recommendations = content.sourceRelations.map(rel => rel.targetContent);
            return res.json({ data: recommendations });
        }
        
        // Otherwise, find similar content by genre
        const genreIds = content.genres.map(g => g.genreId);
        if (genreIds.length > 0) {
            const similar = await prisma.content.findMany({
                where: {
                    AND: [
                        { id: { not: id } },
                        { type: content.type },
                        { genres: { some: { genreId: { in: genreIds } } } }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    year: true,
                    type: true,
                    rating: true,
                    genres: {
                        select: { genre: { select: { name: true } } }
                    }
                },
                take: Number(limit),
                orderBy: { rating: 'desc' }
            });
            
            return res.json({ data: similar });
        }
        
        res.json({ data: [] });
    } catch (err) {
        handleError(res, err, 'Failed to fetch recommendations');
    }
});

// =============================================================================
// LEGACY ENDPOINTS (for backward compatibility)
// =============================================================================

// Legacy endpoints redirect to new API
app.get('/titles', (req, res) => {
    const queryString = new URLSearchParams(req.query as any).toString();
    res.redirect(301, `${API_PREFIX}/content?${queryString}`);
});

app.get('/titles/:id', (req, res) => {
    res.redirect(301, `${API_PREFIX}/content/${req.params.id}`);
});

app.get('/search', (req, res) => {
    const queryString = new URLSearchParams(req.query as any).toString();
    res.redirect(301, `${API_PREFIX}/search?${queryString}`);
});

app.get('/stats', (req, res) => {
    res.redirect(301, `${API_PREFIX}/stats`);
});

app.get('/export/:id', (req, res) => {
    res.redirect(301, `${API_PREFIX}/export/content/${req.params.id}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    log.info('Received SIGTERM, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    log.info('Received SIGINT, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(PORT, () => {
    log.info(`API server running on port ${PORT}`);
});

export default app;