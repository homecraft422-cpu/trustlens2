#!/bin/bash
set -euo pipefail

# TrustLens Database Setup
#
# Creates a .env file (if missing) and applies the PostgreSQL migrations.
# TrustLens requires PostgreSQL — accounts, sessions and magic-link tokens
# must live in a shared database so they survive across server instances.

echo "🚀 TrustLens Database Setup"
echo "==========================="
echo ""

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    SECRET="$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)"
    cat > .env <<EOL
# ── Database (required) ──────────────────────────────────────────────
# PostgreSQL connection string. Local example:
#   postgresql://postgres:postgres@127.0.0.1:5432/trustlens
# Hosted (Neon/Supabase/Vercel Postgres) usually needs ?sslmode=require
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/trustlens

# ── Auth (required) ──────────────────────────────────────────────────
# Keep this stable. Changing it invalidates all sessions and passwords.
AUTH_SECRET=${SECRET}

# ── App ──────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Email (magic links) ──────────────────────────────────────────────
# "console" prints the link to the server log (local development only).
# Use "resend" or "smtp" in production so links reach real inboxes.
EMAIL_PROVIDER=console
EMAIL_FROM=TrustLens <no-reply@trustlens.ai>

# ── Detection ────────────────────────────────────────────────────────
DETECTION_MODE=mock
EOL
    echo "✅ .env created (a random AUTH_SECRET was generated)"
else
    echo "✅ .env already exists — leaving it untouched"
fi

echo ""
echo "🔍 Checking the database connection..."
if ! npm run --silent db:check; then
    echo ""
    echo "❌ Could not reach the database."
    echo "   Update DATABASE_URL in .env, then re-run: npm run db:setup"
    exit 1
fi

echo ""
echo "📦 Applying migrations..."
npm run --silent db:migrate

echo ""
echo "✅ Database ready."
echo ""
echo "Next steps:"
echo "  npm run db:seed   # optional demo data + demo@trustlens.ai account"
echo "  npm run dev"
echo ""
