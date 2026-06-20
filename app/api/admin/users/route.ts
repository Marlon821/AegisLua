import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/admin";
import { listUsers } from "@/lib/store";
import { UserAccount } from "@/lib/types";

export const runtime = "nodejs";

function publicUser(user: UserAccount) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan || "free",
    subscriptionStatus: user.subscriptionStatus || "free",
    subscriptionRenewsAt: user.subscriptionRenewsAt || null,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export async function GET(request: NextRequest) {
  if (!(await requireOwner(request))) {
    return NextResponse.json({ error: "Owner access required" }, { status: 401 });
  }

  const users = await listUsers();
  users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ users: users.map(publicUser) });
}
