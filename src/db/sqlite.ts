/**
 * SQLite Database Connection
 * 
 * This provides a local SQLite database for development
 * without needing PostgreSQL installed.
 */

import Database from 'better-sqlite3';
import path from 'path';

// Database file path
const DB_PATH = path.join(process.cwd(), 'trustlens.db');

// Create SQLite connection
const sqlite = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export { sqlite };

/**
 * Initialize database tables
 */
export function initializeDatabase() {
  // Create enums as TEXT (SQLite doesn't support enums)
  
  // Users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email VARCHAR(255) UNIQUE,
      name VARCHAR(255),
      password_hash TEXT,
      auth_provider VARCHAR(50) DEFAULT 'email',
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sessions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Assets table (uploaded files)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT,
      guest_id VARCHAR(100),
      original_filename VARCHAR(500) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      file_size INTEGER NOT NULL,
      storage_key VARCHAR(500) NOT NULL,
      storage_provider VARCHAR(50) DEFAULT 'local',
      storage_status VARCHAR(50) DEFAULT 'pending',
      metadata_status VARCHAR(50) DEFAULT 'pending',
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Analysis Jobs table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS analysis_jobs (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      asset_id TEXT NOT NULL,
      user_id TEXT,
      guest_id VARCHAR(100),
      status VARCHAR(50) DEFAULT 'queued',
      job_type VARCHAR(50) DEFAULT 'full_analysis',
      provider_status TEXT,
      error_code VARCHAR(100),
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Analysis Results table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS analysis_results (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      analysis_job_id TEXT NOT NULL UNIQUE,
      verdict VARCHAR(50) NOT NULL,
      ai_involvement_score REAL NOT NULL,
      manipulation_score REAL NOT NULL,
      confidence_score REAL NOT NULL,
      classification_level VARCHAR(50) NOT NULL,
      provenance_status VARCHAR(50) NOT NULL,
      summary TEXT,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (analysis_job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE
    )
  `);

  // Analysis Signals table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS analysis_signals (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      analysis_result_id TEXT NOT NULL,
      category VARCHAR(100) NOT NULL,
      signal_type VARCHAR(100) NOT NULL,
      score REAL,
      severity VARCHAR(50) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      timestamp_start REAL,
      timestamp_end REAL,
      source VARCHAR(100) DEFAULT 'unknown',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (analysis_result_id) REFERENCES analysis_results(id) ON DELETE CASCADE
    )
  `);

  // Reports table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      analysis_result_id TEXT NOT NULL UNIQUE,
      public_id VARCHAR(100) UNIQUE NOT NULL,
      is_public BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP,
      FOREIGN KEY (analysis_result_id) REFERENCES analysis_results(id) ON DELETE CASCADE
    )
  `);

  // Usage Events table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS usage_events (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT,
      guest_id VARCHAR(100),
      event_type VARCHAR(100) NOT NULL,
      analysis_job_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (analysis_job_id) REFERENCES analysis_jobs(id) ON DELETE SET NULL
    )
  `);

  // Create indexes
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
    CREATE INDEX IF NOT EXISTS idx_assets_guest_id ON assets(guest_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user_id ON analysis_jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_jobs_asset_id ON analysis_jobs(asset_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_analysis_results_job_id ON analysis_results(analysis_job_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_signals_result_id ON analysis_signals(analysis_result_id);
    CREATE INDEX IF NOT EXISTS idx_reports_public_id ON reports(public_id);
    CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_events_guest_id ON usage_events(guest_id);
  `);

  console.log('✅ Database tables initialized successfully');
}

/**
 * Insert a user
 */
export function insertUser(email: string, name: string, passwordHash: string) {
  const stmt = sqlite.prepare(`
    INSERT INTO users (email, name, password_hash)
    VALUES (?, ?, ?)
  `);
  return stmt.run(email, name, passwordHash);
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string) {
  const stmt = sqlite.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

/**
 * Insert an asset
 */
export function insertAsset(data: {
  userId?: string;
  guestId?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
}) {
  const stmt = sqlite.prepare(`
    INSERT INTO assets (user_id, guest_id, original_filename, mime_type, file_size, storage_key, storage_status)
    VALUES (?, ?, ?, ?, ?, ?, 'uploaded')
  `);
  return stmt.run(data.userId, data.guestId, data.filename, data.mimeType, data.fileSize, data.storageKey);
}

/**
 * Insert an analysis job
 */
export function insertAnalysisJob(assetId: string, userId?: string, guestId?: string) {
  const stmt = sqlite.prepare(`
    INSERT INTO analysis_jobs (asset_id, user_id, guest_id, status)
    VALUES (?, ?, ?, 'queued')
  `);
  return stmt.run(assetId, userId, guestId);
}

/**
 * Update job status
 */
export function updateJobStatus(jobId: string, status: string) {
  const stmt = sqlite.prepare(`
    UPDATE analysis_jobs SET status = ?, 
    CASE 
      WHEN ? = 'processing' THEN started_at = CURRENT_TIMESTAMP
      WHEN ? IN ('completed', 'failed') THEN completed_at = CURRENT_TIMESTAMP
    END
    WHERE id = ?
  `);
  return stmt.run(status, status, status, jobId);
}

/**
 * Insert analysis result
 */
export function insertAnalysisResult(data: {
  jobId: string;
  verdict: string;
  aiScore: number;
  manipScore: number;
  confidence: number;
  classification: string;
  provenance: string;
  summary: string;
}) {
  const stmt = sqlite.prepare(`
    INSERT INTO analysis_results (analysis_job_id, verdict, ai_involvement_score, manipulation_score, confidence_score, classification_level, provenance_status, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(data.jobId, data.verdict, data.aiScore, data.manipScore, data.confidence, data.classification, data.provenance, data.summary);
}

/**
 * Insert analysis signal
 */
export function insertAnalysisSignal(data: {
  resultId: string;
  category: string;
  signalType: string;
  score: number | null;
  severity: string;
  title: string;
  description: string;
  source?: string;
}) {
  const stmt = sqlite.prepare(`
    INSERT INTO analysis_signals (analysis_result_id, category, signal_type, score, severity, title, description, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(data.resultId, data.category, data.signalType, data.score, data.severity, data.title, data.description, data.source || 'unknown');
}

/**
 * Get analysis result by job ID
 */
export function getAnalysisResultByJobId(jobId: string) {
  const stmt = sqlite.prepare(`
    SELECT * FROM analysis_results WHERE analysis_job_id = ?
  `);
  return stmt.get(jobId);
}

/**
 * Get signals by result ID
 */
export function getSignalsByResultId(resultId: string) {
  const stmt = sqlite.prepare(`
    SELECT * FROM analysis_signals WHERE analysis_result_id = ?
  `);
  return stmt.all(resultId);
}

/**
 * Get job by ID
 */
export function getJobById(jobId: string) {
  const stmt = sqlite.prepare('SELECT * FROM analysis_jobs WHERE id = ?');
  return stmt.get(jobId);
}

/**
 * Get asset by ID
 */
export function getAssetById(assetId: string) {
  const stmt = sqlite.prepare('SELECT * FROM assets WHERE id = ?');
  return stmt.get(assetId);
}

/**
 * Insert usage event
 */
export function insertUsageEvent(userId: string | null, guestId: string | null, eventType: string, jobId?: string) {
  const stmt = sqlite.prepare(`
    INSERT INTO usage_events (user_id, guest_id, event_type, analysis_job_id)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(userId, guestId, eventType, jobId);
}

/**
 * Get usage count
 */
export function getUsageCount(userId?: string, guestId?: string) {
  let stmt;
  if (userId) {
    stmt = sqlite.prepare(`
      SELECT COUNT(DISTINCT analysis_job_id) as count 
      FROM usage_events 
      WHERE user_id = ? AND event_type = 'analysis_created'
    `);
    return (stmt.get(userId) as any)?.count || 0;
  } else if (guestId) {
    stmt = sqlite.prepare(`
      SELECT COUNT(DISTINCT analysis_job_id) as count 
      FROM usage_events 
      WHERE guest_id = ? AND event_type = 'analysis_created'
    `);
    return (stmt.get(guestId) as any)?.count || 0;
  }
  return 0;
}

export default sqlite;
