/**
 * Database Connection
 * 
 * Supports PostgreSQL for production.
 * Uses mock database for development without PostgreSQL.
 */

// Check if we should use PostgreSQL
const databaseUrl = process.env.DATABASE_URL || '';

// Determine which database to use
const usePostgreSQL = databaseUrl && databaseUrl.startsWith('postgresql://');

let db: any;
let pool: any;

if (usePostgreSQL) {
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
} else {
  // Mock mode - works without any database
  console.log('📦 Using mock database (no database configured)');
  db = createMockDb();
}

/**
 * Create a mock database for when no real database is available
 */
function createMockDb() {
  return {
    select: () => createQueryBuilder('select'),
    insert: (table: any) => createInsertBuilder(table),
    update: (table: any) => createUpdateBuilder(table),
    delete: () => createQueryBuilder('delete'),
  };
}

function createQueryBuilder(operation: string) {
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

function createInsertBuilder(table: any) {
  return {
    values: (data: any) => ({
      returning: () => [data],
      then: (resolve: any) => resolve(data),
    }),
  };
}

function createUpdateBuilder(table: any) {
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
