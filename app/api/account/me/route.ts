import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, SESSION_COOKIE } from "@/lib/admin";
import { hashSessionToken } from "@/lib/crypto";
import { deleteSession, deleteUser, listUsers } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan || "free",
      subscriptionStatus: user.subscriptionStatus || "free",
    },
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (user.role === "owner") {
    const users = await listUsers();
    const activeOwners = users.filter((candidate) => candidate.role === "owner" && candidate.active);
    if (activeOwners.length <= 1) {
      return NextResponse.json({ error: "Create another owner before deleting the last owner account." }, { status: 400 });
    }
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await deleteSession(hashSessionToken(token));
  }
  await deleteUser(user.id);

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
