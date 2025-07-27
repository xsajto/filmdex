import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma';

async function checkDatabase() {
    const prisma = new PrismaClient();
    
    try {
        console.log('📊 Checking database contents...\n');
        
        // Check Content table
        const contentCount = await prisma.content.count();
        console.log(`📺 Total content items: ${contentCount}`);
        
        const movieCount = await prisma.content.count({ where: { type: 'movie' } });
        const seriesCount = await prisma.content.count({ where: { type: 'series' } });
        const seasonCount = await prisma.content.count({ where: { type: 'season' } });
        const episodeCount = await prisma.content.count({ where: { type: 'episode' } });
        
        console.log(`  - Movies: ${movieCount}`);
        console.log(`  - Series: ${seriesCount}`);
        console.log(`  - Seasons: ${seasonCount}`);
        console.log(`  - Episodes: ${episodeCount}`);
        
        // Check other tables (with error handling)
        const checkTableCount = async (tableName: string, countFn: () => Promise<number>) => {
            try {
                return await countFn();
            } catch {
                console.log(`  ⚠️ Could not check ${tableName} table`);
                return 0;
            }
        };
        
        const personCount = await checkTableCount('Person', () => prisma.person.count());
        const castCount = await checkTableCount('Cast', () => prisma.cast.count());
        const genreCount = await checkTableCount('Genre', () => prisma.genre.count());
        const countryCount = await checkTableCount('Country', () => prisma.country.count());
        const languageCount = await checkTableCount('Language', () => prisma.language.count());
        const organizationCount = await checkTableCount('Organization', () => prisma.organization.count());
        const keywordCount = await checkTableCount('Keyword', () => prisma.keyword.count());
        const mediaCount = await checkTableCount('Media', () => prisma.media.count());
        
        console.log(`\n👥 Total persons: ${personCount}`);
        console.log(`🎭 Total cast/crew entries: ${castCount}`);
        console.log(`🎨 Total genres: ${genreCount}`);
        console.log(`🌍 Total countries: ${countryCount}`);
        console.log(`🗣️ Total languages: ${languageCount}`);
        console.log(`🏢 Total organizations: ${organizationCount}`);
        console.log(`🏷️ Total keywords: ${keywordCount}`);
        console.log(`📱 Total media files: ${mediaCount}`);
        
        // Check recent content
        if (contentCount > 0) {
            console.log('\n📅 Recent content (last 5):');
            const recentContent = await prisma.content.findMany({
                take: 5,
                orderBy: { lastCrawledAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    type: true,
                    remoteId: true,
                    lastCrawledAt: true
                }
            });
            
            recentContent.forEach(content => {
                console.log(`  - [${content.type}] "${content.title}" (ID: ${content.remoteId}, crawled: ${content.lastCrawledAt?.toISOString()})`);
            });
        }
        
        // Check request queue
        const requestCount = await checkTableCount('RequestQueue', () => prisma.requestQueue.count());
        const pendingCount = await checkTableCount('RequestQueue pending', () => prisma.requestQueue.count({ where: { status: 'PENDING' } }));
        const processingCount = await checkTableCount('RequestQueue processing', () => prisma.requestQueue.count({ where: { status: 'PROCESSING' } }));
        const completedCount = await checkTableCount('RequestQueue completed', () => prisma.requestQueue.count({ where: { status: 'PROCESSED' } }));
        const failedCount = await checkTableCount('RequestQueue failed', () => prisma.requestQueue.count({ where: { status: 'FAILED' } }));
        
        console.log('\n📋 Request queue status:');
        console.log(`  - Total: ${requestCount}`);
        console.log(`  - Pending: ${pendingCount}`);
        console.log(`  - Processing: ${processingCount}`);
        console.log(`  - Completed: ${completedCount}`);
        console.log(`  - Failed: ${failedCount}`);
        
    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the check
checkDatabase()
    .then(() => console.log('\n✅ Database check completed'))
    .catch(console.error);