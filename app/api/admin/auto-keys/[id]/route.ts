import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createLicenseFromRule, nextRunFrom } from "@/lib/auto-keys";
import { deleteAutoKeyRule, getAutoKeyRule, saveAutoKeyRule, saveLicense } from "@/lib/store";

export const runtime = "nodejs";

function publicLicense<T extends { keyHash?: string; keyEncrypted?: string | null }>(license: T) {
  const { keyHash: _keyHash, keyEncrypted: _keyEncrypted, ...safe } = license;
  return { ...safe, hasStoredKey: Boolean(license.keyEncrypted) };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const rule = await getAutoKeyRule(id);
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  if (body.action === "generate") {
    if (rule.scriptIds.length === 0) {
      return NextResponse.json({ error: "Rule has no scripts assigned" }, { status: 400 });
    }
    const { plainKey, license } = createLicenseFromRule(rule);
    await saveLicense(license);
    const now = new Date();
    rule.lastGeneratedAt = now.toISOString();
    rule.nextRunAt = nextRunFrom(now, rule.intervalCount, rule.intervalUnit);
    rule.currentLicenseId = license.id;
    rule.updatedAt = now.toISOString();
    await saveAutoKeyRule(rule);
    return NextResponse.json({ key: plainKey, license: publicLicense(license), rule });
  }

  if (typeof body.name === "string") rule.name = body.name;
  if (typeof body.active === "boolean") rule.active = body.active;
  if (Array.isArray(body.scriptIds)) rule.scriptIds = body.scriptIds.map(String).filter(Boolean);
  if (typeof body.labelPrefix === "string") rule.labelPrefix = body.labelPrefix;
  if (typeof body.maxUsers === "number") rule.maxUsers = Math.max(1, Math.floor(body.maxUsers));
  if (typeof body.maxDevices === "number") rule.maxDevices = Math.max(1, Math.floor(body.maxDevices));
  if (typeof body.intervalCount === "number") rule.intervalCount = Math.max(1, Math.floor(body.intervalCount));
  if (["days", "weeks", "months"].includes(body.intervalUnit)) rule.intervalUnit = body.intervalUnit;
  if ("keyExpiresInDays" in body) rule.keyExpiresInDays = body.keyExpiresInDays ? Math.max(1, Math.floor(Number(body.keyExpiresInDays))) : null;
  rule.nextRunAt = nextRunFrom(new Date(rule.lastGeneratedAt || rule.updatedAt), rule.intervalCount, rule.intervalUnit);
  rule.updatedAt = new Date().toISOString();

  await saveAutoKeyRule(rule);
  return NextResponse.json({ rule });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await deleteAutoKeyRule(id);
  return NextResponse.json({ ok: true });
}
