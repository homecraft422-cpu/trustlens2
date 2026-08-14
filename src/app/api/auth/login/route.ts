import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createSession, normalizeEmail } from "@/lib/auth";
import { config } from "@/lib/config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Enter both your email address and password.", code: "MISSING_CREDENTIALS" },
        { status: 400 }
      );
    }

    if (!EMAIL_PATTERN.test(email) || email.length > 254 || password.length > 256) {
      return NextResponse.json(
        { error: "The email or password is not valid.", code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        {
          error: "We could not sign you in. Check your password, or create an account first if this email is new.",
          code: "INVALID_CREDENTIALS",
        },
        { status: 401 }
      );
    }

    const session = await createSession(user.id);
    const response = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
      redirectTo: "/dashboard",
    });

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
    console.error("Login error:", error);
    return NextResponse.json(
      {
        error: "Sign-in is temporarily unavailable. Please try again in a moment.",
        code: "AUTH_UNAVAILABLE",
      },
      { status: 500 }
    );
  }
}
