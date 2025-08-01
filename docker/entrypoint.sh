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
echo "🔄 Preparing database..."

# Try to run migrations - if they fail, try to initialize the database
echo "🔄 Running database migrations..."
if npx prisma migrate deploy 2>/dev/null; then
    echo "✅ Database migrations completed successfully"
else
    echo "⚠️  Migrations failed - checking database state..."
    
    # Try to push schema if this is a fresh database
    echo "🔄 Attempting to initialize database schema..."
    if npx prisma db push --skip-generate 2>&1 | grep -q "success"; then
        echo "✅ Database schema initialized successfully"
        
        # Try migrations again after schema push
        if npx prisma migrate deploy 2>/dev/null; then
            echo "✅ Migration history established"
        else
            echo "⚠️  Could not establish migration history, but schema is ready"
        fi
    else
        echo "❌ Could not initialize database"
        echo "💡 Please check:"
        echo "   - DATABASE_URL is correct"
        echo "   - Database server is running and accessible"
        echo "   - Database user has proper permissions"
        echo ""
        echo "Current DATABASE_URL: ${DATABASE_URL%@*}@***"
        exit 1
    fi
fi

echo "📍 Starting application: $@"

# Execute the original command
exec "$@"