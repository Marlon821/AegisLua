import { NextRequest, NextResponse } from "next/server";
import { createId, decryptSecret, hashDeviceId, hashKey } from "@/lib/crypto";
import { appendLog, findLicenseByHash, listScripts, saveLicense } from "@/lib/store";

export const runtime = "nodejs";

function response(ok: boolean, reason: string, status = ok ? 200 : 403, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok, reason, ...extra }, { status });
}

export async function POST(request: NextRequest, context: { params: Promise<{ script: string }> }) {
  const { script: rawScript } = await context.params;
  const body = await request.json().catch(() => ({}));
  const scriptId = decodeURIComponent(rawScript || "");
  const key = String(body.key || body.license || "").trim();
  const userId = String(body.userId || body.robloxUserId || "").trim();
  const username = String(body.username || "").trim();
  const placeId = body.placeId ? String(body.placeId) : null;
  const rawDeviceId = String(body.deviceId || body.hwid || "").trim();
  const deviceHash = rawDeviceId ? hashDeviceId(rawDeviceId) : null;

  const scripts = await listScripts();
  const script = scripts.find((item) => item.id === scriptId || item.slug === scriptId) || null;
  const license = key ? await findLicenseByHash(hashKey(key)) : null;
  const logBase = {
    id: createId(),
    scriptId: script?.id || scriptId || null,
    licenseId: license?.id || null,
    userId,
    username,
    placeId,
    deviceHash,
    createdAt: new Date().toISOString(),
  };

  async function deny(reason: string, status = 403) {
    await appendLog({ ...logBase, ok: false, reason });
    return response(false, reason, status);
  }

  if (!scriptId || !key || !userId) return deny("missing_required_fields", 400);
  if (!script) return deny("script_not_found", 404);
  if (!script.active) return deny("script_disabled");
  if (!script.sourceEncrypted) return deny("script_source_missing", 404);
  if (!license) return deny("invalid_license");
  if (!license.active) return deny("license_disabled");
  if (!license.scriptIds.includes(script.id)) return deny("script_not_in_license");
  if (license.expiresAt && Date.now() > new Date(license.expiresAt).getTime()) return deny("license_expired");
  if (script.requireDeviceId && !script.allowMissingDeviceId && !deviceHash) return deny("missing_device_id", 400);

  if (!license.users.includes(userId)) {
    if (license.users.length >= license.maxUsers) return deny("user_limit_reached");
    license.users.push(userId);
  }

  if (deviceHash) {
    const device = license.devices.find((item) => item.hash === deviceHash);
    if (device?.status === "blocked") return deny("device_blocked");

    if (!device) {
      if (license.devices.filter((item) => item.status === "active").length >= license.maxDevices) {
        return deny("device_limit_reached");
      }
      license.devices.push({
        hash: deviceHash,
        userId,
        username: username || null,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        status: "active",
      });
    } else {
      device.lastSeenAt = new Date().toISOString();
      device.username = username || device.username;
      device.userId = userId || device.userId;
    }
  }

  let code = "";
  try {
    code = decryptSecret(script.sourceEncrypted);
  } catch {
    return deny("script_decrypt_failed", 500);
  }

  license.lastUsedAt = new Date().toISOString();
  license.lastUsername = username || null;
  license.updatedAt = new Date().toISOString();
  await saveLicense(license);
  await appendLog({ ...logBase, licenseId: license.id, scriptId: script.id, ok: true, reason: "ok" });

  return response(true, "ok", 200, {
    code,
    script: {
      id: script.id,
      slug: script.slug,
      name: script.name,
    },
  });
}
