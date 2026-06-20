import { NextRequest } from "next/server";
import { hashSessionToken } from "./crypto";
import { getSession, getUser, saveUser } from "./store";

export const SESSION_COOKIE = "aegislua_session";

export function isOwnerEmail(email: string) {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(ownerEmail && email.trim().toLowerCase() === ownerEmail);
}

export async function getRequestUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await getSession(hashSessionToken(token));
  if (!session || Date.now() > new Date(session.expiresAt).getTime()) return null;

  const user = await getUser(session.userId);
  if (!user || !user.active) return null;
  if (isOwnerEmail(user.email) && user.role !== "owner") {
    user.role = "owner";
    user.updatedAt = new Date().toISOString();
    await saveUser(user);
  }
  return user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await getRequestUser(request);
  return Boolean(user && (user.role === "owner" || user.role === "admin"));
}

export async function requireOwner(request: NextRequest) {
  const user = await getRequestUser(request);
  return user?.role === "owner" ? user : null;
}
