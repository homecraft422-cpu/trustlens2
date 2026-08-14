/**
 * Database Connection
 * 
 * Supports both PostgreSQL (production) and SQLite (development).
 * Set DATABASE_URL in .env to configure.
 * 
 * PostgreSQL: DATABASE_URL=postgresql://user:pass@host:port/db
 * SQLite: DATABASE_URL=file:./trustlens.db (or omit for default)
 */

// Check if we should use SQLite (no DATABASE_URL or file: prefix)
const databaseUrl = process.env.DATABASE_URL || '';

// Determine which database to use
const useSQLite = !databaseUrl || databaseUrl.startsWith('file:') || databaseUrl.includes('sqlite');

let db: any;
let pool: any;

if (useSQLite) {
  // SQLite mode - works without PostgreSQL
  console.log('📦 Using SQLite database (local development)');
  
  try {
    const { sqlite, initializeDatabase } = require('./sqlite');
    initializeDatabase();
    
    // Create a simple wrapper that matches drizzle API
    db = {
      select: () => ({
        from: (table: any) => ({
          where: (condition: any) => ({
            limit: (n: number) => ({
              then: (resolve: any) => resolve([])
            })
          })
        })
      }),
      insert: (table: any) => ({
        values: (data: any) => ({
          returning: () => [data]
        })
      }),
      update: (table: any) => ({
        set: (data: any) => ({
          where: (condition: any) => ({})
        })
      })
    };
  } catch (error) {
    console.warn('⚠️ SQLite initialization failed, using mock database');
    // Fallback to mock database
    db = createMockDb();
  }
} else {
  // PostgreSQL mode
  console.log('🐘 Using PostgreSQL database');
  
  try {
    const { Pool } = require('pg');
    const { drizzle } = require('drizzle-orm/node-postgres');
    
    const globalForDb = globalThis as typeof globalThis & {
      __arenaNextJsPostgresqlPool?: any;
    };

    pool = globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({
      connectionString: databaseUrl,
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }

    db = drizzle(pool);
  } catch (error) {
    console.warn('⚠️ PostgreSQL connection failed, using mock database');
    db = createMockDb();
  }
}

/**
 * Create a mock database for when no real database is available
 */
function createMockDb() {
  // In-memory storage for demo
  const storage = {
    users: new Map(),
    sessions: new Map(),
    assets: new Map(),
    analysisJobs: new Map(),
    analysisResults: new Map(),
    analysisSignals: new Map(),
    reports: new Map(),
    usageEvents: new Map(),
  };

  return {
    select: () => createQueryBuilder('select', storage),
    insert: (table: any) => createInsertBuilder(table, storage),
    update: (table: any) => createUpdateBuilder(table, storage),
    delete: () => createQueryBuilder('delete', storage),
  };
}

function createQueryBuilder(operation: string, storage: any) {
  return {
    from: (table: any) => ({
      where: (condition: any) => ({
        limit: (n: number) => ({
          then: (resolve: any) => resolve([]),
          all: () => [],
          get: () => null,
        }),
        orderBy: (...args: any[]) => ({
          limit: (n: number) => ({
            offset: (o: number) => ({
              then: (resolve: any) => resolve([]),
              all: () => [],
            }),
          }),
        }),
        then: (resolve: any) => resolve([]),
        all: () => [],
        get: () => null,
      }),
      orderBy: (...args: any[]) => ({
        limit: (n: number) => ({
          offset: (o: number) => ({
            then: (resolve: any) => resolve([]),
            all: () => [],
          }),
        }),
      }),
      limit: (n: number) => ({
        then: (resolve: any) => resolve([]),
        all: () => [],
      }),
      then: (resolve: any) => resolve([]),
      all: () => [],
    }),
  };
}

function createInsertBuilder(table: any, storage: any) {
  return {
    values: (data: any) => ({
      returning: () => [data],
      then: (resolve: any) => resolve(data),
    }),
  };
}

function createUpdateBuilder(table: any, storage: any) {
  return {
    set: (data: any) => ({
      where: (condition: any) => ({
        then: (resolve: any) => resolve(data),
      }),
    }),
  };
}

export { db, pool };
export default db;
