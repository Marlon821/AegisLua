import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { deleteLicense, getLicense, saveLicense } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const record = await getLicense(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.active === "boolean") record.active = body.active;
  if (typeof body.label === "string") record.label = body.label;
  if (Array.isArray(body.scriptIds)) record.scriptIds = body.scriptIds.map(String).filter(Boolean);
  if (typeof body.maxUsers === "number") record.maxUsers = Math.max(1, Math.floor(body.maxUsers));
  if (typeof body.maxDevices === "number") record.maxDevices = Math.max(1, Math.floor(body.maxDevices));
  if (Array.isArray(body.devices)) record.devices = body.devices;
  if ("expiresAt" in body) record.expiresAt = body.expiresAt ? new Date(body.expiresAt).toISOString() : null;
  record.updatedAt = new Date().toISOString();

  await saveLicense(record);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await deleteLicense(id);
  return NextResponse.json({ ok: true });
}
