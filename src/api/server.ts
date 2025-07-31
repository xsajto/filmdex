import express from 'express';
import { PrismaClient } from '../../generated/prisma';
import { log } from '@crawlus/core';

// Swagger imports
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import handlers
import contentRoutes from './handlers/content';
import personsRoutes from './handlers/persons';
import searchRoutes from './handlers/search';
import mediaRoutes from './handlers/media';
import metadataRoutes from './handlers/metadata';
import statsRoutes from './handlers/stats';
import exportRoutes from './handlers/export';
import sitemapRoutes from './handlers/sitemap';

const app: express.Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// API base path
const API_PREFIX = '/api/v1';

/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 */

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Movies Crawler API',
            version: '1.0.0',
            description: 'Comprehensive API for movie and TV show data from CSFD and TMDB sources. Access detailed information about movies, series, actors, and more.',
            contact: {
                name: 'API Support',
                email: 'support@filmdex.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server'
            },
            {
                url: 'https://api.filmdex.com',
                description: 'Production server'
            }
        ],
        tags: [
            {
                name: 'System',
                description: 'System health and status endpoints'
            },
            {
                name: 'Content',
                description: 'Operations related to movies, series, seasons, and episodes'
            },
            {
                name: 'Persons',
                description: 'Operations related to actors, directors, and other crew members'
            },
            {
                name: 'Search',
                description: 'Search operations across all content and persons'
            },
            {
                name: 'Media',
                description: 'Operations related to images and videos'
            },
            {
                name: 'Metadata',
                description: 'Operations related to genres, countries, languages, and collections'
            },
            {
                name: 'Statistics',
                description: 'Statistical data and trending content'
            },
            {
                name: 'Export',
                description: 'Export operations for content and person data'
            }
        ]
    },
    apis: ['./src/api/handlers/*.ts', './src/api/server.ts']
};

const specs = swaggerJsdoc(swaggerOptions);

// Set up Swagger UI at /doc
app.use('/doc', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 50px 0; }
        .swagger-ui .info .title { color: #3b4151; }
    `,
    customSiteTitle: 'Filmdex API Documentation',
    swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true
    }
}));

// Also keep /api-docs for backward compatibility
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Movies Crawler API Documentation'
}));


/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-07-28T10:30:00.000Z
 */
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use(`${API_PREFIX}/content`, contentRoutes);
app.use(`${API_PREFIX}/persons`, personsRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/media`, mediaRoutes);
app.use(API_PREFIX, metadataRoutes); // genres, countries, languages, collections
app.use(API_PREFIX, statsRoutes); // stats, trending
app.use(`${API_PREFIX}/export`, exportRoutes);

// Mount sitemap routes
app.use('/sitemap.xml', sitemapRoutes);
app.use('/sitemap', sitemapRoutes);

// Legacy endpoint for backward compatibility
app.get('/titles', (req, res) => {
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    res.redirect(301, `${API_PREFIX}/content?${queryString}`);
});

// Additional legacy endpoints for backward compatibility
app.get('/titles/:id', (req, res) => {
    res.redirect(301, `${API_PREFIX}/content/${req.params.id}`);
});

app.get('/search', (req, res) => {
    const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
    res.redirect(301, `${API_PREFIX}/search?${queryString}`);
});

app.get('/stats', (req, res) => {
    res.redirect(301, `${API_PREFIX}/stats`);
});

app.get('/export/:id', (req, res) => {
    res.redirect(301, `${API_PREFIX}/export/content/${req.params.id}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    log.info('Received SIGTERM, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    log.info('Received SIGINT, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(PORT, () => {
    log.info(`API server running on port ${PORT}`);
});

export default app;