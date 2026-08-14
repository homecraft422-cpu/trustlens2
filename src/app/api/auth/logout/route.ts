import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  if (token) {
    await destroySession(token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("session_token");
  return response;
}
