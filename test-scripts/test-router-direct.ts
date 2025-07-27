import 'dotenv/config';
import { log } from '@crawlus/core';
import { createTmdbDatabaseService } from '../shared/database';

async function testDirectRouterCall() {
    console.log('🧪 Testing direct TMDB API call and database save...');
    
    const dbService = createTmdbDatabaseService();
    await dbService.initialize();
    
    try {
        // Make direct API call to TMDB
        const movieId = '550';
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
        
        const url = `https://api.themoviedb.org/3/movie/${movieId}?append_to_response=${appendParams}`;
        console.log(`📡 Fetching: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${process.env.TMDB_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const movieData = await response.json();
        console.log(`📊 Received data for: ${movieData.title} (${movieData.release_date})`);
        console.log(`🔗 Has append data: credits=${!!movieData.credits}, genres=${!!movieData.genres}, images=${!!movieData.images}`);
        
        // Test database save
        console.log('💾 Saving to database...');
        const contentId = await dbService.upsertMovie(movieId, movieData, `https://www.themoviedb.org/movie/${movieId}`);
        console.log(`✅ Movie saved with content ID: ${contentId}`);
        
        // Save relational data
        console.log('🔗 Saving relational data...');
        await dbService.saveMovieRelations(contentId, movieData);
        console.log('✅ Relational data saved');
        
        // Save credits
        if (movieData.credits) {
            console.log('🎭 Saving credits...');
            await dbService.saveCredits('content', contentId, movieData.credits);
            console.log('✅ Credits saved');
        }
        
        // Save other append_to_response data
        if (movieData.images) {
            console.log('🖼️ Saving images...');
            await dbService.saveImages('content', contentId, movieData.images);
            console.log('✅ Images saved');
        }
        
        if (movieData.keywords) {
            console.log('🏷️ Saving keywords...');
            await dbService.saveContentKeywords('content', contentId, movieData.keywords);
            console.log('✅ Keywords saved');
        }
        
        console.log('🎉 All operations completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        await dbService.close();
    }
}

// Run the test
testDirectRouterCall()
    .then(() => {
        console.log('✨ Direct router test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Direct router test failed:', error);
        process.exit(1);
    });