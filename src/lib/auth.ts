import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes, createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { config } from "./config";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + config.auth.secret).digest("hex");
}

/**
 * Email addresses are treated case-insensitively. Keeping this normalization in
 * the server-side auth layer is important because API clients can bypass the
 * signup/login pages (and PostgreSQL string equality is case-sensitive).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(email: string, password: string, name: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
  if (existing.length > 0) {
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

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
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
