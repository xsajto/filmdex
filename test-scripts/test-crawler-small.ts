import 'dotenv/config';
import { TmdbV2Crawler } from '../crawlers/tmdb/tmdb.crawler';
import { TMDBIdExportsService } from '../crawlers/tmdb/tmdb-id-export.service';

async function testSmallCrawler() {
    console.log('🧪 Testing small TMDB crawler batch...');
    
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        console.error('TMDB_API_KEY environment variable is required');
        process.exit(1);
    }
    
    // Create a modified crawler that only processes a few movies
    class TestTmdbCrawler extends TmdbV2Crawler {
        async run() {
            console.log('🎬 Starting small test with 3 movies...');
            
            // Test with just 3 movies
            const testMovieIds = [
                { id: 550 },   // Fight Club
                { id: 680 },   // Pulp Fiction  
                { id: 238 }    // The Godfather
            ];
            
            const movieAppendParams = [
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
            
            const movieUrls = testMovieIds.map(movie => `https://api.themoviedb.org/3/movie/${movie.id}?append_to_response=${movieAppendParams}`);
            console.log(`📋 Enqueueing ${movieUrls.length} test movie URLs...`);
            
            await this.crawler.enqueue(movieUrls);
            console.log('✅ URLs enqueued successfully');
            
            console.log('🚀 Running crawler...');
            await this.crawler.run();
            console.log('✅ Crawler completed');
        }
    }
    
    const crawler = new TestTmdbCrawler(apiKey);
    try {
        await crawler.run();
        console.log('🎉 Small crawler test completed successfully!');
    } catch (error) {
        console.error('❌ Small crawler test failed:', error);
        throw error;
    }
}

// Run the test
testSmallCrawler()
    .then(() => {
        console.log('✨ Test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });