import { createTmdbDatabaseService } from '../shared/database';
import 'dotenv/config';

async function testDatabaseOperations() {
    const dbService = createTmdbDatabaseService();
    
    try {
        console.log('🔗 Initializing database connection...');
        await dbService.initialize();
        console.log('✅ Database service initialized successfully');
        
        // Test movie data from TMDB API format
        const movieData = {
            id: 550,
            title: 'Fight Club',
            original_title: 'Fight Club',
            release_date: '1999-10-15',
            overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
            vote_average: 8.4,
            vote_count: 27000,
            popularity: 61.416,
            status: 'Released',
            budget: 63000000,
            revenue: 100853753,
            runtime: 139,
            genres: [
                { id: 18, name: 'Drama' },
                { id: 53, name: 'Thriller' },
                { id: 35, name: 'Comedy' }
            ],
            production_countries: [
                { iso_3166_1: 'US', name: 'United States of America' }
            ],
            spoken_languages: [
                { iso_639_1: 'en', english_name: 'English', name: 'English' }
            ],
            production_companies: [
                { id: 508, name: '20th Century Fox', logo_path: '/7PzJdsLGlR7oW4J0J5Xcd0pHGRg.png', origin_country: 'US' },
                { id: 711, name: 'Fox 2000 Pictures', logo_path: '/tEiIH5QesdheJmDAqQwvtN60727.png', origin_country: 'US' }
            ]
        };
        
        console.log('🎬 Testing movie upsert operation...');
        const contentId = await dbService.upsertMovie('550', movieData, 'https://www.themoviedb.org/movie/550');
        console.log(`✅ Movie "${movieData.title}" upserted successfully with content ID: ${contentId}`);
        
        // Test TV show data from TMDB API format
        const tvData = {
            id: 1399,
            name: 'Game of Thrones',
            original_name: 'Game of Thrones',
            first_air_date: '2011-04-17',
            overview: 'Seven noble families fight for control of the mythical land of Westeros.',
            vote_average: 8.3,
            vote_count: 11504,
            popularity: 369.594,
            status: 'Ended',
            number_of_episodes: 73,
            number_of_seasons: 8,
            genres: [
                { id: 10765, name: 'Sci-Fi & Fantasy' },
                { id: 18, name: 'Drama' },
                { id: 10759, name: 'Action & Adventure' }
            ],
            origin_country: ['US'],
            spoken_languages: [
                { iso_639_1: 'en', english_name: 'English', name: 'English' }
            ],
            production_companies: [
                { id: 76043, name: 'Revolution Sun Studios', logo_path: undefined, origin_country: 'US' },
                { id: 12525, name: 'Television 360', logo_path: undefined, origin_country: 'US' }
            ],
            networks: [
                { id: 49, name: 'HBO', logo_path: '/tuomPhY2UtuPTqqFnKMVHvSb724.png', origin_country: 'US' }
            ]
        };
        
        console.log('📺 Testing TV show upsert operation...');
        const tvContentId = await dbService.upsertTVShow('1399', tvData, 'https://www.themoviedb.org/tv/1399');
        console.log(`✅ TV show "${tvData.name}" upserted successfully with content ID: ${tvContentId}`);
        
        // Test person data from TMDB API format
        const personData = {
            id: 287,
            name: 'Brad Pitt',
            biography: 'William Bradley Pitt is an American actor and film producer.',
            birthday: '1963-12-18',
            place_of_birth: 'Shawnee, Oklahoma, USA',
            gender: 2,
            known_for_department: 'Acting',
            popularity: 10.645,
            profile_path: '/ajNaPmXVVMJFg9GWmu6MJzTaXdV.jpg',
            also_known_as: [
                'William Bradley Pitt',
                'Бред Питт',
                'Бред Пітт',
                'براد بيت',
                'ブラッド・ピット'
            ]
        };
        
        console.log('👤 Testing person upsert operation...');
        await dbService.upsertPerson('287', personData, 'https://www.themoviedb.org/person/287');
        console.log(`✅ Person "${personData.name}" upserted successfully`);
        
        // Test credits/cast operations
        const creditsData = {
            cast: [
                {
                    id: 287,
                    name: 'Brad Pitt',
                    character: 'Tyler Durden',
                    order: 0
                },
                {
                    id: 819,
                    name: 'Edward Norton',
                    character: 'The Narrator',
                    order: 1
                }
            ],
            crew: [
                {
                    id: 7467,
                    name: 'David Fincher',
                    job: 'Director',
                    department: 'Directing'
                }
            ]
        };
        
        console.log('🎭 Testing credits save operation...');
        await dbService.saveCredits('content', contentId, creditsData);
        console.log('✅ Credits saved successfully');
        
        console.log('🔗 Testing relational data save for movie...');
        await dbService.saveMovieRelations(contentId, movieData);
        console.log('✅ Movie relational data saved successfully');
        
        console.log('📡 Testing relational data save for TV show...');
        await dbService.saveTVShowRelations(tvContentId, tvData);
        console.log('✅ TV show relational data saved successfully');
        
        console.log('🎉 All database operations completed successfully!');
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
        throw error;
    } finally {
        console.log('🔚 Closing database connection...');
        await dbService.close();
        console.log('✅ Database connection closed');
    }
}

// Run the test
testDatabaseOperations()
    .then(() => {
        console.log('✨ Database test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Database test failed:', error);
        process.exit(1);
    });