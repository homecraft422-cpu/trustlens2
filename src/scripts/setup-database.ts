#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script initializes the SQLite database with all required tables.
 * Run this once before starting the application.
 * 
 * Usage:
 *   npx tsx src/scripts/setup-database.ts
 */

import { initializeDatabase, sqlite } from '../db/sqlite';

console.log('🚀 TrustLens Database Setup');
console.log('==========================\n');

try {
  // Initialize database
  console.log('📦 Creating database tables...');
  initializeDatabase();
  
  // Insert demo data
  console.log('\n📝 Inserting demo data...');
  
  // Demo user
  const demoUser = sqlite.prepare(`
    INSERT OR IGNORE INTO users (email, name, password_hash, role)
    VALUES (?, ?, ?, ?)
  `).run('demo@trustlens.com', 'Demo User', 'demo_hash_123', 'user');
  
  console.log('✅ Demo user created: demo@trustlens.com');
  
  // Summary
  console.log('\n✨ Database setup complete!');
  console.log('\nDatabase file: trustlens.db');
  console.log('\nYou can now start the application with:');
  console.log('  npm run dev');
  
} catch (error) {
  console.error('❌ Error setting up database:', error);
  process.exit(1);
} finally {
  sqlite.close();
}
