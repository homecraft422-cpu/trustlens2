import { db, isDurableDatabase } from "@/db";
import { users, sessions, verificationTokens } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { randomBytes, createHash, createHmac, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { config } from "./config";

// ─── Password hashing (v2: scrypt with per-user salt) ─────────────────────
// v1 used SHA-256(password + app secret) — fine as a quick prototype, but
// scrypt is the standard memory-hard KDF and resists GPU/ASIC brute force.
// New hashes are stored as:  scrypt$N$r$p$saltB64$hashB64
// Old v1 hashes (64 hex chars) are still verified for existing accounts, and
// are transparently upgraded to v2 on the next successful sign-in.
const SCRYPT_N = 16384; // CPU/memory cost (2^14)
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  if (storedHash.startsWith("scrypt$")) {
    const parts = storedHash.split("$");
    if (parts.length !== 6) return false;
    const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
    const n = parseInt(nStr, 10);
    const r = parseInt(rStr, 10);
    const p = parseInt(pStr, 10);
    try {
      const derived = scryptSync(password, Buffer.from(saltB64, "base64"), SCRYPT_KEYLEN, {
        N: n,
        r,
        p,
      });
      const stored = Buffer.from(hashB64, "base64");
      return (
        stored.length === derived.length && timingSafeEqual(stored, derived)
      );
    } catch {
      return false;
    }
  }

  // Legacy v1: SHA-256(password + app secret) — constant-time compare.
  if (/^[0-9a-f]{64}$/i.test(storedHash)) {
    const supplied = createHash("sha256").update(password + config.auth.secret).digest();
    const stored = Buffer.from(storedHash, "hex");
    return (
      supplied.length === stored.length && timingSafeEqual(supplied, stored)
    );
  }

  return false;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ─── Stateless signed tokens ────────────────────────────────────────────────
// Without a shared PostgreSQL database, rows written by one serverless
// instance are invisible to the next one. That is what made both sign-in
// methods fail intermittently: the password login wrote a `sessions` row that
// the following request could not find, and a magic link's `verification_token`
// row lived on a different instance than the one handling the click.
//
// When the database is not durable we therefore make the token itself carry
// its (signed) payload, so any instance can verify it with AUTH_SECRET alone.
// With PostgreSQL configured, the normal database-backed path is used.

const TOKEN_PREFIX = "v1";

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", config.auth.secret).update(encodedPayload).digest("base64url");
}

