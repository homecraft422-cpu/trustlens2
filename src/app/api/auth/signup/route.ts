import { NextRequest, NextResponse } from "next/server";
import { createUser, createSession, normalizeEmail } from "@/lib/auth";
import { config } from "@/lib/config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required.", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: "Enter a valid email address.", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: "Name must be between 2 and 80 characters.", code: "INVALID_NAME" },
        { status: 400 }
      );
    }
    if (password.length < 8 || password.length > 256) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters.", code: "WEAK_PASSWORD" },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name);
    const session = await createSession(user.id);
    const response = NextResponse.json(
      {
        ok: true,
        user: { id: user.id, email: user.email, name: user.name },
        redirectTo: "/dashboard",
      },
      { status: 201 }
    );

    response.cookies.set("session_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
      maxAge: Math.floor(config.auth.sessionDuration / 1000),
      priority: "high",
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    if (message === "User already exists") {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Sign in instead.",
          code: "ACCOUNT_EXISTS",
        },
        { status: 409 }
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "We could not create your account. Please try again.", code: "SIGNUP_FAILED" },
      { status: 500 }
    );
  }
}
