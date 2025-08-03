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
        
        // Get counts for different content types
        const [totalContent, movieCount, seriesCount, personCount] = await Promise.all([
            prisma.content.count(),
            prisma.content.count({ where: { type: 'movie' } }),
            prisma.content.count({ where: { type: 'series' } }),
            prisma.person.count()
        ]);

        // Calculate number of sitemaps needed for each type
        const contentPages = Math.ceil(totalContent / MAX_URLS_PER_SITEMAP);
        const moviePages = Math.ceil(movieCount / MAX_URLS_PER_SITEMAP);
        const seriesPages = Math.ceil(seriesCount / MAX_URLS_PER_SITEMAP);
        const personPages = Math.ceil(personCount / MAX_URLS_PER_SITEMAP);

        let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- API Documentation -->
    <sitemap>
        <loc>${baseUrl}/doc</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
    
    <!-- Statistics -->
    <sitemap>
        <loc>${baseUrl}/sitemap/stats.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>`;

        // Add content sitemaps (paginated)
        for (let page = 1; page <= contentPages; page++) {
            sitemapIndex += `
    <sitemap>
        <loc>${baseUrl}/sitemap/content-${page}.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>`;
        }

        // Add movie sitemaps (paginated)
        for (let page = 1; page <= moviePages; page++) {
            sitemapIndex += `
    <sitemap>
        <loc>${baseUrl}/sitemap/movies-${page}.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>`;
        }

        // Add series sitemaps (paginated)
        for (let page = 1; page <= seriesPages; page++) {
            sitemapIndex += `
    <sitemap>
        <loc>${baseUrl}/sitemap/series-${page}.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>`;
        }

        // Add person sitemaps (paginated)
        for (let page = 1; page <= personPages; page++) {
            sitemapIndex += `
    <sitemap>
        <loc>${baseUrl}/sitemap/persons-${page}.xml</loc>
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

/**
 * Generate paginated sitemap for movies with full data
 */
router.get('/movies-:page.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.params.page) || 1;
        const skip = (page - 1) * MAX_URLS_PER_SITEMAP;
        
        const movies = await prisma.content.findMany({
            where: { type: 'movie' },
            select: {
                id: true,
                updatedAt: true
            },
            orderBy: { id: 'asc' },
            skip: skip,
            take: MAX_URLS_PER_SITEMAP
        });

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        movies.forEach(movie => {
            sitemap += `
    <url>
        <loc>${baseUrl}/api/v1/content/${movie.id}</loc>
        <lastmod>${movie.updatedAt.toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/api/v1/content/${movie.id}/full</loc>
        <lastmod>${movie.updatedAt.toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/api/v1/content/${movie.id}/complete</loc>
        <lastmod>${movie.updatedAt.toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
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
 * Generate paginated sitemap for TV series with full data
 */
router.get('/series-:page.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.params.page) || 1;
        const skip = (page - 1) * MAX_URLS_PER_SITEMAP;
        
        const series = await prisma.content.findMany({
            where: { type: 'series' },
            select: {
                id: true,
                updatedAt: true
            },
            orderBy: { id: 'asc' },
            skip: skip,
            take: MAX_URLS_PER_SITEMAP
        });

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        series.forEach(show => {
            sitemap += `
    <url>
        <loc>${baseUrl}/api/v1/content/${show.id}</loc>
        <lastmod>${show.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/api/v1/content/${show.id}/hierarchy</loc>
        <lastmod>${show.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/api/v1/content/${show.id}/full</loc>
        <lastmod>${show.updatedAt.toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
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
 * Generate paginated sitemap for persons with full data
 */
router.get('/persons-:page.xml', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const page = parseInt(req.params.page) || 1;
        const skip = (page - 1) * MAX_URLS_PER_SITEMAP;
        
        const persons = await prisma.person.findMany({
            select: {
                id: true,
                updatedAt: true
            },
            orderBy: { id: 'asc' },
            skip: skip,
            take: MAX_URLS_PER_SITEMAP
        });

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        persons.forEach(person => {
            sitemap += `
    <url>
        <loc>${baseUrl}/api/v1/persons/${person.id}</loc>
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
