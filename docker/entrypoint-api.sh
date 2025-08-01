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

# Extract connection details from DATABASE_URL
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Test PostgreSQL connectivity using nc (netcat) first
if command -v nc >/dev/null 2>&1; then
    if ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        echo "❌ Cannot reach database server at $DB_HOST:$DB_PORT"
        echo "💡 Database server appears to be down or unreachable"
        echo ""
        echo "Connection details: ${DATABASE_URL%:*@*}@${DATABASE_URL##*@}"
        exit 1
    fi
fi

# Try connecting with a simple query using the Node.js Prisma client
if timeout 10 node -e "
const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => {
    console.log('Database connection successful');
    process.exit(0);
}).catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
}).finally(() => prisma.\$disconnect());
" 2>/dev/null; then
    echo "✅ Database connection verified"
else
    echo "❌ Cannot connect to database"
    echo "💡 API requires database connectivity to function"
    echo ""
    echo "Please ensure:"
    echo "   - Database server is running and accessible at $DB_HOST:$DB_PORT"
    echo "   - Database '$DB_NAME' exists"
    echo "   - User '$DB_USER' has proper permissions"
    echo "   - Crawler has completed database initialization"
    echo ""
    echo "Connection details: ${DATABASE_URL%:*@*}@${DATABASE_URL##*@}"
    exit 1
fi

echo "📍 Starting application: $@"

# Execute the original command
exec "$@"