import { NextRequest, NextResponse } from "next/server";
import { createId, createSessionToken, hashKey } from "@/lib/crypto";
import { findUserByEmail, savePasswordReset } from "@/lib/store";
import { PasswordResetRecord } from "@/lib/types";

export const runtime = "nodejs";

function appUrl(request: NextRequest) {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || request.nextUrl.origin).replace(/\/$/, "");
}

async function sendResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Reset your AegisLua password",
      html: `<p>Use this link to reset your AegisLua password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`,
    }),
  });

  return response.ok;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Enter your email first." }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !user.active) {
    return NextResponse.json({ ok: true });
  }

  const token = createSessionToken();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  const record: PasswordResetRecord = {
    id: createId(),
    userId: user.id,
    tokenHash: hashKey(token),
    expiresAt,
    usedAt: null,
    createdAt: now,
  };
  await savePasswordReset(record);

  const resetUrl = `${appUrl(request)}/login?reset=${encodeURIComponent(`${record.id}_${token}`)}`;
  const sent = await sendResetEmail(user.email, resetUrl);

  return NextResponse.json({
    ok: true,
    sent,
    resetUrl: process.env.NODE_ENV === "production" ? null : resetUrl,
  });
}
