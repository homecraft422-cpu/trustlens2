import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("session_token")?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const user = await getSessionUserFromToken(token);
    if (!user) {
      const response = NextResponse.json(
        { user: null },
        { headers: { "Cache-Control": "no-store" } }
      );
      response.cookies.delete("session_token");
      return response;
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          authProvider: user.authProvider || "email",
          createdAt: user.createdAt,
          plan: user.plan || "free",
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Session lookup error:", error);
    return NextResponse.json(
      { user: null, error: "Unable to verify the current session." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
