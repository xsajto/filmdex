import { TmdbV2Crawler } from './src/crawlers/tmdb/tmdb.crawler';

async function testRateLimit() {
    const apiKey = process.env.TMDB_API_KEY;
    
    if (!apiKey) {
        console.error('TMDB_API_KEY is required');
        process.exit(1);
    }
    
    console.log('🧪 Testing TMDB rate limiter...');
    console.log('⏱️  Starting crawler with 3.5 requests/second rate limit');
    console.log('🔍 Watch for request timing in logs - should be ~285ms between requests');
    
    const crawler = new TmdbV2Crawler([apiKey]);
    
    // Run for a short time to observe rate limiting
    setTimeout(() => {
        console.log('\n✅ Rate limiter test completed - crawler should show throttled requests');
        process.exit(0);
    }, 10000);
    
    try {
        await crawler.runResume();
    } catch (error) {
        console.error('Crawler error:', error);
    }
}

testRateLimit().catch(console.error);