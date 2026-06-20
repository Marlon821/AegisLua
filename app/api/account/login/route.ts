import { NextRequest, NextResponse } from "next/server";
import { isOwnerEmail, SESSION_COOKIE } from "@/lib/admin";
import { createSessionToken, hashSessionToken, verifyPassword } from "@/lib/crypto";
import { findUserByEmail, saveSession, saveUser } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid login" }, { status: 401 });
    }

    if (isOwnerEmail(user.email)) user.role = "owner";
    user.plan ||= "free";
    user.subscriptionStatus ||= "free";
    user.subscriptionRenewsAt ||= null;
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    await saveUser(user);

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
    await saveSession({
      id: hashSessionToken(token),
      userId: user.id,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(expiresAt),
      path: "/",
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    const isSetupError = message.includes("KV_REST_API_URL") || message.includes("KV_REST_API_TOKEN");
    return NextResponse.json({
      error: isSetupError
        ? "Database is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel, then redeploy."
        : "Could not sign in. Check the server logs for details.",
      detail: process.env.NODE_ENV === "production" ? undefined : message,
    }, { status: 500 });
  }
}
