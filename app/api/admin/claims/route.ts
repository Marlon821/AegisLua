import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/admin";
import { createTicketForCampaign, claimTicketUrl } from "@/lib/claims";
import { createId, decryptSecret, encryptSecret, hashKey } from "@/lib/crypto";
import { createLootLabsLink } from "@/lib/lootlabs";
import {
  listClaimCampaigns,
  listClaimRedemptions,
  listClaimTickets,
  listScripts,
  saveClaimCampaign,
  saveClaimTicket,
} from "@/lib/store";
import { ClaimCampaign, ClaimProvider, ScriptProject, UserAccount } from "@/lib/types";

export const runtime = "nodejs";

const providers: ClaimProvider[] = ["lootlabs"];

function safeNumber(value: unknown, fallback: number, min: number, max: number) {
  const number = Math.floor(Number(value || fallback));
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function canUsePremium(user: UserAccount) {
  return user.role === "owner" || user.role === "admin" || user.plan === "pro" || user.plan === "enterprise";
}

function canSeeCampaign(user: UserAccount, campaign: ClaimCampaign) {
  return user.role === "owner" || user.role === "admin" || campaign.ownerId === user.id;
}

function canUseScript(user: UserAccount, script: ScriptProject) {
  return user.role === "owner" || user.role === "admin" || script.ownerId === user.id;
}

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !canUsePremium(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [campaigns, tickets, redemptions] = await Promise.all([
    listClaimCampaigns(),
    listClaimTickets(),
    listClaimRedemptions(),
  ]);
  const origin = request.nextUrl.origin;
  const visibleCampaigns = campaigns.filter((campaign) => canSeeCampaign(user, campaign));
  const visibleCampaignIds = new Set(visibleCampaigns.map((campaign) => campaign.id));

  return NextResponse.json({
    campaigns: visibleCampaigns,
    tickets: tickets.map((ticket) => ({
      ...ticket,
      claimUrl: claimTicketUrl(origin, ticket),
    })).filter((ticket) => visibleCampaignIds.has(ticket.campaignId)),
    redemptions: redemptions.filter((redemption) => redemption.campaignId && visibleCampaignIds.has(redemption.campaignId)),
  });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || !canUsePremium(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const now = new Date().toISOString();
  const provider = providers.includes(body.provider) ? body.provider : "lootlabs";
  const scriptIds: string[] = Array.isArray(body.scriptIds) ? body.scriptIds.map(String).filter(Boolean) : [];
  const allowedScriptIds = new Set((await listScripts()).filter((script) => canUseScript(user, script)).map((script) => script.id));
  if (scriptIds.length === 0) {
    return NextResponse.json({ error: "Choose the script this ad system should unlock." }, { status: 400 });
  }
  if (scriptIds.some((scriptId) => !allowedScriptIds.has(scriptId))) {
    return NextResponse.json({ error: "Choose scripts from your own workspace." }, { status: 403 });
  }

  const apiKey = String(body.apiKey || "").trim();
  const campaign: ClaimCampaign = {
    id: createId(),
    ownerId: user.id,
    name: String(body.name || "Untitled ad system"),
    provider,
    active: body.active !== false,
    scriptIds,
    labelPrefix: String(body.labelPrefix || "Claimed license"),
    apiKeyHash: apiKey ? hashKey(apiKey) : null,
    apiKeyEncrypted: apiKey ? encryptSecret(apiKey) : null,
    deliveryKeyHash: null,
    deliveryKeyEncrypted: null,
    deliveryLicenseId: null,
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
