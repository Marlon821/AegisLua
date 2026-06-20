import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/admin";
import { nextRunFrom } from "@/lib/auto-keys";
import { createId } from "@/lib/crypto";
import { listAutoKeyRules, listScripts, saveAutoKeyRule } from "@/lib/store";
import { AutoKeyIntervalUnit, AutoKeyRule, ScriptProject, UserAccount } from "@/lib/types";

export const runtime = "nodejs";

const units: AutoKeyIntervalUnit[] = ["days", "weeks", "months"];

function safeNumber(value: unknown, fallback: number, min: number, max: number) {
  const number = Math.floor(Number(value || fallback));
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function canUsePremium(user: UserAccount) {
  return user.role === "owner" || user.role === "admin" || user.plan === "pro" || user.plan === "enterprise";
}

function canSeeRule(user: UserAccount, rule: AutoKeyRule) {
  return user.role === "owner" || user.role === "admin" || rule.ownerId === user.id;
}

function canUseScript(user: UserAccount, script: ScriptProject) {
  return user.role === "owner" || user.role === "admin" || script.ownerId === user.id;
}

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !canUsePremium(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ rules: (await listAutoKeyRules()).filter((rule) => canSeeRule(user, rule)) });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !canUsePremium(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const now = new Date();
  const intervalCount = safeNumber(body.intervalCount, 1, 1, 365);
  const intervalUnit = units.includes(body.intervalUnit) ? body.intervalUnit : "days";
  const scriptIds: string[] = Array.isArray(body.scriptIds) ? body.scriptIds.map(String).filter(Boolean) : [];
  const allowedScriptIds = new Set((await listScripts()).filter((script) => canUseScript(user, script)).map((script) => script.id));
  if (scriptIds.some((scriptId) => !allowedScriptIds.has(scriptId))) {
    return NextResponse.json({ error: "Choose scripts from your own workspace." }, { status: 403 });
  }

  const rule: AutoKeyRule = {
    id: createId(),
    ownerId: user.id,
    name: String(body.name || "Untitled auto key"),
    active: body.active !== false,
    scriptIds,
    labelPrefix: String(body.labelPrefix || "Auto key"),
    intervalCount,
    intervalUnit,
    maxUsers: safeNumber(body.maxUsers, 1000000, 1, 1000000),
    maxDevices: safeNumber(body.maxDevices, 1000000, 1, 1000000),
    keyExpiresInDays: body.keyExpiresInDays ? safeNumber(body.keyExpiresInDays, 7, 1, 3650) : null,
    lastGeneratedAt: null,
    nextRunAt: nextRunFrom(now, intervalCount, intervalUnit),
    currentLicenseId: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await saveAutoKeyRule(rule);
  return NextResponse.json({ rule });
}
