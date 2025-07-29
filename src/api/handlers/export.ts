import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { handleError } from '../utils';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/v1/export/content/{id}:
 *   get:
 *     summary: Export content to JSON
 *     tags: [Export]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content data as JSON file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Content'
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 */
router.get('/content/:id', async (req, res) => {
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

/**
 * @swagger
 * /api/v1/export/person/{id}:
 *   get:
 *     summary: Export person to JSON
 *     tags: [Export]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Person ID
 *     responses:
 *       200:
 *         description: Person data as JSON file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Person'
 *         headers:
 *           Content-Disposition:
 *             description: Attachment filename
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: Person not found
 *       500:
 *         description: Server error
 */
router.get('/person/:id', async (req, res) => {
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

export default router;
