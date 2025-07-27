import express from 'express';
import { PrismaClient } from '../../generated/prisma';
import { log } from '@crawlus/core';

const app: express.Application = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// List all movies/series with basic info
app.get('/titles', async (req, res) => {
    try {
        const { page = 1, limit = 20, type, source } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        
        const whereClause: { type?: string; remoteSource?: string } = {};
        if (type && typeof type === 'string') whereClause.type = type;
        if (source && typeof source === 'string') whereClause.remoteSource = source;

        const [movies, total] = await Promise.all([
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
                    createdAt: true
                },
                skip: offset,
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.content.count({ where: whereClause })
        ]);

        res.json({
            data: movies,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        log.error('Failed to fetch titles:', err as Error);
        res.status(500).json({ error: 'Failed to fetch titles' });
    }
});

// Get detailed info about a specific movie/series
app.get('/titles/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const movie = await prisma.content.findUnique({
            where: { id },
            include: {
                cast: {
                    include: { person: true }
                },
                children: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        type: true
                    }
                },
                parent: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        type: true
                    }
                }
            }
        });
        
        if (!movie) {
            return res.status(404).json({ error: 'Movie/Series not found' });
        }
        
        res.json(movie);
    } catch (err) {
        log.error('Failed to fetch movie details:', err as Error);
        res.status(500).json({ error: 'Failed to fetch details' });
    }
});

// Search movies/series
app.get('/search', async (req, res) => {
    const { q, type, source, page = 1, limit = 20 } = req.query;
    
    if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    try {
        const offset = (Number(page) - 1) * Number(limit);
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

        const [movies, total] = await Promise.all([
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
                    rating: true
                },
                skip: offset,
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.content.count({ where: whereClause })
        ]);

        res.json({
            data: movies,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        log.error('Failed to search titles:', err as Error);
        res.status(500).json({ error: 'Failed to search titles' });
    }
});

// Get statistics
app.get('/stats', async (req, res) => {
    try {
        const [totalMovies, totalSeries, sources, recentMovies] = await Promise.all([
            prisma.content.count({ where: { type: 'movie' } }),
            prisma.content.count({ where: { type: 'series' } }),
            prisma.content.groupBy({
                by: ['remoteSource'],
                _count: { id: true }
            }),
            prisma.content.count({
                where: {
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
            })
        ]);

        res.json({
            totalMovies,
            totalSeries,
            totalTitles: totalMovies + totalSeries,
            sources: sources.map(s => ({
                source: s.remoteSource,
                count: s._count.id
            })),
            recentlyAdded: recentMovies
        });
    } catch (err) {
        log.error('Failed to fetch stats:', err as Error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Export movie/series to JSON
app.get('/export/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    
    try {
        const movie = await prisma.content.findUnique({
            where: { id },
            include: {
                cast: {
                    include: { person: true }
                },
                children: {
                    include: {
                        cast: {
                    include: { person: true }
                }
                                    }
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
        
        if (!movie) {
            return res.status(404).json({ error: 'Movie/Series not found' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${movie.title.replace(/[^a-zA-Z0-9]/g, '_')}.json"`);
        res.json(movie);
    } catch (err) {
        log.error('Failed to export movie:', err as Error);
        res.status(500).json({ error: 'Failed to export movie' });
    }
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