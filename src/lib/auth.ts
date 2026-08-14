import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { config } from "./config";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + config.auth.secret).digest("hex");
}

export async function createUser(email: string, password: string, name: string) {
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    throw new Error("User already exists");
  }
  const [user] = await db
    .insert(users)
    .values({
      email,
      name,
      passwordHash: hashPassword(password),
    })
    .returning();
  return user;
}

export async function authenticateUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.passwordHash) return null;
  if (user.passwordHash !== hashPassword(password)) return null;
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
