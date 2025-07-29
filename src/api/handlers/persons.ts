import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { getPagination, handleError } from '../utils';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Person:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         name:
 *           type: string
 *           description: Person's name
 *         remoteId:
 *           type: string
 *           description: ID in the remote source
 *         remoteSource:
 *           type: string
 *           enum: [csfd, tmdb]
 *           description: Source of the data
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Birth date
 *         deathDate:
 *           type: string
 *           format: date
 *           description: Death date
 *         birthPlace:
 *           type: string
 *           description: Birth place
 *         knownForDepartment:
 *           type: string
 *           description: Department the person is known for
 *         popularity:
 *           type: number
 *           format: float
 *           description: Popularity score
 *         profileUrl:
 *           type: string
 *           description: Profile image URL
 *         biography:
 *           type: string
 *           description: Person's biography
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     PaginatedPersonResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Person'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/v1/persons:
 *   get:
 *     summary: List all persons with filtering and pagination
 *     tags: [Persons]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in person names
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by known department
 *       - in: query
 *         name: minPopularity
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum popularity score
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, popularity, createdAt]
 *           default: popularity
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
 *         description: List of persons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedPersonResponse'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { page, limit, search, department, minPopularity, sortBy = 'popularity', sortOrder = 'desc' } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: Record<string, unknown> = {};
        if (search && typeof search === 'string') {
            whereClause.name = { contains: search, mode: 'insensitive' };
        }
        if (department && typeof department === 'string') {
            whereClause.knownForDepartment = department;
        }
        if (minPopularity) {
            whereClause.popularity = { gte: parseFloat(minPopularity as string) };
        }

        const orderBy: Record<string, string> = {};
        if (sortBy === 'name') orderBy.name = sortOrder as string;
        else if (sortBy === 'popularity') orderBy.popularity = sortOrder as string;
        else orderBy.createdAt = sortOrder as string;

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

/**
 * @swagger
 * /api/v1/persons/{id}:
 *   get:
 *     summary: Get detailed person by ID
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Person ID
 *     responses:
 *       200:
 *         description: Person details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Person'
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Person not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
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

/**
 * @swagger
 * /api/v1/persons/{id}/filmography:
 *   get:
 *     summary: Get person filmography grouped by role
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Person ID
 *     responses:
 *       200:
 *         description: Person filmography grouped by role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     originalTitle:
 *                       type: string
 *                     year:
 *                       type: integer
 *                     type:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     character:
 *                       type: string
 *                     role:
 *                       type: string
 *                     department:
 *                       type: string
 *                     order:
 *                       type: integer
 *       400:
 *         description: Invalid ID
 *       500:
 *         description: Server error
 */
router.get('/:id/filmography', async (req, res) => {
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
        const grouped = filmography.reduce((acc: Record<string, unknown[]>, item) => {
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

// Full person data endpoint for sitemap
router.get('/:id/full', async (req, res) => {
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
                                },
                                media: {
                                    where: { isPrimary: true },
                                    take: 1
                                }
                            }
                        }
                    },
                    orderBy: [{ content: { year: 'desc' } }, { order: 'asc' }]
                },
                media: {
                    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }]
                }
            }
        });
        
        if (!person) {
            return res.status(404).json({ error: 'Person not found' });
        }
        
        res.json(person);
    } catch (err) {
        handleError(res, err, 'Failed to fetch complete person data');
    }
});

export default router;
