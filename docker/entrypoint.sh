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
echo "${YELLOW}🔄 Running database migrations...${NC}"
if npx prisma migrate deploy; then
    echo "${GREEN}✅ Database migrations completed successfully${NC}"
else
    echo "${RED}❌ Database migrations failed${NC}"
    echo "${YELLOW}💡 This might be the first run - trying to push schema instead...${NC}"
    
    # Try to push schema if migrations fail (for first-time setup)
    if npx prisma db push --accept-data-loss; then
        echo "${GREEN}✅ Database schema pushed successfully${NC}"
    else
        echo "${RED}❌ Database setup failed completely${NC}"
        exit 1
    fi
fi

echo "${GREEN}📍 Starting application: $@${NC}"

# Execute the original command
exec "$@"