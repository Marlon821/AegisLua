import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/admin";
import { decryptSecret } from "@/lib/crypto";
import { deleteLicense, getLicense, listScripts, saveLicense } from "@/lib/store";
import { LicenseRecord, ScriptProject, UserAccount } from "@/lib/types";

export const runtime = "nodejs";

function canManageLicense(user: UserAccount, record: LicenseRecord) {
  return user.role === "owner" || user.role === "admin" || record.ownerId === user.id;
}

function canUseScript(user: UserAccount, script: ScriptProject) {
  return user.role === "owner" || user.role === "admin" || script.ownerId === user.id;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const record = await getLicense(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageLicense(user, record)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.action === "reveal") {
    if (!record.keyEncrypted) {
      return NextResponse.json({ error: "This key was created before reveal support and cannot be recovered." }, { status: 404 });
    }
    try {
      return NextResponse.json({ key: decryptSecret(record.keyEncrypted) });
    } catch {
      return NextResponse.json({ error: "Stored key could not be decrypted." }, { status: 500 });
    }
  }

  if (typeof body.active === "boolean") record.active = body.active;
  if (typeof body.label === "string") record.label = body.label;
  if (Array.isArray(body.scriptIds)) {
    const scriptIds: string[] = body.scriptIds.map(String).filter(Boolean);
    const scripts = await listScripts();
    const allowedScriptIds = new Set(scripts.filter((script) => canUseScript(user, script)).map((script) => script.id));
    if (scriptIds.some((scriptId) => !allowedScriptIds.has(scriptId))) {
      return NextResponse.json({ error: "Choose scripts from your own workspace." }, { status: 403 });
    }
    record.scriptIds = scriptIds;
  }
  if (typeof body.maxUsers === "number") record.maxUsers = Math.max(1, Math.floor(body.maxUsers));
  if (typeof body.maxDevices === "number") record.maxDevices = Math.max(1, Math.floor(body.maxDevices));
  if (Array.isArray(body.devices)) record.devices = body.devices;
  if ("expiresAt" in body) record.expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;
  record.updatedAt = new Date().toISOString();

  await saveLicense(record);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const record = await getLicense(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canManageLicense(user, record)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteLicense(id);
  return NextResponse.json({ ok: true });
}
