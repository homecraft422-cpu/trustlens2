/**
 * Database Connection & In-Memory Store
 * 
 * Supports PostgreSQL for production when DATABASE_URL is set.
 * Provides a file-backed local fallback (plus hot-reload-safe in-memory maps)
 * for development and preview environments without PostgreSQL.
 */

import { randomBytes, createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

const databaseUrl = (process.env.DATABASE_URL || "").trim();

/**
 * Accept every connection string shape that hosted PostgreSQL providers hand out.
 * Neon/Supabase/Railway/Vercel commonly return `postgres://`, while Drizzle docs
 * use `postgresql://`. Previously only `postgresql://` was recognised, so a valid
 * `postgres://` URL silently fell through to the file store (and then threw in
 * production, taking down every page including /dashboard).
 */
function isPostgresUrl(value: string): boolean {
  return /^postgres(ql)?:\/\//i.test(value);
}

const usePostgreSQL = isPostgresUrl(databaseUrl);
const persistFallbackStore =
  !usePostgreSQL &&
  process.env.NODE_ENV !== "test" &&
  process.env.TRUSTLENS_PERSIST_FALLBACK !== "false";

function resolveFallbackStorePath(): string {
  if (process.env.TRUSTLENS_DATA_FILE) return process.env.TRUSTLENS_DATA_FILE;
  // Serverless/production filesystems are read-only except for the temp dir.
  if (process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "trustlens-store.json");
  }
  return path.join(process.cwd(), ".data", "trustlens-store.json");
}

const fallbackStorePath = resolveFallbackStorePath();

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

// ─── Drizzle SQL condition evaluation (fallback store) ──────────────────────
//
// These helpers must identify chunk kinds *structurally*. The previous version
// tested `constructor.name === "Param"`, which works in dev but breaks in a
// minified production build where the class is renamed. Every `where(eq(...))`
// then matched no parameter at all and silently returned `true` for all rows —
// which is why login/session/magic-link lookups behaved randomly in production.

function isSqlNode(chunk: any): boolean {
  return !!chunk && Array.isArray(chunk.queryChunks);
}

/** A literal SQL fragment such as `" = "`, `" and "`, `"("`. */
function isStringChunk(chunk: any): boolean {
  return !!chunk && Array.isArray(chunk.value);
}

/** A bound parameter. Identified by its encoder, not its class name. */
function isParamChunk(chunk: any): boolean {
  return !!chunk && typeof chunk === "object" && "encoder" in chunk && !Array.isArray(chunk.value);
}

/** A column reference. Has a string `name` and belongs to a table. */
function isColumnChunk(chunk: any): boolean {
  return !!chunk && typeof chunk === "object" && typeof chunk.name === "string" && !!chunk.table;
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function readRowValue(row: any, columnName: string): any {
  const camel = toCamelCase(columnName);
  if (row?.[camel] !== undefined) return row[camel];
  return row?.[columnName];
}

function compareValues(op: string, rowVal: any, paramVal: any): boolean {
  if (op === "eq") return looseEquals(rowVal, paramVal);
  if (op === "ne") return !looseEquals(rowVal, paramVal);
  if (op === "is_null") return rowVal === null || rowVal === undefined;
  if (op === "is_not_null") return rowVal !== null && rowVal !== undefined;
  if (op === "in") return Array.isArray(paramVal) && paramVal.some((v) => looseEquals(rowVal, v));
  if (op === "not_in") return !(Array.isArray(paramVal) && paramVal.some((v) => looseEquals(rowVal, v)));

  const left = toComparable(rowVal);
  const right = toComparable(paramVal);
  if (left === null || right === null) return false;
  if (op === "gt") return left > right;
  if (op === "gte") return left >= right;
  if (op === "lt") return left < right;
  if (op === "lte") return left <= right;
  return true;
}

function looseEquals(a: any, b: any): boolean {
  if (a === b) return true;
  if (a instanceof Date || b instanceof Date) {
    const t1 = new Date(a as any).getTime();
    const t2 = new Date(b as any).getTime();
    if (!Number.isNaN(t1) && !Number.isNaN(t2)) return t1 === t2;
  }
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}

function toComparable(value: any): number | string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const time = new Date(value).getTime();
    if (!Number.isNaN(time)) return time;
    return value;
  }
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function operatorFromText(text: string): string | null {
  const s = text.toLowerCase();
  if (s.includes(" is not null")) return "is_not_null";
  if (s.includes(" is null")) return "is_null";
  if (s.includes(" not in ")) return "not_in";
  if (s.includes(" in ")) return "in";
  if (s.includes(">=")) return "gte";
  if (s.includes("<=")) return "lte";
  if (s.includes("<>") || s.includes("!=")) return "ne";
  if (s.includes(">")) return "gt";
  if (s.includes("<")) return "lt";
  if (s.includes("=")) return "eq";
  return null;
}

