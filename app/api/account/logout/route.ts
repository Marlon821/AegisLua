import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/admin";
import { hashSessionToken } from "@/lib/crypto";
import { deleteSession } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(hashSessionToken(token));
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
  return response;
}
