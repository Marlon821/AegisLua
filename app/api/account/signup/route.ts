import { NextRequest, NextResponse } from "next/server";
import { isOwnerEmail, SESSION_COOKIE } from "@/lib/admin";
import { createId, createSessionToken, hashPassword, hashSessionToken } from "@/lib/crypto";
import { findUserByEmail, listUsers, saveSession, saveUser } from "@/lib/store";
import { UserAccount } from "@/lib/types";

export const runtime = "nodejs";

function publicUser(user: UserAccount) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing name, email, or password" }, { status: 400 });
    }

    if (password.length < 10) {
      return NextResponse.json({ error: "Password must be at least 10 characters" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const users = await listUsers();
    const isFirstUser = users.length === 0;

    const now = new Date().toISOString();
    const user: UserAccount = {
      id: createId(),
      email,
      name,
      role: isFirstUser || isOwnerEmail(email) ? "owner" : "customer",
      plan: "free",
      subscriptionStatus: "free",
      subscriptionRenewsAt: null,
      passwordHash: hashPassword(password),
      active: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };
    await saveUser(user);

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
    await saveSession({
      id: hashSessionToken(token),
      userId: user.id,
      expiresAt,
      createdAt: now,
    });

    const response = NextResponse.json({ user: publicUser(user) });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(expiresAt),
      path: "/",
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed";
    const isSetupError = message.includes("KV_REST_API_URL") || message.includes("KV_REST_API_TOKEN");
    return NextResponse.json({
      error: isSetupError
        ? "Database is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel, then redeploy."
        : "Could not create account. Check the server logs for details.",
      detail: process.env.NODE_ENV === "production" ? undefined : message,
    }, { status: 500 });
  }
}
