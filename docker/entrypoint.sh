#!/bin/sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${GREEN}🎬 Starting Filmdex Movie Crawler...${NC}"

# Function to check required environment variable
check_env_var() {
    local var_name=$1
    local var_value=$(eval echo \$$var_name)
    
    if [ -z "$var_value" ]; then
        echo "${RED}❌ ERROR: Required environment variable '$var_name' is not set${NC}"
        return 1
    else
        echo "${GREEN}✅ $var_name is configured${NC}"
        return 0
    fi
}

# Check if this is TMDB crawler (needs TMDB_API_KEY)
if echo "$@" | grep -q "tmdb"; then
    echo "${YELLOW}🔍 Validating TMDB crawler environment...${NC}"
    
    if ! check_env_var "TMDB_API_KEY"; then
        echo "${RED}💡 TMDB_API_KEY is required for TMDB crawler. Get it from: https://www.themoviedb.org/settings/api${NC}"
        exit 1
    fi
fi

# Check if this is API server (might need additional vars)
if echo "$@" | grep -q "api/server"; then
    echo "${YELLOW}🌐 Validating API server environment...${NC}"
    
    # API server might need specific environment variables
    # Add checks here if needed
fi

# DATABASE_URL is always required
echo "${YELLOW}🗄️  Validating database environment...${NC}"
if ! check_env_var "DATABASE_URL"; then
    echo "${RED}💡 DATABASE_URL is required. Example: 'postgresql://user:pass@host:5432/dbname' for PostgreSQL${NC}"
    exit 1
fi

echo "${GREEN}🚀 All environment variables validated successfully!${NC}"

# Run database migrations before starting the application
echo "${YELLOW}🔄 Checking database connection...${NC}"

# First, check if we can connect to the database at all
if ! npx prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
    echo "${RED}❌ Cannot connect to database${NC}"
    echo "${YELLOW}💡 Please ensure your database is running and DATABASE_URL is correct${NC}"
    exit 1
fi

echo "${GREEN}✅ Database connection successful${NC}"

# Check if the database has the migrations table
echo "${YELLOW}🔍 Checking if database schema exists...${NC}"
if npx prisma db execute --stdin <<< "SELECT 1 FROM _prisma_migrations LIMIT 1;" >/dev/null 2>&1; then
    # Database exists and has migration history - use normal migration
    echo "${YELLOW}🔄 Running database migrations...${NC}"
    if npx prisma migrate deploy; then
        echo "${GREEN}✅ Database migrations completed successfully${NC}"
    else
        echo "${RED}❌ Database migrations failed${NC}"
        echo "${RED}Please check your migration files and database state${NC}"
        exit 1
    fi
else
    # No migration table found - check if ANY tables exist
    echo "${YELLOW}🔍 Checking if database is empty...${NC}"
    
    # This query works for PostgreSQL to check if any user tables exist
    TABLE_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | grep -o '[0-9]\+' | head -1)
    
    if [ -z "$TABLE_COUNT" ] || [ "$TABLE_COUNT" = "0" ]; then
        echo "${YELLOW}⚠️  Database is empty - initializing schema...${NC}"
        echo "${YELLOW}This appears to be a fresh database installation${NC}"
        
        # Only push schema if database is completely empty
        if npx prisma db push --skip-generate; then
            echo "${GREEN}✅ Database schema initialized successfully${NC}"
            
            # Now create initial migration to establish migration history
            echo "${YELLOW}📝 Creating initial migration record...${NC}"
            if npx prisma migrate deploy; then
                echo "${GREEN}✅ Migration history established${NC}"
            else
                echo "${YELLOW}⚠️  Could not establish migration history, but schema is ready${NC}"
            fi
        else
            echo "${RED}❌ Failed to initialize database schema${NC}"
            exit 1
        fi
    else
        echo "${RED}❌ Database has tables but no migration history!${NC}"
        echo "${RED}This is a dangerous state - manual intervention required${NC}"
        echo "${YELLOW}Options:${NC}"
        echo "${YELLOW}1. If this is a legacy database, create a baseline migration${NC}"
        echo "${YELLOW}2. If this is corrupted, consider backing up and resetting${NC}"
        echo "${YELLOW}3. Contact your database administrator${NC}"
        exit 1
    fi
fi

echo "${GREEN}📍 Starting application: $@${NC}"

# Execute the original command
exec "$@"