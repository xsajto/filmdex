import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { handleError } from '../utils';

const router: Router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /sitemap.xml:
 *   get:
 *     summary: Generate sitemap of sitemaps with full content endpoints
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
        
        // Get counts for different content types
        const [totalContent, totalMovies, totalSeries, totalPersons] = await Promise.all([
            prisma.content.count(),
            prisma.content.count({ where: { type: 'movie' } }),
            prisma.content.count({ where: { type: 'series' } }),
            prisma.person.count()
        ]);

        // Create sitemap index with individual sitemaps
        const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- API Documentation -->
    <sitemap>
        <loc>${baseUrl}/api-docs</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    
    <!-- Content Sitemaps -->
    <sitemap>
        <loc>${baseUrl}/sitemap/content.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    
    <sitemap>
        <loc>${baseUrl}/sitemap/movies.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    
    <sitemap>
        <loc>${baseUrl}/sitemap/series.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    
    <sitemap>
        <loc>${baseUrl}/sitemap/persons.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    
    <!-- Full Data Endpoints -->
    <sitemap>
        <loc>${baseUrl}/sitemap/full-content.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    
    <!-- Statistics -->
    <sitemap>
        <loc>${baseUrl}/sitemap/stats.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
</sitemapindex>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemapIndex);
    } catch (err) {
        handleError(res, err, 'Failed to generate sitemap');
    }
});

/**
 * Generate sitemap for all content with full nested data endpoints
 */
router.get('/content.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const content = await prisma.content.findMany({
            select: {
                id: true,
                type: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 50000 // Limit for sitemap
        });

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        content.forEach(item => {
            sitemap += `
    <url>
        <loc>${baseUrl}/api/v1/content/${item.id}/full</loc>
        <lastmod>${item.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
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

/**
 * Generate sitemap for movies with full data
 */
router.get('/movies.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const movies = await prisma.content.findMany({
            where: { type: 'movie' },
            select: {
                id: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 50000
        });

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        movies.forEach(movie => {
            sitemap += `
    <url>
        <loc>${baseUrl}/api/v1/content/${movie.id}/full</loc>
        <lastmod>${movie.updatedAt.toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>`;
        });

        sitemap += `
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        handleError(res, err, 'Failed to generate movies sitemap');
    }
});

/**
 * Generate sitemap for TV series with full data
 */
router.get('/series.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const series = await prisma.content.findMany({
            where: { type: 'series' },
            select: {
                id: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 50000
        });

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        series.forEach(show => {
            sitemap += `
    <url>
        <loc>${baseUrl}/api/v1/content/${show.id}/full</loc>
        <lastmod>${show.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`;
        });

        sitemap += `
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        handleError(res, err, 'Failed to generate series sitemap');
    }
});

/**
 * Generate sitemap for persons with full data
 */
router.get('/persons.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const persons = await prisma.person.findMany({
            select: {
                id: true,
                updatedAt: true
            },
            orderBy: { updatedAt: 'desc' },
            take: 50000
        });

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        persons.forEach(person => {
            sitemap += `
    <url>
        <loc>${baseUrl}/api/v1/persons/${person.id}/full</loc>
        <lastmod>${person.updatedAt.toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
        });

        sitemap += `
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        handleError(res, err, 'Failed to generate persons sitemap');
    }
});

/**
 * Generate sitemap for full content data endpoints
 */
router.get('/full-content.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const content = await prisma.content.findMany({
            select: {
                id: true,
                type: true,
                updatedAt: true,
                rating: true
            },
            where: {
                rating: { gte: 7.0 } // Only high-rated content for full data
            },
            orderBy: { rating: 'desc' },
            take: 10000
        });

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        content.forEach(item => {
            const priority = item.rating ? Math.min(1.0, (item.rating / 10)) : 0.5;
            sitemap += `
    <url>
        <loc>${baseUrl}/api/v1/content/${item.id}/complete</loc>
        <lastmod>${item.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${priority.toFixed(1)}</priority>
    </url>`;
        });

        sitemap += `
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        handleError(res, err, 'Failed to generate full content sitemap');
    }
});

/**
 * Generate sitemap for statistics and metadata endpoints
 */
router.get('/stats.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const staticEndpoints = [
            '/api/v1/stats',
            '/api/v1/trending',
            '/api/v1/genres',
            '/api/v1/countries',
            '/api/v1/languages',
            '/api/v1/collections'
        ];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        staticEndpoints.forEach(endpoint => {
            sitemap += `
    <url>
        <loc>${baseUrl}${endpoint}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.6</priority>
    </url>`;
        });

        sitemap += `
</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        handleError(res, err, 'Failed to generate stats sitemap');
    }
});

export default router;
