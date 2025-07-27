import 'dotenv/config';
import { mainResume } from '../crawlers/tmdb/tmdb.crawler';

// CommonJS: Run if this file is executed directly
if (require.main === module) {
    mainResume().catch(console.error);
}