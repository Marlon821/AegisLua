import { NextRequest } from "next/server";
import { hashSessionToken } from "./crypto";
import { getSession, getUser } from "./store";

export const SESSION_COOKIE = "aegislua_session";

export async function getRequestUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await getSession(hashSessionToken(token));
  if (!session || Date.now() > new Date(session.expiresAt).getTime()) return null;

  const user = await getUser(session.userId);
  if (!user || !user.active) return null;
  return user;
}

export async function requireAdmin(request: NextRequest) {
  const user = await getRequestUser(request);
  return Boolean(user && (user.role === "owner" || user.role === "admin"));
}
