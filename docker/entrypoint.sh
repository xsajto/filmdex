#!/bin/sh

echo "🎬 Starting Filmdex Movie Crawler..."

# Function to check required environment variable
check_env_var() {
    local var_name=$1
    local var_value=$(eval echo \$$var_name)
    
    if [ -z "$var_value" ]; then
        echo "❌ ERROR: Required environment variable '$var_name' is not set"
        return 1
    else
        echo "✅ $var_name is configured"
        return 0
    fi
}

# Check if this is TMDB crawler (needs TMDB_API_KEY)
if echo "$@" | grep -q "tmdb"; then
    echo "🔍 Validating TMDB crawler environment..."
    
    if ! check_env_var "TMDB_API_KEY"; then
        echo "💡 TMDB_API_KEY is required for TMDB crawler. Get it from: https://www.themoviedb.org/settings/api"
        exit 1
    fi
fi

# Check if this is API server (might need additional vars)
if echo "$@" | grep -q "api/server"; then
    echo "🌐 Validating API server environment..."
    
    # API server might need specific environment variables
    # Add checks here if needed
fi

# DATABASE_URL is always required
echo "🗄️  Validating database environment..."
if ! check_env_var "DATABASE_URL"; then
    echo "💡 DATABASE_URL is required. Example: 'postgresql://user:pass@host:5432/dbname' for PostgreSQL"
    exit 1
fi

echo "🚀 All environment variables validated successfully!"

# Run database migrations before starting the application
echo "🔄 Checking database connection..."

# First, check if we can connect to the database at all
if ! npx prisma db execute --stdin <<< "SELECT 1;" >/dev/null 2>&1; then
    echo "❌ Cannot connect to database"
    echo "💡 Please ensure your database is running and DATABASE_URL is correct"
    exit 1
fi

echo "✅ Database connection successful"

# Check if the database has the migrations table
echo "🔍 Checking if database schema exists..."
if npx prisma db execute --stdin <<< "SELECT 1 FROM _prisma_migrations LIMIT 1;" >/dev/null 2>&1; then
    # Database exists and has migration history - use normal migration
    echo "🔄 Running database migrations..."
    if npx prisma migrate deploy; then
        echo "✅ Database migrations completed successfully"
    else
        echo "❌ Database migrations failed"
        echo "Please check your migration files and database state"
        exit 1
    fi
else
    # No migration table found - check if ANY tables exist
    echo "🔍 Checking if database is empty..."
    
    # This query works for PostgreSQL to check if any user tables exist
    TABLE_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | grep -o '[0-9]\+' | head -1)
    
    if [ -z "$TABLE_COUNT" ] || [ "$TABLE_COUNT" = "0" ]; then
        echo "⚠️  Database is empty - initializing schema..."
        echo "This appears to be a fresh database installation"
        
        # Only push schema if database is completely empty
        if npx prisma db push --skip-generate; then
            echo "✅ Database schema initialized successfully"
            
            # Now create initial migration to establish migration history
            echo "📝 Creating initial migration record..."
            if npx prisma migrate deploy; then
                echo "✅ Migration history established"
            else
                echo "⚠️  Could not establish migration history, but schema is ready"
            fi
        else
            echo "❌ Failed to initialize database schema"
            exit 1
        fi
    else
        echo "❌ Database has tables but no migration history!"
        echo "This is a dangerous state - manual intervention required"
        echo "Options:"
        echo "1. If this is a legacy database, create a baseline migration"
        echo "2. If this is corrupted, consider backing up and resetting"
        echo "3. Contact your database administrator"
        exit 1
    fi
fi

echo "📍 Starting application: $@"

# Execute the original command
exec "$@"