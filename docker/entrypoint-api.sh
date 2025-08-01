#!/bin/sh

echo "🌐 Starting Filmdex API Server..."

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

# Check if this is API server
if echo "$@" | grep -q "api/server"; then
    echo "🌐 Validating API server environment..."
    
    # API server might need specific environment variables
    # Add checks here if needed
fi

# DATABASE_URL is always required for API
echo "🗄️  Validating database environment..."
if ! check_env_var "DATABASE_URL"; then
    echo "💡 DATABASE_URL is required. Example: 'postgresql://user:pass@host:5432/dbname' for PostgreSQL"
    exit 1
fi

echo "🚀 All environment variables validated successfully!"

# Check database connectivity before starting API
echo "🔄 Verifying database connection..."

# Try a simple database connection test
if echo "SELECT 1;" | npx prisma db execute --stdin >/dev/null 2>&1; then
    echo "✅ Database connection verified"
else
    echo "❌ Cannot connect to database"
    echo "💡 API requires database connectivity to function"
    echo ""
    echo "Please ensure:"
    echo "   - Database server is running and accessible"
    echo "   - DATABASE_URL is correct: ${DATABASE_URL%:*@*}@${DATABASE_URL##*@}"
    echo "   - Database user has proper permissions"
    echo "   - Crawler has completed database initialization"
    echo ""
    exit 1
fi

echo "📍 Starting application: $@"

# Execute the original command
exec "$@"