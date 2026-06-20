import { NextRequest, NextResponse } from "next/server";
import { hashKey, hashPassword } from "@/lib/crypto";
import { getPasswordReset, getUser, savePasswordReset, saveUser } from "@/lib/store";

export const runtime = "nodejs";

function parseResetToken(value: string) {
  const splitAt = value.indexOf("_");
  if (splitAt <= 0) return null;
  return {
    id: value.slice(0, splitAt),
    token: value.slice(splitAt + 1),
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const reset = parseResetToken(String(body.reset || ""));
  const password = String(body.password || "");

  if (!reset) {
    return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
  }
  if (password.length < 10) {
    return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
  }

  const record = await getPasswordReset(reset.id);
  if (!record || record.tokenHash !== hashKey(reset.token)) {
    return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
  }
  if (record.usedAt) {
    return NextResponse.json({ error: "This reset link was already used." }, { status: 400 });
  }
  if (Date.now() > new Date(record.expiresAt).getTime()) {
    return NextResponse.json({ error: "This reset link expired." }, { status: 400 });
  }

  const user = await getUser(record.userId);
  if (!user || !user.active) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  user.passwordHash = hashPassword(password);
  user.updatedAt = now;
  record.usedAt = now;

  await saveUser(user);
  await savePasswordReset(record);

  return NextResponse.json({ ok: true });
}
