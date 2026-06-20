import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/admin";
import { createLicenseFromRule, nextRunFrom } from "@/lib/auto-keys";
import { deleteAutoKeyRule, getAutoKeyRule, listScripts, saveAutoKeyRule, saveLicense } from "@/lib/store";
import { AutoKeyRule, ScriptProject, UserAccount } from "@/lib/types";

export const runtime = "nodejs";

function canUsePremium(user: UserAccount) {
  return user.role === "owner" || user.role === "admin" || user.plan === "pro" || user.plan === "enterprise";
}

function canManageRule(user: UserAccount, rule: AutoKeyRule) {
  return user.role === "owner" || user.role === "admin" || rule.ownerId === user.id;
}

function canUseScript(user: UserAccount, script: ScriptProject) {
  return user.role === "owner" || user.role === "admin" || script.ownerId === user.id;
}

function publicLicense<T extends { keyHash?: string; keyEncrypted?: string | null }>(license: T) {
  const { keyHash: _keyHash, keyEncrypted: _keyEncrypted, ...safe } = license;
  return { ...safe, hasStoredKey: Boolean(license.keyEncrypted) };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user || !canUsePremium(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const rule = await getAutoKeyRule(id);
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageRule(user, rule)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.action === "generate") {
    if (rule.scriptIds.length === 0) {
      return NextResponse.json({ error: "Rule has no scripts assigned" }, { status: 400 });
    }
    const { plainKey, license } = createLicenseFromRule(rule);
    license.ownerId = rule.ownerId || user.id;
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
  if (Array.isArray(body.scriptIds)) {
    const scriptIds: string[] = body.scriptIds.map(String).filter(Boolean);
    const allowedScriptIds = new Set((await listScripts()).filter((script) => canUseScript(user, script)).map((script) => script.id));
    if (scriptIds.some((scriptId) => !allowedScriptIds.has(scriptId))) {
      return NextResponse.json({ error: "Choose scripts from your own workspace." }, { status: 403 });
    }
    rule.scriptIds = scriptIds;
  }
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
  const user = await getRequestUser(request);
  if (!user || !canUsePremium(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const rule = await getAutoKeyRule(id);
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canManageRule(user, rule)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteAutoKeyRule(id);
  return NextResponse.json({ ok: true });
}
