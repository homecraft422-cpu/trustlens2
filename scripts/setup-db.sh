#!/bin/bash

# TrustLens Database Setup Script
# This script sets up the database for development

echo "🚀 TrustLens Database Setup"
echo "=========================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Database
# Option 1: PostgreSQL (production)
# DATABASE_URL=postgresql://user:pass@localhost:5432/trustlens

# Option 2: SQLite (development - no setup needed!)
DATABASE_URL=file:./trustlens.db

# Auth Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "dev-secret-change-in-production-$(date +%s)")

# Detection Mode
DETECTION_MODE=mock

# Usage Limits
GUEST_ANALYSIS_LIMIT=5
USER_ANALYSIS_LIMIT=50
EOL
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo ""
echo "For production with PostgreSQL:"
echo "1. Install PostgreSQL"
echo "2. Create database: CREATE DATABASE trustlens;"
echo "3. Update DATABASE_URL in .env"
echo "4. Run: npm run db:migrate"
echo ""
