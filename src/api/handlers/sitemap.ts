import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { handleError } from '../utils';

const router: Router = Router();
const prisma = new PrismaClient();

// Constants for sitemap limits
const MAX_URLS_PER_SITEMAP = 20000;

/**
 * @swagger
 * /sitemap.xml:
 *   get:
 *     summary: Generate sitemap index with paginated content sitemaps
 *     tags: [Sitemap]
 *     produces:
 *       - application/xml
 *     responses:
 *       200:
 *         description: XML sitemap index
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Get total content count
        const totalContent = await prisma.content.count();

        // Calculate number of sitemaps needed
        const contentPages = Math.ceil(totalContent / MAX_URLS_PER_SITEMAP);

        let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add content sitemaps (paginated)
        for (let page = 1; page <= contentPages; page++) {
            sitemapIndex += `
    <sitemap>
        <loc>${baseUrl}/sitemap/content-${page}.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>`;
        }

        sitemapIndex += `
</sitemapindex>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemapIndex);
    } catch (err) {
        handleError(res, err, 'Failed to generate sitemap');
    }
});

/**
 * Generate paginated sitemap for all content with full nested data endpoints
 */
router.get('/content-:page.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.params.page) || 1;
        const skip = (page - 1) * MAX_URLS_PER_SITEMAP;
        
        const content = await prisma.content.findMany({
            select: {
                id: true,
                type: true,
                updatedAt: true
            },
            orderBy: { id: 'asc' }, // Use consistent ordering
            skip: skip,
            take: MAX_URLS_PER_SITEMAP
        });

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        content.forEach(item => {
            sitemap += `
    <url>
        <loc>${baseUrl}/api/v1/content/${item.id}</loc>
        <lastmod>${item.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/api/v1/content/${item.id}/full</loc>
        <lastmod>${item.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>`;
        });

        sitemap += `
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        handleError(res, err, 'Failed to generate content sitemap');
    }
});


export default router;
