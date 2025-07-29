import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { getPagination, handleError } from '../utils';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Content:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         title:
 *           type: string
 *           description: Title of the content
 *         originalTitle:
 *           type: string
 *           description: Original title in source language
 *         year:
 *           type: integer
 *           description: Release year
 *         type:
 *           type: string
 *           enum: [movie, series, season, episode]
 *           description: Content type
 *         remoteSource:
 *           type: string
 *           enum: [csfd, tmdb]
 *           description: Source of the data
 *         remoteId:
 *           type: string
 *           description: ID in the remote source
 *         rating:
 *           type: number
 *           format: float
 *           description: Rating score
 *         releaseDate:
 *           type: string
 *           format: date
 *           description: Release date
 *         duration:
 *           type: integer
 *           description: Duration in minutes
 *         description:
 *           type: string
 *           description: Content description
 *         status:
 *           type: string
 *           description: Content status
 *         episodeCount:
 *           type: integer
 *           description: Number of episodes (for series)
 *         seasonCount:
 *           type: integer
 *           description: Number of seasons (for series)
 *         seasonNumber:
 *           type: integer
 *           description: Season number (for seasons/episodes)
 *         episodeNumber:
 *           type: integer
 *           description: Episode number (for episodes)
 *         popularity:
 *           type: number
 *           format: float
 *           description: Popularity score
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     PaginatedContentResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Content'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Items per page
 *         total:
 *           type: integer
 *           description: Total number of items
 *         pages:
 *           type: integer
 *           description: Total number of pages
 */

/**
 * @swagger
 * /api/v1/content:
 *   get:
 *     summary: List all content with filtering and pagination
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [movie, series, season, episode]
 *         description: Filter by content type
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [csfd, tmdb]
 *         description: Filter by source
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by release year
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum rating filter
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: number
 *           format: float
 *         description: Maximum rating filter
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre slug
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country code
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by language code
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, original title, and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, year, title]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedContentResponse'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { page, limit, type, source, year, minRating, maxRating, genre, country, language, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: Record<string, unknown> = {};
        if (type && typeof type === 'string') whereClause.type = type;
        if (source && typeof source === 'string') whereClause.remoteSource = source;
        if (year) whereClause.year = parseInt(year as string);
        if (minRating || maxRating) {
            const ratingFilter: Record<string, number> = {};
            if (minRating) ratingFilter.gte = parseFloat(minRating as string);
            if (maxRating) ratingFilter.lte = parseFloat(maxRating as string);
            whereClause.rating = ratingFilter;
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

        const orderBy: Record<string, string> = {};
        if (sortBy === 'rating') orderBy.rating = sortOrder as string;
        else if (sortBy === 'year') orderBy.year = sortOrder as string;
        else if (sortBy === 'title') orderBy.title = sortOrder as string;
        else orderBy.createdAt = sortOrder as string;

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

/**
 * @swagger
 * /api/v1/content/{id}:
 *   get:
 *     summary: Get detailed content by ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
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

/**
 * @swagger
 * /api/v1/content/type/{type}:
 *   get:
 *     summary: Get content by type
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [movie, series, season, episode]
 *         description: Content type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: number
 *         description: Maximum rating
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Genre slug
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, year, title]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of content by type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedContentResponse'
 *       500:
 *         description: Server error
 */
router.get('/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { page, limit, search, year, minRating, maxRating, genre, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: Record<string, unknown> = { type };
        if (search && typeof search === 'string') {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { originalTitle: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (year) whereClause.year = parseInt(year as string);
        if (minRating || maxRating) {
            const ratingFilter: Record<string, number> = {};
            if (minRating) ratingFilter.gte = parseFloat(minRating as string);
            if (maxRating) ratingFilter.lte = parseFloat(maxRating as string);
            whereClause.rating = ratingFilter;
        }
        if (genre && typeof genre === 'string') {
            whereClause.genres = { some: { genre: { slug: genre } } };
        }

        const orderBy: Record<string, string> = {};
        if (sortBy === 'rating') orderBy.rating = sortOrder as string;
        else if (sortBy === 'year') orderBy.year = sortOrder as string;
        else if (sortBy === 'title') orderBy.title = sortOrder as string;
        else orderBy.createdAt = sortOrder as string;

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

/**
 * @swagger
 * /api/v1/content/{id}/hierarchy:
 *   get:
 *     summary: Get series with seasons and episodes
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Series ID
 *     responses:
 *       200:
 *         description: Series hierarchy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 */
router.get('/:id/hierarchy', async (req, res) => {
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

/**
 * @swagger
 * /api/v1/content/{id}/recommendations:
 *   get:
 *     summary: Get recommendations based on content
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Content ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recommendations
 *     responses:
 *       200:
 *         description: List of recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 */
router.get('/:id/recommendations', async (req, res) => {
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

// Full data endpoint for sitemap
router.get('/:id/full', async (req, res) => {
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
                                profileUrl: true,
                                knownForDepartment: true
                            }
                        }
                    },
                    orderBy: { order: 'asc' },
                    take: 20
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
                reviews: {
                    orderBy: { publishedAt: 'desc' },
                    take: 50
                },
                children: {
                    include: {
                        cast: {
                            include: {
                                person: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            },
                            take: 5
                        }
                    },
                    orderBy: [{ seasonNumber: 'asc' }, { episodeNumber: 'asc' }]
                }
            }
        });
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.json(content);
    } catch (err) {
        handleError(res, err, 'Failed to fetch complete content data');
    }
});

// Ultra complete data endpoint for high-priority content
router.get('/:id/complete', async (req, res) => {
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
                            include: {
                                media: {
                                    where: { isPrimary: true },
                                    take: 1
                                }
                            }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
                media: true,
                genres: {
                    include: { 
                        genre: {
                            include: {
                                _count: {
                                    select: { content: true }
                                }
                            }
                        }
                    }
                },
                countries: {
                    include: { 
                        country: {
                            include: {
                                _count: {
                                    select: { content: true }
                                }
                            }
                        }
                    }
                },
                languages: {
                    include: { 
                        language: {
                            include: {
                                _count: {
                                    select: { content: true }
                                }
                            }
                        }
                    }
                },
                organizations: {
                    include: {
                        organization: true
                    }
                },
                collections: {
                    include: {
                        content: {
                            select: {
                                id: true,
                                title: true,
                                year: true,
                                rating: true
                            },
                            orderBy: { year: 'asc' }
                        }
                    }
                },
                children: {
                    include: {
                        cast: {
                            include: {
                                person: {
                                    select: {
                                        id: true,
                                        name: true,
                                        profileUrl: true
                                    }
                                }
                            },
                            take: 10
                        },
                        media: true,
                        genres: {
                            include: { genre: true }
                        },
                        reviews: {
                            orderBy: { publishedAt: 'desc' },
                            take: 5
                        }
                    },
                    orderBy: [{ seasonNumber: 'asc' }, { episodeNumber: 'asc' }]
                },
                parent: {
                    include: {
                        genres: {
                            include: { genre: true }
                        },
                        media: {
                            where: { isPrimary: true },
                            take: 1
                        }
                    }
                },
                reviews: {
                    orderBy: { publishedAt: 'desc' }
                }
            }
        });
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.json(content);
    } catch (err) {
        handleError(res, err, 'Failed to fetch ultra-complete content data');
    }
});

export default router;
