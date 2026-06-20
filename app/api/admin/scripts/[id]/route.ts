import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/admin";
import { encryptSecret, slugify } from "@/lib/crypto";
import { deleteScript, getScript, saveScript } from "@/lib/store";
import { ScriptProject, UserAccount } from "@/lib/types";

export const runtime = "nodejs";

function canManageScript(user: UserAccount, script: ScriptProject) {
  return user.role === "owner" || user.role === "admin" || script.ownerId === user.id;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const record = await getScript(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageScript(user, record)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.name === "string") record.name = body.name;
  if (typeof body.slug === "string") record.slug = slugify(body.slug) || record.slug;
  if (typeof body.description === "string") record.description = body.description;
  if (typeof body.sourceCode === "string" && body.sourceCode.trim()) {
    record.sourceEncrypted = encryptSecret(body.sourceCode);
    record.sourceBytes = new TextEncoder().encode(body.sourceCode).length;
    record.protectedAt = new Date().toISOString();
  }
  if (typeof body.active === "boolean") record.active = body.active;
  if (typeof body.requireDeviceId === "boolean") record.requireDeviceId = body.requireDeviceId;
  if (typeof body.allowMissingDeviceId === "boolean") record.allowMissingDeviceId = body.allowMissingDeviceId;
  record.updatedAt = new Date().toISOString();

  await saveScript(record);
  return NextResponse.json({ script: record });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const record = await getScript(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageScript(user, record)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteScript(id);
  return NextResponse.json({ ok: true });
}