/** Evaluate a single comparison node: `<column> <op> <param>`. */
function evaluateComparison(row: any, chunks: any[]): boolean {
  let columnName: string | null = null;
  let op: string | null = null;
  let paramValue: any;
  let hasParam = false;

  for (const chunk of chunks) {
    if (isColumnChunk(chunk)) {
      columnName = chunk.name;
    } else if (isParamChunk(chunk)) {
      paramValue = chunk.value;
      hasParam = true;
    } else if (isStringChunk(chunk)) {
      const detected = operatorFromText(chunk.value.join(" "));
      if (detected) op = detected;
    }
  }

  if (!columnName || !op) return true;
  if (!hasParam && op !== "is_null" && op !== "is_not_null") return true;

  return compareValues(op, readRowValue(row, columnName), paramValue);
}

function evaluateCondition(row: any, cond: any): boolean {
  if (!cond) return true;
  if (!isSqlNode(cond)) return true;

  const chunks: any[] = cond.queryChunks;

  // A node that directly references a column is a comparison.
  if (chunks.some(isColumnChunk)) {
    return evaluateComparison(row, chunks);
  }

  // Otherwise it is a group: combine child SQL nodes using the and/or/not
  // keywords that appear between them.
  let result: boolean | null = null;
  let pendingOperator: "and" | "or" = "and";
  let negateNext = false;

  for (const chunk of chunks) {
    if (isStringChunk(chunk)) {
      const text = chunk.value.join(" ").toLowerCase();
      if (/\bor\b/.test(text)) pendingOperator = "or";
      else if (/\band\b/.test(text)) pendingOperator = "and";
      if (/\bnot\b/.test(text)) negateNext = true;
      continue;
    }

    if (!isSqlNode(chunk)) continue;

    let value = evaluateCondition(row, chunk);
    if (negateNext) {
      value = !value;
      negateNext = false;
    }

    if (result === null) result = value;
    else if (pendingOperator === "or") result = result || value;
    else result = result && value;
  }

  return result === null ? true : result;
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

// ─── Resilient database wrapper ─────────────────────────────────────────────
//
// The most common reason both sign-in methods break in production is a
// PostgreSQL `DATABASE_URL` that points at an unreachable or misconfigured
// server (e.g. the localhost placeholder from .env.example, or a paused Neon
// branch). A query then throws a connection error and the login route turns it
// into a 500 ("Sign-in is temporarily unavailable"). That is a frustrating dead
// end when the real problem is simply that the shared database is down.
//
// This wrapper lets every `db.` call degrade gracefully: it runs the query
// against PostgreSQL first and, only when the failure is a *connection* problem
// (unreachable host, auth failure, too many connections, pool terminated), it
// transparently re-runs the same query against the local file/memory store so
// sign-in and the rest of the app keep working. Non-connection SQL errors are
// still surfaced normally. /api/health keeps reporting the truth about the
// database independently of this wrapper.

function isDatabaseConnectionError(error: unknown): boolean {
  const err = error as { message?: unknown; code?: unknown } | null;
  const cause = (error as any)?.cause as { message?: unknown; code?: unknown } | null;
  const message = String(err?.message ?? "") + " " + String(cause?.message ?? "");
  const code = String(cause?.code ?? err?.code ?? "");
  return (
    /ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|EHOSTUNREACH/i.test(
      message + " " + code
    ) ||
    /connection terminated/i.test(message) ||
    /password authentication failed/i.test(message) ||
    /too many connections/i.test(message) ||
    /connection refused/i.test(message) ||
    /the database is closed/i.test(message)
  );
}

function createResilientDb(primary: any, fallback: any): any {
  // Replays a recorded chain (e.g. select/from/where/limit) against a target db.
  const runChain = (target: any, records: Array<{ m: string; a: any[] }>) => {
    let current = target;
    for (const record of records) current = current[record.m](...record.a);
    return current;
  };

  // Records every chain call, then executes lazily (when awaited) with a
  // connection-error fallback to the local store.
  const makeChainable = (records: Array<{ m: string; a: any[] }>) => {
    const exec = async () => {
      try {
        return await runChain(primary, records);
      } catch (error) {
        if (isDatabaseConnectionError(error)) {
          console.warn(
            "⚠️ Shared database unreachable — fell back to the local store for this query. Fix DATABASE_URL to persist across instances.",
            (error as any)?.cause?.message || (error as Error)?.message
          );
          return await runChain(fallback, records);
        }
        throw error;
      }
    };

    return new Proxy(function () {}, {
      get(_target, prop: string) {
        if (prop === "then") {
          return (onFulfilled: any, onRejected: any) => exec().then(onFulfilled, onRejected);
        }
        if (prop === "all") {
          return () => exec().then((r: any) => (r && typeof r.all === "function" ? r.all() : r));
        }
        if (prop === "get") {
          return () => exec().then((r: any) => (r && typeof r.get === "function" ? r.get() : r[0] ?? null));
        }
        // Record the method call (from/where/limit/offset/orderBy/values/set/returning…).
        return (...args: any[]) => makeChainable([...records, { m: prop, a: args }]);
      },
      apply() {
        // e.g. `db.execute(sql)` — execute immediately with fallback.
        return exec();
      },
    });
  };

  return {
    select: (fields?: any) => makeChainable([{ m: "select", a: fields ? [fields] : [] }]),
    insert: (table: any) => makeChainable([{ m: "insert", a: [table] }]),
    update: (table: any) => makeChainable([{ m: "update", a: [table] }]),
    delete: (table: any) => makeChainable([{ m: "delete", a: [table] }]),
    execute: (query: any) =>
      (async () => {
        try {
          return await primary.execute(query);
        } catch (error) {
          if (isDatabaseConnectionError(error)) {
            return await fallback.execute(query);
          }
          throw error;
        }
      })(),
    get __resilient() {
      return true;
    },
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

    const needsSsl =
      /[?&]sslmode=require/i.test(databaseUrl) ||
      (process.env.NODE_ENV === "production" && !/localhost|127\.0\.0\.1/.test(databaseUrl));

    pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
        max: Number(process.env.PGPOOL_MAX || 5),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      });

    // An idle-client error must never take the whole Node process (and every
    // page render) down. Log it and let the pool recycle the connection.
    pool.on("error", (poolError: unknown) => {
      console.error("PostgreSQL pool error (recovered):", poolError);
    });

    // Reuse the pool across hot reloads AND across serverless invocations that
    // share a warm container, so we don't exhaust the database's connection
    // limit by creating a new pool per request.
    globalForDb.__arenaNextJsPostgresqlPool = pool;

    db = createResilientDb(drizzle(pool), createMockDb());
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

  if (isProductionRuntime) {
    // Deliberately do NOT throw here: every page and API route imports `@/db`,
    // so throwing at module scope turns a config mistake into a hard 500 on
    // /dashboard, /login and /signup. Degrade loudly instead, and let
    // `getDatabaseHealth()` surface the problem through /api/health.
    console.error(
      "❌ DATABASE_URL is not set in production. Falling back to a temporary file store.\n" +
        "   Accounts, sessions, and magic links will NOT persist across instances.\n" +
        "   Set a PostgreSQL connection string (Neon/Supabase/Vercel Postgres),\n" +
        "   then run `npm run db:migrate`. Verify with `npm run db:check`."
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

/**
 * True only when rows are stored in a real shared database. When false the app
 * is running on the per-instance file/memory fallback, so the auth layer must
 * not rely on a previously written row still being visible on this instance.
 */
export const isDurableDatabase = !!usePostgreSQL;

export interface DatabaseHealth {
  ok: boolean;
  driver: "postgresql" | "fallback";
  durable: boolean;
  latencyMs?: number;
  error?: string;
  warning?: string;
}

/**
 * Runtime database health, used by /api/health so a misconfigured deployment
 * is diagnosable without reading server logs.
 */
export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  if (!usePostgreSQL) {
    return {
      ok: process.env.NODE_ENV !== "production",
      driver: "fallback",
      durable: false,
      warning:
        "DATABASE_URL is not configured. Using a per-instance fallback store; " +
        "accounts and analyses will not persist reliably.",
    };
  }

  const startedAt = Date.now();
  try {
    await pool.query("select 1");
    return {
      ok: true,
      driver: "postgresql",
      durable: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      driver: "postgresql",
      durable: true,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export { db, pool };
export default db;
