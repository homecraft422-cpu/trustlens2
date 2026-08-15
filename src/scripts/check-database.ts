import "dotenv/config";
import { Pool } from "pg";

/**
 * Verifies that the app can actually reach its database and that the schema
 * has been migrated. Run with `npm run db:check`.
 *
 * This exists because the most common production failure for TrustLens is a
 * missing/incorrect DATABASE_URL: sign-in then fails in confusing ways instead
 * of reporting the real cause.
 */

const REQUIRED_TABLES = [
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

function fail(message: string): never {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    fail(
      "DATABASE_URL is not set.\n\n" +
        "   TrustLens needs PostgreSQL so accounts, sessions and magic-link\n" +
        "   tokens are shared across every server instance.\n\n" +
        "   Add it to .env, for example:\n" +
        "     DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/trustlens\n\n" +
        "   Hosted providers (Neon, Supabase, Vercel Postgres) normally require\n" +
        "   ?sslmode=require at the end of the URL."
    );
  }

  if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    fail(
      `DATABASE_URL must be a PostgreSQL connection string.\n` +
        `   Got: ${databaseUrl.split("://")[0]}://...\n\n` +
        "   SQLite/file URLs are not supported."
    );
  }

  const needsSsl =
    /[?&]sslmode=require/i.test(databaseUrl) ||
    (process.env.NODE_ENV === "production" && !/localhost|127\.0\.0\.1/.test(databaseUrl));

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10_000,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  const safeTarget = databaseUrl.replace(/\/\/([^:]+):[^@]*@/, "//$1:****@");
  console.log(`🔌 Connecting to ${safeTarget}`);

  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    await pool.end().catch(() => {});
    fail(
      `Could not connect to PostgreSQL.\n   ${detail}\n\n` +
        "   Check that the server is running, the credentials are correct,\n" +
        "   and that your IP is allowed by the provider's firewall."
    );
  }

  try {
    const version = await client.query("select version()");
    console.log(`✅ Connected: ${version.rows[0].version.split(",")[0]}`);

    const { rows } = await client.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public'"
    );
    const present = new Set(rows.map((row) => row.table_name));
    const missing = REQUIRED_TABLES.filter((table) => !present.has(table));

    if (missing.length > 0) {
      console.error(`\n⚠️  Missing tables: ${missing.join(", ")}`);
      fail("The schema is not migrated. Run:\n     npm run db:migrate");
    }

    console.log(`✅ Schema present (${REQUIRED_TABLES.length} tables)`);

    const users = await client.query<{ count: string }>("select count(*) from users");
    console.log(`✅ users table readable (${users.rows[0].count} accounts)`);

    if (!process.env.AUTH_SECRET) {
      console.warn(
        "\n⚠️  AUTH_SECRET is not set. A default development secret will be used.\n" +
          "   Set a stable random value in production (openssl rand -base64 32),\n" +
          "   otherwise sessions and stored password hashes become invalid."
      );
    } else {
      console.log("✅ AUTH_SECRET is set");
    }

    console.log("\n🎉 Database is ready.\n");
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("\n❌ Database check failed:", error);
  process.exit(1);
});
