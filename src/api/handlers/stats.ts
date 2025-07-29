import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { handleError } from '../utils';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Statistics:
 *       type: object
 *       properties:
 *         content:
 *           type: object
 *           properties:
 *             totalMovies:
 *               type: integer
 *               description: Total number of movies
 *             totalSeries:
 *               type: integer
 *               description: Total number of series
 *             totalSeasons:
 *               type: integer
 *               description: Total number of seasons
 *             totalEpisodes:
 *               type: integer
 *               description: Total number of episodes
 *             totalContent:
 *               type: integer
 *               description: Total number of all content items
 *         persons:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of persons
 *         sources:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *                 description: Source name
 *               count:
 *                 type: integer
 *                 description: Number of items from this source
 *         topGenres:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *               count:
 *                 type: integer
 *         recentlyAdded:
 *           type: integer
 *           description: Number of items added in the last 24 hours
 */

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get comprehensive statistics
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Application statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Statistics'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
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

/**
 * @swagger
 * /api/v1/trending:
 *   get:
 *     summary: Get trending content (high rating, recent)
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [movie, series, season, episode]
 *         description: Filter by content type
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: week
 *         description: Time period for trending calculation
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of trending items to return
 *     responses:
 *       200:
 *         description: List of trending content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *       500:
 *         description: Server error
 */
router.get('/trending', async (req, res) => {
    try {
        const { type, period = 'week', limit = 20 } = req.query;
        
        let dateFilter: Date;
        if (period === 'day') dateFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
        else if (period === 'month') dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        else dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // week
        
        const whereClause: Record<string, unknown> = {
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

export default router;
