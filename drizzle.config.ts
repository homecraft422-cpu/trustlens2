import "dotenv/config";
import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * The connection string is read from DATABASE_URL so that `npm run db:migrate`
 * targets whatever database the app itself is configured to use. Previously
 * this file hardcoded `postgresql://postgres:postgres@127.0.0.1:5432/app_db`,
 * which meant migrations silently ran against the wrong database (or failed)
 * and the real production database never got its tables.
 */
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set.\n\n" +
      "Set it before running database commands, e.g.\n" +
      "  DATABASE_URL='postgresql://user:password@host:5432/trustlens?sslmode=require' npm run db:migrate\n\n" +
      "or add it to a .env file in the project root."
  );
}

if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  throw new Error(
    `DATABASE_URL must be a PostgreSQL connection string (got "${databaseUrl.split(":")[0]}:...").\n` +
      "TrustLens uses PostgreSQL; SQLite/file URLs are not supported."
  );
}

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
} satisfies Config;