function createSignedToken(payload: Record<string, unknown>): string {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${TOKEN_PREFIX}.${encodedPayload}.${signPayload(encodedPayload)}`;
}

function readSignedToken<T = Record<string, any>>(token: string): T | null {
  if (!token || !token.startsWith(`${TOKEN_PREFIX}.`)) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [, encodedPayload, signature] = parts;
  const expected = signPayload(encodedPayload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (typeof payload?.exp === "number" && payload.exp < Date.now()) return null;
    return payload as T;
  } catch {
    return null;
  }
}

/**
 * Email addresses are treated case-insensitively. Keeping this normalization in
 * the server-side auth layer is important because API clients can bypass the
 * signup/login pages (and PostgreSQL string equality is case-sensitive).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  return user || null;
}

export async function createUser(email: string, password: string, name: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error("User already exists");
  }
  const [user] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: hashPassword(password),
      authProvider: "email",
      role: "user",
      plan: "free",
      creditsBalance: 0,
    })
    .returning();
  return user;
}

/**
 * Create a minimal user from a verified magic-link email.
 * If a user already exists for this email, return that user.
 */
export async function getOrCreateUserByEmail(email: string, name?: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) return existing;

  const derivedName = (name?.trim() || normalizedEmail.split("@")[0] || "User").slice(0, 80);
  const [user] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: derivedName,
      passwordHash: null,
      authProvider: "magic_link",
      emailVerifiedAt: new Date(),
      role: "user",
      plan: "free",
      creditsBalance: 0,
    })
    .returning();
  return user;
}

export async function markEmailVerified(userId: string) {
  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await getUserByEmail(normalizedEmail);

  // Constant-time-ish verification even for unknown accounts (dummy scrypt)
  // so the response does not reveal whether an email is registered.
  const storedHash = user?.passwordHash || hashPassword("dummy-password-for-timing");
  const valid = storedHash ? verifyPassword(password, storedHash) : false;

  if (!user || !user.passwordHash || !valid) return null;

  // Transparently upgrade legacy SHA-256 hashes to scrypt v2 on sign-in.
  if (!user.passwordHash.startsWith("scrypt$")) {
    try {
      await db
        .update(users)
        .set({ passwordHash: hashPassword(password), updatedAt: new Date() })
        .where(eq(users.id, user.id));
    } catch (error) {
      console.warn("[auth] password hash upgrade failed:", error);
    }
  }

  return user;
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + config.auth.sessionDuration);

  // The email is embedded so a fallback-store instance that has never seen this
  // account can still restore it instead of bouncing the user back to /login.
  const user = await findUserById(userId).catch(() => null);

  const token = isDurableDatabase
    ? randomBytes(32).toString("hex")
    : createSignedToken({
        sub: userId,
        email: user?.email,
        name: user?.name,
        exp: expiresAt.getTime(),
        kind: "session",
      });

  // Always try to persist the session row too. On PostgreSQL this is the source
  // of truth (and enables real logout/revocation); on the fallback store it is
  // a best-effort cache in front of the self-describing signed token.
  try {
    await db.insert(sessions).values({ userId, token, expiresAt });
  } catch (error) {
    if (isDurableDatabase) throw error;
    console.warn("Could not persist session row to the fallback store", error);
  }

  return { token, expiresAt };
}

async function findUserById(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user || null;
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) return null;
    return await getSessionUserFromToken(token);
  } catch {
    return null;
  }
}

export async function getSessionUserFromToken(token: string) {
  if (!token) return null;

  // 1. Database-backed session (source of truth when PostgreSQL is configured).
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (session) {
      const user = await findUserById(session.userId);
      if (user) return user;
    }
  } catch (error) {
    console.warn("Session lookup against the database failed", error);
  }

  // 2. Signed stateless session — lets sign-in survive an instance that never
  //    saw the original session row (the fallback-store split-brain problem).
  const payload = readSignedToken<{
    sub?: string;
    email?: string;
    name?: string;
    kind?: string;
  }>(token);

  if (payload?.kind === "session" && payload.sub) {
    try {
      const byId = await findUserById(payload.sub);
      if (byId) return byId;

      if (payload.email) {
        const byEmail = await getUserByEmail(payload.email);
        if (byEmail) return byEmail;

        // This instance has never seen the account (fallback store only).
        // Rehydrate it from the signed cookie so the user stays signed in.
        if (!isDurableDatabase) {
          return await getOrCreateUserByEmail(payload.email, payload.name);
        }
      }
    } catch (error) {
      console.warn("Signed-session user lookup failed", error);
    }
  }

  return null;
}

export async function destroySession(token: string) {
  try {
    await db.delete(sessions).where(eq(sessions.token, token));
  } catch (error) {
    console.warn("Could not delete the session row", error);
  }
}

export function getGuestId(): string {
  return `guest_${randomBytes(16).toString("hex")}`;
}

// ─── Magic-link / email verification tokens ─────────────────────────────────

export async function createMagicLinkToken(params: {
  email: string;
  purpose?: "magic_link" | "email_verification";
  redirectPath?: string;
}) {
  const normalizedEmail = normalizeEmail(params.email);
  const purpose = params.purpose || "magic_link";
  const redirectPath = params.redirectPath || "/dashboard";
  const expiresAt = new Date(Date.now() + config.auth.magicLinkDuration);

  // With PostgreSQL the token is an opaque random string checked against a row.
  // Without it, the link must verify on any instance, so we sign the payload.
  const rawToken = isDurableDatabase
    ? randomBytes(32).toString("hex")
    : createSignedToken({
        email: normalizedEmail,
        purpose,
        redirectPath,
        exp: expiresAt.getTime(),
        jti: randomBytes(12).toString("hex"),
        kind: "magic_link",
      });

  const tokenHash = hashToken(rawToken);

  try {
    // Invalidate any prior unconsumed tokens for this email so only the newest link works.
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.email, normalizedEmail),
          eq(verificationTokens.purpose, purpose)
        )
      );

    await db.insert(verificationTokens).values({
      email: normalizedEmail,
      tokenHash,
      purpose,
      redirectPath,
      expiresAt,
    });
  } catch (error) {
    if (isDurableDatabase) throw error;
    console.warn("Could not persist the magic-link token to the fallback store", error);
  }

  return { rawToken, tokenHash, expiresAt };
}

export async function consumeMagicLinkToken(rawToken: string) {
  if (!rawToken || rawToken.length < 32) return null;
  const tokenHash = hashToken(rawToken);

  // 1. Database-backed token (single-use, revocable).
  try {
    const [record] = await db
      .select()
      .from(verificationTokens)
      .where(and(eq(verificationTokens.tokenHash, tokenHash)))
      .limit(1);

    if (record) {
      if (record.consumedAt) return null;
      if (new Date(record.expiresAt).getTime() < Date.now()) return null;

      await db
        .update(verificationTokens)
        .set({ consumedAt: new Date() })
        .where(eq(verificationTokens.id, record.id));

      return record;
    }
  } catch (error) {
    console.warn("Magic-link lookup against the database failed", error);
  }

  // 2. Signed stateless token — verifies on any instance using AUTH_SECRET.
  //    (Expiry is enforced inside readSignedToken.)
  const payload = readSignedToken<{
    email?: string;
    purpose?: string;
    redirectPath?: string;
    exp?: number;
    kind?: string;
  }>(rawToken);

  if (payload?.kind === "magic_link" && payload.email) {
    // Best-effort single-use marker so a re-click on the same instance fails.
    try {
      await db.insert(verificationTokens).values({
        email: payload.email,
        tokenHash,
        purpose: payload.purpose || "magic_link",
        redirectPath: payload.redirectPath || "/dashboard",
        expiresAt: new Date(payload.exp || Date.now()),
        consumedAt: new Date(),
      });
    } catch (error) {
      console.warn("Could not record magic-link consumption", error);
    }

    return {
      id: tokenHash,
      email: payload.email,
      tokenHash,
      purpose: payload.purpose || "magic_link",
      redirectPath: payload.redirectPath || "/dashboard",
      expiresAt: new Date(payload.exp || Date.now()),
      consumedAt: new Date(),
    };
  }

  return null;
}

export async function purgeExpiredMagicLinkTokens() {
  try {
    await db.delete(verificationTokens).where(lt(verificationTokens.expiresAt, new Date()));
  } catch (error) {
    console.warn("Could not purge expired magic-link tokens", error);
  }
}
