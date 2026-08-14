/**
 * Database Connection & In-Memory Store
 * 
 * Supports PostgreSQL for production when DATABASE_URL is set.
 * Provides a file-backed local fallback (plus hot-reload-safe in-memory maps)
 * for development and preview environments without PostgreSQL.
 */

import { randomBytes, createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import path from "path";

const databaseUrl = process.env.DATABASE_URL || "";
const usePostgreSQL = databaseUrl && databaseUrl.startsWith("postgresql://");
const persistFallbackStore =
  !usePostgreSQL &&
  process.env.NODE_ENV !== "test" &&
  process.env.TRUSTLENS_PERSIST_FALLBACK !== "false";
const fallbackStorePath =
  process.env.TRUSTLENS_DATA_FILE || path.join(process.cwd(), ".data", "trustlens-store.json");

let db: any;
let pool: any;

// Helper to hash password for default demo user
function hashPassword(password: string): string {
  const secret = process.env.AUTH_SECRET || "dev-secret-change-in-production";
  return createHash("sha256").update(password + secret).digest("hex");
}

// In-memory data store structure
interface MemoryStore {
  users: Map<string, any>;
  sessions: Map<string, any>;
  verification_tokens: Map<string, any>;
  assets: Map<string, any>;
  analysis_jobs: Map<string, any>;
  analysis_results: Map<string, any>;
  analysis_signals: Map<string, any>;
  reports: Map<string, any>;
  usage_events: Map<string, any>;
  billing_events: Map<string, any>;
}

// Attach store to globalThis to preserve across Next.js hot reloads in dev
const globalForStore = globalThis as typeof globalThis & {
  __arenaTrustlensMemoryStore?: MemoryStore;
};

const STORE_KEYS: Array<keyof MemoryStore> = [
  "users",
  "sessions",
  "verification_tokens",
  "assets",
  "analysis_jobs",
  "analysis_results",
  "analysis_signals",
  "reports",
  "usage_events",
  "billing_events",
];

function createEmptyStore(): MemoryStore {
  return {
    users: new Map<string, any>(),
    sessions: new Map<string, any>(),
    verification_tokens: new Map<string, any>(),
    assets: new Map<string, any>(),
    analysis_jobs: new Map<string, any>(),
    analysis_results: new Map<string, any>(),
    analysis_signals: new Map<string, any>(),
    reports: new Map<string, any>(),
    usage_events: new Map<string, any>(),
    billing_events: new Map<string, any>(),
  };
}

function loadFallbackStore(): MemoryStore {
  const store = createEmptyStore();
  if (!persistFallbackStore || !existsSync(fallbackStorePath)) return store;

  try {
    const parsed = JSON.parse(readFileSync(fallbackStorePath, "utf8"));
    for (const key of STORE_KEYS) {
      const rows = Array.isArray(parsed?.[key]) ? parsed[key] : [];
      (store as unknown as Record<string, Map<string, any>>)[key] = new Map(rows);
    }
  } catch (error) {
    console.warn("⚠️ Could not read the fallback data store; starting with an empty store", error);
  }

  return store;
}

function saveFallbackStore(store: MemoryStore): void {
  if (!persistFallbackStore) return;

  try {
    const directory = path.dirname(fallbackStorePath);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const serialized = Object.fromEntries(
      STORE_KEYS.map((key) => [key, Array.from(store[key].entries())])
    );
    const temporaryPath = `${fallbackStorePath}.tmp`;
    writeFileSync(temporaryPath, JSON.stringify(serialized), { encoding: "utf8", mode: 0o600 });
    renameSync(temporaryPath, fallbackStorePath);
  } catch (error) {
    console.warn("⚠️ Could not persist the fallback data store", error);
  }
}

function ensureDemoUser(store: MemoryStore): void {
  const defaultUserId = "usr_demo_001";
  if (store.users.has(defaultUserId)) return;

  store.users.set(defaultUserId, {
    id: defaultUserId,
    email: "demo@trustlens.ai",
    emailVerifiedAt: new Date(),
    name: "Demo User",
    passwordHash: hashPassword("password123"),
    authProvider: "email",
    role: "user",
    plan: "free",
    billingCycle: null,
    planStartedAt: null,
    planRenewsAt: null,
    creditsBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function getMemoryStore(): MemoryStore {
  if (!globalForStore.__arenaTrustlensMemoryStore) {
    const store = loadFallbackStore();
    ensureDemoUser(store);
    globalForStore.__arenaTrustlensMemoryStore = store;
    saveFallbackStore(store);
  }
  return globalForStore.__arenaTrustlensMemoryStore;
}

function getTableName(table: any): string {
  if (typeof table === "string") return table;
  if (table && table[Symbol.for("drizzle:Name")]) {
    return table[Symbol.for("drizzle:Name")];
  }
  if (table && table._?.name) {
    return table._.name;
  }
  if (table && table.tableName) {
    return table.tableName;
  }
  return "unknown";
}

function evaluateCondition(row: any, cond: any): boolean {
  if (!cond) return true;

  const chunks = cond.queryChunks || [];

  // Handle and(...) compound conditions
  if (chunks.some((c: any) => c && c.queryChunks)) {
    const subConds = chunks.filter((c: any) => c && c.queryChunks);
    return subConds.every((sc: any) => evaluateCondition(row, sc));
  }

  let colName: string | null = null;
  let paramVal: any = undefined;
  let op = "eq";

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    if (c?.name) {
      colName = c.name;
    }
    if (c?.value !== undefined && c.constructor?.name === "Param") {
      paramVal = c.value;
    }
    if (c?.value && Array.isArray(c.value)) {
      const s = c.value.join("").toLowerCase();
      if (s.includes(" >= ")) op = "gte";
      else if (s.includes(" > ")) op = "gt";
      else if (s.includes(" <= ")) op = "lte";
      else if (s.includes(" < ")) op = "lt";
      else if (s.includes(" != ") || s.includes(" <> ")) op = "ne";
      else if (s.includes(" not in ")) op = "not_in";
      else if (s.includes(" = ")) op = "eq";
    }
  }

  if (colName) {
    // Check both snake_case and camelCase
    const camelCol = colName.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    const rowVal = row[camelCol] !== undefined ? row[camelCol] : row[colName];

    if (op === "eq") return rowVal === paramVal;
    if (op === "ne") return rowVal !== paramVal;
    if (op === "gt") {
      const d1 = new Date(rowVal).getTime();
      const d2 = new Date(paramVal).getTime();
      return !isNaN(d1) && !isNaN(d2) ? d1 > d2 : rowVal > paramVal;
    }
    if (op === "gte") {
      const d1 = new Date(rowVal).getTime();
      const d2 = new Date(paramVal).getTime();
      return !isNaN(d1) && !isNaN(d2) ? d1 >= d2 : rowVal >= paramVal;
    }
    if (op === "lt") {
      const d1 = new Date(rowVal).getTime();
      const d2 = new Date(paramVal).getTime();
      return !isNaN(d1) && !isNaN(d2) ? d1 < d2 : rowVal < paramVal;
    }
    if (op === "lte") {
      const d1 = new Date(rowVal).getTime();
      const d2 = new Date(paramVal).getTime();
      return !isNaN(d1) && !isNaN(d2) ? d1 <= d2 : rowVal <= paramVal;
    }
  }

  return true;
}

/**
 * In-memory Drizzle-compatible query runner
 */
function createMockDb() {
  const store = getMemoryStore();

  const getTableMap = (tableName: string): Map<string, any> => {
    switch (tableName) {
      case "users": return store.users;
      case "sessions": return store.sessions;
      case "verification_tokens": return store.verification_tokens;
      case "assets": return store.assets;
      case "analysis_jobs": return store.analysis_jobs;
      case "analysis_results": return store.analysis_results;
      case "analysis_signals": return store.analysis_signals;
      case "reports": return store.reports;
      case "usage_events": return store.usage_events;
      case "billing_events": return store.billing_events;
      default: {
        const key = tableName as keyof MemoryStore;
        if (!store[key]) {
          (store as any)[key] = new Map<string, any>();
        }
        return (store as any)[key];
      }
    }
  };

  return {
    select: (fields?: any) => ({
      from: (table: any) => {
        const tableName = getTableName(table);
        const tableMap = getTableMap(tableName);

        const executeQuery = (condition?: any, sortFn?: (a: any, b: any) => number, limitN?: number, offsetN?: number) => {
          let rows = Array.from(tableMap.values());

          if (condition) {
            rows = rows.filter((r) => evaluateCondition(r, condition));
          }

          if (sortFn) {
            rows.sort(sortFn);
          }

          if (offsetN && offsetN > 0) {
            rows = rows.slice(offsetN);
          }

          if (limitN !== undefined && limitN !== null) {
            rows = rows.slice(0, limitN);
          }

          // Handle projection if fields specified e.g. { count: sql`...` } or specific fields
          if (fields && typeof fields === "object") {
            if (fields.count) {
              return [{ count: rows.length }];
            }
            return rows.map((row) => {
              const projected: any = {};
              for (const key of Object.keys(fields)) {
                projected[key] = row[key];
              }
              return projected;
            });
          }

          return rows;
        };

        const createWhereClause = (condition: any) => ({
          orderBy: (...orderBys: any[]) => {
            const sortFn = (a: any, b: any) => {
              // Default to desc by createdAt
              const d1 = new Date(a.createdAt || 0).getTime();
              const d2 = new Date(b.createdAt || 0).getTime();
              return d2 - d1;
            };
            return {
              limit: (limitN: number) => ({
                offset: (offsetN: number) => {
                  const result = executeQuery(condition, sortFn, limitN, offsetN);
                  return Object.assign(Promise.resolve(result), {
                    all: () => result,
                    then: (onRes: any) => Promise.resolve(result).then(onRes),
                  });
                },
                then: (onRes: any) => {
                  const result = executeQuery(condition, sortFn, limitN);
                  return Promise.resolve(result).then(onRes);
                },
                all: () => executeQuery(condition, sortFn, limitN),
              }),
              then: (onRes: any) => {
                const result = executeQuery(condition, sortFn);
                return Promise.resolve(result).then(onRes);
              },
              all: () => executeQuery(condition, sortFn),
            };
          },
          limit: (limitN: number) => {
            const result = executeQuery(condition, undefined, limitN);
            return Object.assign(Promise.resolve(result), {
              then: (onRes: any) => Promise.resolve(result).then(onRes),
              all: () => result,
              get: () => result[0] || null,
            });
          },
          then: (onRes: any) => {
            const result = executeQuery(condition);
            return Promise.resolve(result).then(onRes);
          },
          all: () => executeQuery(condition),
          get: () => executeQuery(condition)[0] || null,
        });

        return {
          where: (condition: any) => createWhereClause(condition),
          orderBy: (...orderBys: any[]) => ({
            limit: (limitN: number) => ({
              offset: (offsetN: number) => {
                const result = executeQuery(undefined, (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(), limitN, offsetN);
                return Object.assign(Promise.resolve(result), {
                  all: () => result,
                  then: (onRes: any) => Promise.resolve(result).then(onRes),
                });
              },
              then: (onRes: any) => {
                const result = executeQuery(undefined, (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(), limitN);
                return Promise.resolve(result).then(onRes);
              },
              all: () => executeQuery(undefined, undefined, limitN),
            }),
            then: (onRes: any) => {
              const result = executeQuery();
              return Promise.resolve(result).then(onRes);
            },
            all: () => executeQuery(),
          }),
          limit: (limitN: number) => {
            const result = executeQuery(undefined, undefined, limitN);
            return Object.assign(Promise.resolve(result), {
              then: (onRes: any) => Promise.resolve(result).then(onRes),
              all: () => result,
              get: () => result[0] || null,
            });
          },
          then: (onRes: any) => {
            const result = executeQuery();
            return Promise.resolve(result).then(onRes);
          },
          all: () => executeQuery(),
        };
      },
    }),

    insert: (table: any) => ({
      values: (data: any) => {
        const tableName = getTableName(table);
        const tableMap = getTableMap(tableName);

        const items = Array.isArray(data) ? data : [data];
        const savedItems = items.map((item) => {
          const id = item.id || `rec_${Date.now()}_${randomBytes(4).toString("hex")}`;
          const record = {
            ...item,
            id,
            createdAt: item.createdAt || new Date(),
            updatedAt: item.updatedAt || new Date(),
          };
          tableMap.set(id, record);
          return record;
        });
        saveFallbackStore(store);

        return {
          returning: () => Promise.resolve(savedItems),
          then: (onRes: any) => Promise.resolve(Array.isArray(data) ? savedItems : savedItems[0]).then(onRes),
        };
      },
    }),

    update: (table: any) => ({
      set: (updateData: any) => ({
        where: (condition: any) => {
          const tableName = getTableName(table);
          const tableMap = getTableMap(tableName);
          const updated: any[] = [];

          for (const [id, row] of tableMap.entries()) {
            if (evaluateCondition(row, condition)) {
              const merged = { ...row, ...updateData, updatedAt: new Date() };
              tableMap.set(id, merged);
              updated.push(merged);
            }
          }
          if (updated.length > 0) saveFallbackStore(store);

          return {
            returning: () => Promise.resolve(updated),
            then: (onRes: any) => Promise.resolve(updated[0] || null).then(onRes),
          };
        },
      }),
    }),

    delete: (table: any) => ({
      where: (condition: any) => {
        const tableName = getTableName(table);
        const tableMap = getTableMap(tableName);

        let deleted = false;
        for (const [id, row] of Array.from(tableMap.entries())) {
          if (evaluateCondition(row, condition)) {
            tableMap.delete(id);
            deleted = true;
          }
        }
        if (deleted) saveFallbackStore(store);

        return {
          then: (onRes: any) => Promise.resolve(true).then(onRes),
        };
      },
    }),

    execute: (query: any) => Promise.resolve([{ "1": 1 }]),
  };
}

if (usePostgreSQL) {
  console.log("🐘 Using PostgreSQL database");
  try {
    const { Pool } = require("pg");
    const { drizzle } = require("drizzle-orm/node-postgres");

    const globalForDb = globalThis as typeof globalThis & {
      __arenaNextJsPostgresqlPool?: any;
    };

    pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }

    db = drizzle(pool);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error("PostgreSQL initialization failed in production", error);
      throw error;
    }
    console.warn("⚠️ PostgreSQL connection failed, using mock database", error);
    db = createMockDb();
  }
} else {
  const isProductionRuntime =
    process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";

  if (isProductionRuntime && process.env.ALLOW_FILE_DB_IN_PRODUCTION !== "true") {
    throw new Error(
      "DATABASE_URL is required in production. Set a PostgreSQL connection string (Neon/Supabase/Vercel Postgres) so accounts and magic links persist across serverless requests."
    );
  }
  console.log(
    persistFallbackStore
      ? "📦 Using persistent local fallback database (no PostgreSQL configured)"
      : "📦 Using ephemeral in-memory database (no PostgreSQL configured)"
  );
  if (isProductionRuntime) {
    console.warn(
      "⚠️ File-backed fallback is enabled in production. Accounts and magic links may not persist across serverless instances. Use PostgreSQL."
    );
  }
  db = createMockDb();
}

export { db, pool };
export default db;
