import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createTicketForCampaign, claimTicketUrl } from "@/lib/claims";
import { createId, decryptSecret, encryptSecret, hashKey } from "@/lib/crypto";
import { createLootLabsLink } from "@/lib/lootlabs";
import {
  findLicenseByHash,
  listClaimCampaigns,
  listClaimRedemptions,
  listClaimTickets,
  saveClaimCampaign,
  saveClaimTicket,
} from "@/lib/store";
import { ClaimCampaign, ClaimProvider } from "@/lib/types";

export const runtime = "nodejs";

const providers: ClaimProvider[] = ["lootlabs"];

function safeNumber(value: unknown, fallback: number, min: number, max: number) {
  const number = Math.floor(Number(value || fallback));
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [campaigns, tickets, redemptions] = await Promise.all([
    listClaimCampaigns(),
    listClaimTickets(),
    listClaimRedemptions(),
  ]);
  const origin = request.nextUrl.origin;

  return NextResponse.json({
    campaigns,
    tickets: tickets.map((ticket) => ({
      ...ticket,
      claimUrl: claimTicketUrl(origin, ticket),
    })),
    redemptions,
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const now = new Date().toISOString();
  const provider = providers.includes(body.provider) ? body.provider : "lootlabs";
  const scriptIds = Array.isArray(body.scriptIds) ? body.scriptIds.map(String).filter(Boolean) : [];
  const deliveryKey = String(body.deliveryKey || "").trim();
  const deliveryKeyHash = deliveryKey ? hashKey(deliveryKey) : null;
  const deliveryLicense = deliveryKeyHash ? await findLicenseByHash(deliveryKeyHash) : null;

  if (!deliveryKey || !deliveryLicense) {
    return NextResponse.json({ error: "Paste an existing key from Key Inventory before creating an ad system." }, { status: 400 });
  }

  const apiKey = String(body.apiKey || "").trim();
  const campaign: ClaimCampaign = {
    id: createId(),
    name: String(body.name || "Untitled ad system"),
    provider,
    active: body.active !== false,
    scriptIds,
    labelPrefix: String(body.labelPrefix || "Claimed license"),
    apiKeyHash: apiKey ? hashKey(apiKey) : null,
    apiKeyEncrypted: apiKey ? encryptSecret(apiKey) : null,
    deliveryKeyHash,
    deliveryKeyEncrypted: encryptSecret(deliveryKey),
    deliveryLicenseId: deliveryLicense.id,
    steps: safeNumber(body.steps, 3, 1, 10),
    keyDurationHours: safeNumber(body.keyDurationHours, 24, 1, 24 * 365),
    discordRequired: Boolean(body.discordRequired),
    maxUsers: safeNumber(body.maxUsers, 1000000, 1, 1000000),
    maxDevices: safeNumber(body.maxDevices, 1000000, 1, 1000000),
    licenseExpiresAt: body.licenseExpiresAt ? new Date(body.licenseExpiresAt).toISOString() : null,
    ticketTtlMinutes: safeNumber(body.ticketTtlMinutes, 60, 5, 60 * 24 * 30),
    maxRedemptions: safeNumber(body.maxRedemptions, 1, 1, 10000),
    tierId: safeNumber(body.tierId, 3, 1, 4),
    themeId: safeNumber(body.themeId, 1, 1, 5),
    thumbnailUrl: body.thumbnailUrl ? String(body.thumbnailUrl) : null,
    createdAt: now,
    updatedAt: now,
  };
  const { ticket, token } = createTicketForCampaign(campaign);
  const claimUrl = `${request.nextUrl.origin}/claim/${encodeURIComponent(token)}`;
  let warning: string | null = null;

  if (campaign.apiKeyEncrypted) {
    try {
      ticket.monetizedUrl = await createLootLabsLink({
        apiKey: decryptSecret(campaign.apiKeyEncrypted),
        title: campaign.name,
        destinationUrl: claimUrl,
        tierId: campaign.tierId,
        numberOfTasks: Math.min(5, campaign.steps),
        themeId: campaign.themeId,
        thumbnailUrl: campaign.thumbnailUrl,
      });
    } catch (error) {
      warning = error instanceof Error ? error.message : "LootLabs link creation failed";
    }
  }

  await saveClaimCampaign(campaign);
  await saveClaimTicket(ticket);

  return NextResponse.json({
    campaign,
    ticket,
    token,
    claimUrl,
    monetizedUrl: ticket.monetizedUrl,
    warning,
  });
}
