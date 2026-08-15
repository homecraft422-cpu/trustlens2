import { getDatabaseHealth } from "@/db";

export const dynamic = "force-dynamic";

/**
 * Health endpoint.
 *
 * Reports the real database state so a broken deployment can be diagnosed
 * without server-log access. Returns 503 when the database is unreachable,
 * or when production is running on the non-durable fallback store.
 */
export async function GET() {
  const database = await getDatabaseHealth();

  const authSecretConfigured = !!process.env.AUTH_SECRET;
  const ok = database.ok && (authSecretConfigured || process.env.NODE_ENV !== "production");

  return Response.json(
    {
      ok,
      database,
      auth: {
        secretConfigured: authSecretConfigured,
        ...(authSecretConfigured
          ? {}
          : {
              warning:
                "AUTH_SECRET is not set. Sessions and password hashes are tied to it, " +
                "so they break whenever the default changes.",
            }),
      },
      email: { provider: process.env.EMAIL_PROVIDER || "console" },
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
