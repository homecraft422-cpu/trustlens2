import { db } from "@/db";
import { users, sessions, verificationTokens } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";
import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { config } from "./config";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + config.auth.secret).digest("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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
  const suppliedHash = hashPassword(password);

  // Perform a constant-time comparison even for an unknown account so the
  // response does not reveal whether a particular email is registered.
  const storedHash = user?.passwordHash || "0".repeat(suppliedHash.length);
  const suppliedBuffer = Buffer.from(suppliedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  const valid =
    suppliedBuffer.length === storedBuffer.length && timingSafeEqual(suppliedBuffer, storedBuffer);

  if (!user || !user.passwordHash || !valid) return null;
  return user;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + config.auth.sessionDuration);
  await db.insert(sessions).values({ userId, token, expiresAt });
  return { token, expiresAt };
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (!token) return null;
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);
    if (!session) return null;
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    return user || null;
  } catch {
    return null;
  }
}

export async function getSessionUserFromToken(token: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!session) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user || null;
}

export async function destroySession(token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
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
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + config.auth.magicLinkDuration);

  // Invalidate any prior unconsumed tokens for this email so only the newest link works.
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.email, normalizedEmail),
        eq(verificationTokens.purpose, params.purpose || "magic_link")
      )
    );

  await db.insert(verificationTokens).values({
    email: normalizedEmail,
    tokenHash,
    purpose: params.purpose || "magic_link",
    redirectPath: params.redirectPath || "/dashboard",
    expiresAt,
  });

  return { rawToken, tokenHash, expiresAt };
}

export async function consumeMagicLinkToken(rawToken: string) {
  if (!rawToken || rawToken.length < 32) return null;
  const tokenHash = hashToken(rawToken);

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.tokenHash, tokenHash)))
    .limit(1);

  if (!record) return null;
  if (record.consumedAt) return null;
  if (new Date(record.expiresAt).getTime() < Date.now()) return null;

  await db
    .update(verificationTokens)
    .set({ consumedAt: new Date() })
    .where(eq(verificationTokens.id, record.id));

  return record;
}

export async function purgeExpiredMagicLinkTokens() {
  await db.delete(verificationTokens).where(lt(verificationTokens.expiresAt, new Date()));
}
