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

# Check basic connectivity first
echo "🔄 Testing database connectivity..."

# Extract connection details from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

# Test PostgreSQL connectivity using nc (netcat) first
if command -v nc >/dev/null 2>&1; then
    if ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        echo "❌ Cannot reach database server at $DB_HOST:$DB_PORT"
        echo "💡 Database server appears to be down or unreachable"
        echo "Connection details: ${DATABASE_URL%:*@*}@${DATABASE_URL##*@}"
        exit 1
    fi
    echo "✅ Database server is reachable"
fi

# Try to run migrations - if they fail, try to initialize the database
echo "🔄 Running database migrations..."

# Capture migration output for better error reporting
MIGRATION_OUTPUT=$(npx prisma migrate deploy 2>&1)
MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
else
    echo "⚠️  Migrations failed - checking database state..."
    echo "Migration error output:"
    echo "$MIGRATION_OUTPUT"
    echo ""
    echo "Database connection: ${DATABASE_URL%:*@*}@${DATABASE_URL##*@}"
    
    # Try to push schema if this is a fresh database
    echo "🔄 Attempting to initialize database schema..."
    
    # Capture schema push output
    SCHEMA_OUTPUT=$(npx prisma db push --skip-generate 2>&1)
    SCHEMA_EXIT_CODE=$?
    
    if [ $SCHEMA_EXIT_CODE -eq 0 ]; then
        echo "✅ Database schema initialized successfully"
        
        # Try migrations again after schema push
        if npx prisma migrate deploy 2>/dev/null; then
            echo "✅ Migration history established"
        else
            echo "⚠️  Could not establish migration history, but schema is ready"
        fi
    else
        echo "❌ Could not initialize database"
        echo "Schema push error output:"
        echo "$SCHEMA_OUTPUT"
        echo ""
        echo "💡 Please check:"
        echo "   - Database server is running and accessible"
        echo "   - Database user has proper permissions"
        echo "   - Database '${DATABASE_URL##*/}' exists"
        echo ""
        echo "Connection details: ${DATABASE_URL%:*@*}@${DATABASE_URL##*@}"
        exit 1
    fi
fi

echo "📍 Starting application: $@"

# Execute the original command
exec "$@"