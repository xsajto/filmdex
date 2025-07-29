import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { getPagination, handleError } from '../utils';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     summary: Search movies and series
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
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
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedContentResponse'
 *       400:
 *         description: Missing query parameter
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    const { q, type, source, page = 1, limit = 20 } = req.query;
    
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    try {
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

/**
 * @swagger
 * /api/v1/search/all:
 *   get:
 *     summary: Advanced search across all entities (content and persons)
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
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
 *     responses:
 *       200:
 *         description: Universal search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *                 persons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Person'
 *                 totalResults:
 *                   type: integer
 *                   description: Total number of results
 *       400:
 *         description: Missing query parameter
 *       500:
 *         description: Server error
 */
router.get('/all', async (req, res) => {
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
                        { title: { contains: searchTerm } },
                        { originalTitle: { contains: searchTerm } },
                        { description: { contains: searchTerm } }
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
                    name: { contains: searchTerm }
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

export default router;
