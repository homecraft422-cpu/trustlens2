# 🗄️ TrustLens2 - Complete Database & API Setup Guide

## 📋 Table of Contents
1. [Database Architecture](#database-architecture)
2. [PostgreSQL Setup (Production)](#postgresql-setup)
3. [SQLite Setup (Development)](#sqlite-setup)
4. [API Keys Explained](#api-keys)
5. [Environment Variables](#environment-variables)
6. [Migration Guide](#migration-guide)

---

## 🏗️ Database Architecture

### Database Tables Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRUSTLENS DATABASE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │    users     │────▶│   sessions   │     │ usage_events │    │
│  │              │     │              │     │              │    │
│  │ • id (UUID)  │     │ • id (UUID)  │     │ • id (UUID)  │    │
│  │ • email      │     │ • user_id    │     │ • user_id    │    │
│  │ • name       │     │ • token      │     │ • guest_id   │    │
│  │ • password   │     │ • expires_at │     │ • event_type │    │
│  │ • role       │     └──────────────┘     │ • job_id     │    │
│  └──────┬───────┘                          └──────────────┘    │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │    assets    │────▶│analysis_jobs │────▶│analysis_results│  │
│  │              │     │              │     │              │    │
│  │ • id (UUID)  │     │ • id (UUID)  │     │ • id (UUID)  │    │
│  │ • filename   │     │ • asset_id   │     │ • job_id     │    │
│  │ • mime_type  │     │ • user_id    │     │ • verdict    │    │
│  │ • file_size  │     │ • status     │     │ • ai_score   │    │
│  │ • storage_key│     │ • job_type   │     │ • manip_score│    │
│  └──────────────┘     └──────────────┘     └──────┬───────┘    │
│                                                    │            │
│                           ┌────────────────────────┼──────┐    │
│                           ▼                        ▼      │    │
│                    ┌──────────────┐         ┌──────────────┐    │
│                    │   reports    │         │analysis_signals│   │
│                    │              │         │              │    │
│                    │ • id (UUID)  │         │ • id (UUID)  │    │
│                    │ • result_id  │         │ • result_id  │    │
│                    │ • public_id  │         │ • category   │    │
│                    │ • is_public  │         │ • signal_type│    │
│                    └──────────────┘         │ • score      │    │
│                                             │ • severity   │    │
│                                             └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Table Descriptions

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **users** | Store user accounts | id, email, name, password_hash, role |
| **sessions** | Manage login sessions | id, user_id, token, expires_at |
| **assets** | Uploaded files metadata | id, filename, mime_type, file_size, storage_key |
| **analysis_jobs** | Track analysis tasks | id, asset_id, user_id, status |
| **analysis_results** | Store analysis results | id, job_id, verdict, scores |
| **analysis_signals** | Detailed detection signals | id, result_id, category, severity |
| **reports** | Shareable reports | id, result_id, public_id, is_public |
| **usage_events** | Track API usage | id, user_id, guest_id, event_type |

---

## 🐘 PostgreSQL Setup (Production)

### Step 1: Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (with Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### Step 2: Create Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE trustlens;

# Create user with password
CREATE USER trustlens_user WITH PASSWORD 'your_secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE trustlens TO trustlens_user;

# Exit
\q
```

### Step 3: Configure Environment

Create `.env` file:
```env
# Database URL
DATABASE_URL=postgresql://trustlens_user:your_secure_password_here@localhost:5432/trustlens

# Or for cloud databases:
# DATABASE_URL=postgresql://user:pass@host:port/database?sslmode=require
```

### Step 4: Run Migrations

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed demo data (optional)
npm run db:seed
```

---

## 💾 SQLite Setup (Development - No PostgreSQL needed!)

For development without PostgreSQL, use SQLite:

### Step 1: Install SQLite package

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

### Step 2: Create SQLite Database Config

Create `src/db/sqlite.ts`:

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('trustlens.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
```

### Step 3: Create Database Tables

Run the setup script:
```bash
npm run db:setup:sqlite
```

---

## 🔑 API Keys Explained

### What are API Keys?

API keys are **secret tokens** that authenticate your application with external services. TrustLens uses them to access **AI detection providers**.

### API Keys in TrustLens

```
┌─────────────────────────────────────────────────────────────┐
│                    API KEYS NEEDED                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DETECTION PROVIDERS (for AI detection)                  │
│     ├─ Hive AI API Key                                      │
│     └─ Sightengine API Key                                  │
│                                                             │
│  2. STORAGE PROVIDERS (for file storage)                    │
│     ├─ AWS S3 (optional)                                    │
│     └─ Cloudflare R2 (optional)                             │
│                                                             │
│  3. AUTH SECRET (for sessions)                              │
│     └─ Random string for JWT signing                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 How to Get API Keys

#### 1. **Hive AI** (Deepfake Detection)
   - Website: https://thehive.ai
   - Sign up → Dashboard → API Keys
   - Free tier: 1000 requests/month
   - **Best for**: Image & video AI detection

#### 2. **Sightengine** (Content Moderation)
   - Website: https://sightengine.com
   - Sign up → Dashboard → API Credentials
   - Free tier: 2000 requests/month
   - **Best for**: NSFW detection, face analysis

#### 3. **Auth Secret** (Generate your own)
```bash
# Generate a random secret
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Environment Variables Template

```env
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://user:pass@localhost:5432/trustlens

# ===========================================
# AUTHENTICATION
# ===========================================
AUTH_SECRET=your-generated-secret-here

# ===========================================
# DETECTION MODE
# ===========================================
# Options: "mock" (demo) or "production" (real APIs)
DETECTION_MODE=mock

# ===========================================
# HIVE AI (Optional - for production)
# ===========================================
HIVE_API_KEY=your_hive_api_key
HIVE_API_BASE_URL=https://api.thehive.ai/api/v2/task/sync
HIVE_TIMEOUT_MS=60000
HIVE_MAX_RETRIES=2

# ===========================================
# SIGHTENGINE (Optional - for production)
# ===========================================
SIGHTENGINE_API_USER=your_sightengine_user
SIGHTENGINE_API_SECRET=your_sightengine_secret
SIGHTENGINE_ENDPOINT=https://api.sightengine.com/1.0
SIGHTENGINE_TIMEOUT_MS=30000
SIGHTENGINE_MAX_RETRIES=1

# ===========================================
# USAGE LIMITS
# ===========================================
GUEST_ANALYSIS_LIMIT=5
USER_ANALYSIS_LIMIT=50

# ===========================================
# STORAGE (Optional)
# ===========================================
# STORAGE_PROVIDER=local
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
# AWS_S3_BUCKET=trustlens-uploads
```

---

## 📊 Database Schema Detail

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    password_hash TEXT,
    auth_provider VARCHAR(50) DEFAULT 'email',
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
```

### Assets Table (Uploaded Files)
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_id VARCHAR(100),
    original_filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'local',
    storage_status storage_status DEFAULT 'pending',
    metadata_status metadata_status DEFAULT 'pending',
    metadata_error TEXT,
    duration REAL,
    width INTEGER,
    height INTEGER,
    format VARCHAR(50),
    video_codec VARCHAR(50),
    audio_codec VARCHAR(50),
    frame_rate REAL,
    detected_mime_type VARCHAR(100),
    is_valid_file BOOLEAN,
    validation_error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_guest_id ON assets(guest_id);
CREATE INDEX idx_assets_storage_status ON assets(storage_status);
```

### Analysis Jobs Table
```sql
CREATE TABLE analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_id VARCHAR(100),
    status analysis_status DEFAULT 'queued' NOT NULL,
    job_type VARCHAR(50) DEFAULT 'full_analysis' NOT NULL,
    provider_status TEXT,
    error_code VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_analysis_jobs_user_id ON analysis_jobs(user_id);
CREATE INDEX idx_analysis_jobs_guest_id ON analysis_jobs(guest_id);
CREATE INDEX idx_analysis_jobs_asset_id ON analysis_jobs(asset_id);
CREATE INDEX idx_analysis_jobs_status ON analysis_jobs(status);
```

### Analysis Results Table
```sql
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_job_id UUID REFERENCES analysis_jobs(id) ON DELETE CASCADE NOT NULL UNIQUE,
    verdict verdict NOT NULL,
    ai_involvement_score REAL NOT NULL,
    manipulation_score REAL NOT NULL,
    confidence_score REAL NOT NULL,
    classification_level classification_level NOT NULL,
    provenance_status provenance_status NOT NULL,
    summary TEXT,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Analysis Signals Table
```sql
CREATE TABLE analysis_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_result_id UUID REFERENCES analysis_results(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(100) NOT NULL,
    signal_type VARCHAR(100) NOT NULL,
    score REAL,
    severity severity NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    timestamp_start REAL,
    timestamp_end REAL,
    source VARCHAR(100) DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analysis_signals_result_id ON analysis_signals(analysis_result_id);
```

---

## 🚀 Quick Start (Without Database)

If you just want to **demo the app without database**:

1. The app already works with **Mock Analysis API**
2. No database setup needed for testing
3. All uploads go to `/api/v1/mock-analysis`
4. Results are stored in-memory (temporary)

### To use Mock Mode:
```env
DETECTION_MODE=mock
# Don't set DATABASE_URL
```

---

## 📝 Migration Commands

```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Reset database (CAUTION: deletes all data!)
npm run db:reset

# Seed demo data
npm run db:seed

# View database
npm run db:studio
```

---

## 🌐 Cloud Database Options

### 1. **Neon** (Recommended - Free Tier)
- Website: https://neon.tech
- Free: 3GB storage, 10 branches
- Setup:
  1. Sign up at neon.tech
  2. Create project
  3. Copy connection string
  4. Add to `.env`

### 2. **Supabase** (Free Tier)
- Website: https://supabase.com
- Free: 500MB database, 1GB file storage
- Setup:
  1. Sign up at supabase.com
  2. Create project
  3. Go to Settings → Database
  4. Copy connection string

### 3. **Railway** (Free Tier)
- Website: https://railway.app
- Free: $5 credit monthly
- Setup:
  1. Sign up at railway.app
  2. New → PostgreSQL
  3. Copy connection string

### 4. **Vercel Postgres** (Free Tier)
- Website: https://vercel.com
- Free: 256MB storage
- Setup:
  1. Go to Vercel Dashboard
  2. Storage → Create Database
  3. Copy connection string

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** to Git
2. **Use strong passwords** for database
3. **Enable SSL** for production databases
4. **Rotate API keys** regularly
5. **Limit database user permissions**
6. **Use connection pooling** for production

---

## 📞 Support

If you need help:
1. Check the error logs
2. Verify `.env` configuration
3. Test database connection
4. Check API key validity

**Common Issues:**
- `DATABASE_URL is required` → Set DATABASE_URL in .env
- `Connection refused` → PostgreSQL not running
- `Authentication failed` → Wrong password
- `Database does not exist` → Create database first
