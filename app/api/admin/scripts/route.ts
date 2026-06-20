import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createId, encryptSecret, slugify } from "@/lib/crypto";
import { listScripts, saveScript } from "@/lib/store";
import { ScriptProject } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ scripts: await listScripts() });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const now = new Date().toISOString();
  const name = String(body.name || "Untitled Script");
  const slug = slugify(String(body.slug || name)) || createId();
  const sourceCode = String(body.sourceCode || "").trim();

  if (!sourceCode) {
    return NextResponse.json({ error: "Paste Lua source before protecting a script." }, { status: 400 });
  }

  const record: ScriptProject = {
    id: createId(),
    name,
    slug,
    description: String(body.description || ""),
    sourceEncrypted: encryptSecret(sourceCode),
    sourceBytes: new TextEncoder().encode(sourceCode).length,
    protectedAt: now,
    active: body.active !== false,
    requireDeviceId: body.requireDeviceId !== false,
    allowMissingDeviceId: body.allowMissingDeviceId === true,
    createdAt: now,
    updatedAt: now,
  };

  await saveScript(record);
  const loaderUrl = `${request.nextUrl.origin}/api/loader/${encodeURIComponent(record.slug)}`;
  return NextResponse.json({
    script: record,
    loaderUrl,
    loaderSnippet: `loadstring(game:HttpGet("${loaderUrl}"))()`,
  });
}
