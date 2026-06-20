import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/admin";
import { createId, createPlainKey, encryptSecret, hashKey } from "@/lib/crypto";
import { listLicenses, listScripts, saveLicense } from "@/lib/store";
import { LicenseRecord, ScriptProject, UserAccount } from "@/lib/types";

export const runtime = "nodejs";

function publicLicense(record: LicenseRecord) {
  const { keyHash: _keyHash, keyEncrypted: _keyEncrypted, ...safe } = record;
  return { ...safe, hasStoredKey: Boolean(record.keyEncrypted) };
}

function canSeeLicense(user: UserAccount, record: LicenseRecord) {
  return user.role === "owner" || user.role === "admin" || record.ownerId === user.id;
}

function canUseScript(user: UserAccount, script: ScriptProject) {
  return user.role === "owner" || user.role === "admin" || script.ownerId === user.id;
}

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const licenses = (await listLicenses()).filter((record) => canSeeLicense(user, record));
  return NextResponse.json({
    licenses: licenses.map((record) => publicLicense(record)),
  });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plainKey = createPlainKey();
  const now = new Date().toISOString();
  const scriptIds: string[] = Array.isArray(body.scriptIds) ? body.scriptIds.map(String).filter(Boolean) : [];
  const scripts = await listScripts();
  const allowedScriptIds = new Set(scripts.filter((script) => canUseScript(user, script)).map((script) => script.id));
  if (scriptIds.some((scriptId) => !allowedScriptIds.has(scriptId))) {
    return NextResponse.json({ error: "Choose scripts from your own workspace." }, { status: 403 });
  }

  const record: LicenseRecord = {
    id: createId(),
    ownerId: user.id,
    keyHash: hashKey(plainKey),
    keyEncrypted: encryptSecret(plainKey),
    label: String(body.label || "Untitled license"),
    active: true,
    scriptIds,
    maxUsers: Math.max(1, Number(body.maxUsers || 1)),
    users: [],
    maxDevices: Math.max(1, Number(body.maxDevices || 1)),
    devices: [],
    expiresAt: body.expiresAt ? new Date(body.expiresAt).toISOString() : null,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    lastUsername: null,
  };

  await saveLicense(record);
  return NextResponse.json({ key: plainKey, license: publicLicense(record) });
}
