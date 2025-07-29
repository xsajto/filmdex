import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { getPagination, handleError } from '../utils';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Genre:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         name:
 *           type: string
 *           description: Genre name
 *         slug:
 *           type: string
 *           description: Genre slug
 *         _count:
 *           type: object
 *           properties:
 *             content:
 *               type: integer
 *               description: Number of content items in this genre
 *     Country:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         name:
 *           type: string
 *           description: Country name
 *         code:
 *           type: string
 *           description: Country code (ISO)
 *         _count:
 *           type: object
 *           properties:
 *             content:
 *               type: integer
 *               description: Number of content items from this country
 *     Language:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         name:
 *           type: string
 *           description: Language name
 *         code:
 *           type: string
 *           description: Language code (ISO)
 *         nativeName:
 *           type: string
 *           description: Native language name
 *         _count:
 *           type: object
 *           properties:
 *             content:
 *               type: integer
 *               description: Number of content items in this language
 *     Collection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         name:
 *           type: string
 *           description: Collection name
 *         description:
 *           type: string
 *           description: Collection description
 *         remoteSource:
 *           type: string
 *           enum: [csfd, tmdb]
 *           description: Source of the data
 *         _count:
 *           type: object
 *           properties:
 *             content:
 *               type: integer
 *               description: Number of content items in this collection
 */

/**
 * @swagger
 * /api/v1/genres:
 *   get:
 *     summary: Get all genres
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: List of all genres
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Genre'
 *       500:
 *         description: Server error
 */
router.get('/genres', async (req, res) => {
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

/**
 * @swagger
 * /api/v1/countries:
 *   get:
 *     summary: Get all countries
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: List of all countries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Country'
 *       500:
 *         description: Server error
 */
router.get('/countries', async (req, res) => {
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

/**
 * @swagger
 * /api/v1/languages:
 *   get:
 *     summary: Get all languages
 *     tags: [Metadata]
 *     responses:
 *       200:
 *         description: List of all languages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Language'
 *       500:
 *         description: Server error
 */
router.get('/languages', async (req, res) => {
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

/**
 * @swagger
 * /api/v1/collections:
 *   get:
 *     summary: Get collections with pagination and search
 *     tags: [Metadata]
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in collection names
 *     responses:
 *       200:
 *         description: List of collections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Collection'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server error
 */
router.get('/collections', async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: Record<string, unknown> = {};
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

/**
 * @swagger
 * /api/v1/collections/{id}:
 *   get:
 *     summary: Get collection details with content
 *     tags: [Metadata]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Collection'
 *                 - type: object
 *                   properties:
 *                     content:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Content'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
router.get('/collections/:id', async (req, res) => {
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

export default router;
