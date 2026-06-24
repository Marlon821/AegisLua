import { NextRequest, NextResponse } from "next/server";
import { ticketStatus } from "@/lib/claims";
import { createClaimSignature, createId, createPlainKey, encryptSecret, hashKey, parseClaimToken } from "@/lib/crypto";
import {
  appendClaimRedemption,
  getClaimCampaign,
  getClaimTicket,
  saveLicense,
  saveClaimTicket,
} from "@/lib/store";
import { LicenseRecord } from "@/lib/types";

export const runtime = "nodejs";

function requestIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
}

function response(ok: boolean, reason: string, status = ok ? 200 : 403, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok, reason, ...extra }, { status });
}

export async function POST(request: NextRequest, context: { params: Promise<{ ticket: string }> }) {
  const createdAt = new Date().toISOString();
  const ip = requestIp(request);
  const userAgent = request.headers.get("user-agent");
  const { ticket: rawTicket } = await context.params;
  const token = decodeURIComponent(rawTicket || "");
  const parsed = parseClaimToken(token);

  async function logAndDeny(reason: string, status = 403, campaignId: string | null = null, ticketId: string | null = null) {
    await appendClaimRedemption({
      id: createId(),
      campaignId,
      ticketId,
      licenseId: null,
      ok: false,
      reason,
      ip,
      userAgent,
      createdAt,
    });
    return response(false, reason, status);
  }

  if (!parsed) return logAndDeny("invalid_claim_link", 404);

  const ticket = await getClaimTicket(parsed.ticketId);
  if (!ticket || ticket.tokenHash !== hashKey(token)) return logAndDeny("invalid_claim_link", 404, null, parsed.ticketId);

  const campaign = await getClaimCampaign(ticket.campaignId);
  if (!campaign) return logAndDeny("campaign_not_found", 404, ticket.campaignId, ticket.id);

  const expected = createClaimSignature(ticket.id, ticket.campaignId, ticket.expiresAt, ticket.maxRedemptions);
  if (expected !== parsed.signature || expected !== ticket.signature) {
    return logAndDeny("claim_signature_failed", 403, campaign.id, ticket.id);
  }

  if (!campaign.active) return logAndDeny("campaign_disabled", 403, campaign.id, ticket.id);
  if (ticketStatus(ticket) === "expired") return logAndDeny("claim_expired", 403, campaign.id, ticket.id);
  if (ticketStatus(ticket) === "redeemed") return logAndDeny("claim_already_redeemed", 403, campaign.id, ticket.id);
  if (campaign.scriptIds.length === 0) return logAndDeny("claim_has_no_scripts", 400, campaign.id, ticket.id);

  const now = new Date().toISOString();
  const plainKey = createPlainKey();
  const keyDurationHours = Math.max(1, Math.min(24 * 365, Math.floor(Number(campaign.keyDurationHours || 24))));
  const expiresAt = new Date(Date.now() + keyDurationHours * 60 * 60 * 1000).toISOString();
  const license: LicenseRecord = {
    id: createId(),
    ownerId: campaign.ownerId || null,
    keyHash: hashKey(plainKey),
    keyEncrypted: encryptSecret(plainKey),
    label: `${campaign.labelPrefix || campaign.name || "Ad claim"} ${new Date().toLocaleDateString("en-US")}`,
    active: true,
    scriptIds: campaign.scriptIds,
    maxUsers: Math.max(1, Math.floor(Number(campaign.maxUsers || 1))),
    users: [],
    maxDevices: Math.max(1, Math.floor(Number(campaign.maxDevices || 1))),
    devices: [],
    expiresAt,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
    lastUsername: null,
  };
  ticket.redeemedCount += 1;
  ticket.updatedAt = now;
  await saveLicense(license);
  await saveClaimTicket(ticket);
  await appendClaimRedemption({
    id: createId(),
    campaignId: campaign.id,
    ticketId: ticket.id,
    licenseId: license.id,
    ok: true,
    reason: "ok",
    ip,
    userAgent,
    createdAt: now,
  });

  return response(true, "ok", 200, {
    key: plainKey,
    license: {
      id: license.id,
      expiresAt: license.expiresAt,
      maxDevices: license.maxDevices,
      maxUsers: license.maxUsers,
    },
  });
}
