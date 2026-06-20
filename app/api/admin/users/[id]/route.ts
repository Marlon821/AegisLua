import { NextRequest, NextResponse } from "next/server";
import { isOwnerEmail, requireOwner } from "@/lib/admin";
import { deleteUser, getUser, listUsers, saveUser } from "@/lib/store";
import { UserAccount } from "@/lib/types";

export const runtime = "nodejs";

const roles: UserAccount["role"][] = ["owner", "admin", "customer"];
const plans: NonNullable<UserAccount["plan"]>[] = ["free", "pro", "enterprise"];
const subscriptionStatuses: NonNullable<UserAccount["subscriptionStatus"]>[] = ["free", "trialing", "active", "past_due", "canceled"];

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

async function hasAnotherOwner(targetId: string) {
  const users = await listUsers();
  return users.some((user) => user.id !== targetId && user.active && user.role === "owner");
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner(request);
  if (!owner) {
    return NextResponse.json({ error: "Owner access required" }, { status: 401 });
  }

  const { id } = await context.params;
  const user = await getUser(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.name === "string") user.name = body.name.trim() || user.name;

  if (typeof body.role === "string" && roles.includes(body.role)) {
    if (user.id === owner.id && body.role !== "owner") {
      return NextResponse.json({ error: "You cannot demote your own owner account." }, { status: 400 });
    }
    if (user.role === "owner" && body.role !== "owner" && !(await hasAnotherOwner(user.id))) {
      return NextResponse.json({ error: "Create another owner before demoting this account." }, { status: 400 });
    }
    user.role = isOwnerEmail(user.email) ? "owner" : body.role;
  }

  if (typeof body.plan === "string" && plans.includes(body.plan)) user.plan = body.plan;
  if (typeof body.subscriptionStatus === "string" && subscriptionStatuses.includes(body.subscriptionStatus)) {
    user.subscriptionStatus = body.subscriptionStatus;
  }
  if (typeof body.subscriptionRenewsAt === "string") user.subscriptionRenewsAt = body.subscriptionRenewsAt || null;

  if (typeof body.active === "boolean") {
    if (user.id === owner.id && !body.active) {
      return NextResponse.json({ error: "You cannot disable your own owner account." }, { status: 400 });
    }
    if (user.role === "owner" && !body.active && !(await hasAnotherOwner(user.id))) {
      return NextResponse.json({ error: "Create another owner before disabling this account." }, { status: 400 });
    }
    user.active = body.active;
  }

  user.updatedAt = new Date().toISOString();
  await saveUser(user);
  return NextResponse.json({ user: publicUser(user) });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner(request);
  if (!owner) {
    return NextResponse.json({ error: "Owner access required" }, { status: 401 });
  }

  const { id } = await context.params;
  const user = await getUser(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.id === owner.id) {
    return NextResponse.json({ error: "You cannot delete your own owner account." }, { status: 400 });
  }
  if (user.role === "owner" && !(await hasAnotherOwner(user.id))) {
    return NextResponse.json({ error: "Create another owner before deleting this account." }, { status: 400 });
  }

  await deleteUser(user.id);
  return NextResponse.json({ ok: true });
}
