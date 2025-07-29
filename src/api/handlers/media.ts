import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { getPagination, handleError } from '../utils';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Media:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         type:
 *           type: string
 *           enum: [image, video]
 *           description: Media type
 *         subtype:
 *           type: string
 *           description: Media subtype (poster, backdrop, trailer, etc.)
 *         title:
 *           type: string
 *           description: Media title
 *         url:
 *           type: string
 *           description: Media URL
 *         width:
 *           type: integer
 *           description: Image/video width
 *         height:
 *           type: integer
 *           description: Image/video height
 *         duration:
 *           type: integer
 *           description: Video duration in seconds
 *         isPrimary:
 *           type: boolean
 *           description: Whether this is the primary media
 *         language:
 *           type: string
 *           description: Media language
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: Publication date
 *         contentId:
 *           type: integer
 *           description: Associated content ID
 *         personId:
 *           type: integer
 *           description: Associated person ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *     PaginatedMediaResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Media'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/v1/media:
 *   get:
 *     summary: Get media for content or person
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: contentId
 *         schema:
 *           type: integer
 *         description: Filter by content ID
 *       - in: query
 *         name: personId
 *         schema:
 *           type: integer
 *         description: Filter by person ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, video]
 *         description: Filter by media type
 *       - in: query
 *         name: subtype
 *         schema:
 *           type: string
 *         description: Filter by media subtype
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
 *         description: List of media
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMediaResponse'
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const { contentId, personId, type, subtype, page, limit } = req.query;
        const pagination = getPagination(page, limit);
        
        const whereClause: Record<string, unknown> = {};
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

export default router;
