import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createId, createPlainKey, encryptSecret, hashKey } from "@/lib/crypto";
import { listLicenses, saveLicense } from "@/lib/store";
import { LicenseRecord } from "@/lib/types";

export const runtime = "nodejs";

function publicLicense(record: LicenseRecord) {
  const { keyHash: _keyHash, keyEncrypted: _keyEncrypted, ...safe } = record;
  return { ...safe, hasStoredKey: Boolean(record.keyEncrypted) };
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const licenses = await listLicenses();
  return NextResponse.json({
    licenses: licenses.map((record) => publicLicense(record)),
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plainKey = createPlainKey();
  const now = new Date().toISOString();
  const scriptIds = Array.isArray(body.scriptIds) ? body.scriptIds.map(String).filter(Boolean) : [];

  const record: LicenseRecord = {
    id: createId(),
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
