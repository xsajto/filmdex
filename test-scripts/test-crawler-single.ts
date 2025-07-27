import 'dotenv/config';
import { ApiCrawler } from '@crawlus/api';
import { RequestQueue, log } from '@crawlus/core';
import { createTmdbV2Router } from '../crawlers/tmdb/tmdb.router';
import { PrismaRequestQueueStorage } from '../shared/prisma-request-queue-storage';

async function testSingleMovieRequest() {
    const router = createTmdbV2Router();
    
    // Test just one movie with append_to_response
    const movieId = 550; // Fight Club
    const appendParams = [
        'alternative_titles',
        'external_ids', 
        'credits',
        'images',
        'keywords',
        'translations',
        'videos',
        'reviews',
        'recommendations',
        'similar',
        'watch/providers',
        'release_dates',
        'lists'
    ].join(',');
    
    const testUrl = `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=${appendParams}`;
    
    console.log('🎬 Testing single movie crawler with full append_to_response...');
    console.log(`URL: ${testUrl}`);
    
    const crawler = new ApiCrawler({
        requestHandler: router,
        requestQueue: new RequestQueue({name: 'tmdb-test', storage: new PrismaRequestQueueStorage('tmdb-test')}),
        maxConcurrency: 1,
        clearOnStart: true,
        
        apiKeys: [{
            auth: {
                type: 'bearer',
                apiKey: process.env.TMDB_API_KEY!,
            },
            rateLimiter: {
                requestsPerSecond: 1,
            }
        }],
        respectRateLimits: true,
        
        apiEndpoint: {
            baseUrl: 'https://api.themoviedb.org/3',
            timeout: 30000,
            autoParseJson: true,
            autoHandlePagination: false
        }
    });
    
    try {
        console.log('📋 Enqueueing test URL...');
        await crawler.enqueue([testUrl]);
        console.log('🚀 Running crawler...');
        await crawler.run();
        console.log('✅ Single movie test completed successfully!');
    } catch (error) {
        console.error('❌ Single movie test failed:', error);
        throw error;
    }
}

// Run the test
testSingleMovieRequest()
    .then(() => {
        console.log('✨ Crawler test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Crawler test failed:', error);
        process.exit(1);
    });