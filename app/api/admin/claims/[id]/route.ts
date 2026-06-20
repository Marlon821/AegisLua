import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createTicketForCampaign, publicClaimUrl } from "@/lib/claims";
import { decryptSecret, encryptSecret, hashKey } from "@/lib/crypto";
import { createLootLabsLink } from "@/lib/lootlabs";
import { deleteClaimCampaign, findLicenseByHash, getClaimCampaign, saveClaimCampaign, saveClaimTicket } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const campaign = await getClaimCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.action === "ticket") {
    const { ticket, token } = createTicketForCampaign(campaign);
    const claimUrl = publicClaimUrl(request.nextUrl.origin, token);
    let warning: string | null = null;
    if (campaign.apiKeyEncrypted) {
      try {
        ticket.monetizedUrl = await createLootLabsLink({
          apiKey: decryptSecret(campaign.apiKeyEncrypted),
          title: campaign.name,
          destinationUrl: claimUrl,
          tierId: campaign.tierId || 3,
          numberOfTasks: Math.min(5, campaign.steps || 3),
          themeId: campaign.themeId || 1,
          thumbnailUrl: campaign.thumbnailUrl,
        });
      } catch (error) {
        warning = error instanceof Error ? error.message : "LootLabs link creation failed";
      }
    }
    await saveClaimTicket(ticket);
    return NextResponse.json({ ticket, token, claimUrl, monetizedUrl: ticket.monetizedUrl, warning });
  }

  if (typeof body.name === "string") campaign.name = body.name;
  if (typeof body.active === "boolean") campaign.active = body.active;
  if (Array.isArray(body.scriptIds)) campaign.scriptIds = body.scriptIds.map(String).filter(Boolean);
  if (typeof body.labelPrefix === "string") campaign.labelPrefix = body.labelPrefix;
  if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    campaign.apiKeyHash = hashKey(body.apiKey);
    campaign.apiKeyEncrypted = encryptSecret(body.apiKey);
  }
  if (typeof body.deliveryKey === "string" && body.deliveryKey.trim()) {
    const deliveryKeyHash = hashKey(body.deliveryKey);
    const deliveryLicense = await findLicenseByHash(deliveryKeyHash);
    if (!deliveryLicense) {
      return NextResponse.json({ error: "That delivery key does not exist in Key Inventory." }, { status: 400 });
    }
    campaign.deliveryKeyHash = deliveryKeyHash;
    campaign.deliveryKeyEncrypted = encryptSecret(body.deliveryKey);
    campaign.deliveryLicenseId = deliveryLicense.id;
  }
  if (typeof body.steps === "number") campaign.steps = Math.max(1, Math.min(10, Math.floor(body.steps)));
  if (typeof body.keyDurationHours === "number") campaign.keyDurationHours = Math.max(1, Math.min(24 * 365, Math.floor(body.keyDurationHours)));
  if (typeof body.discordRequired === "boolean") campaign.discordRequired = body.discordRequired;
  if (typeof body.tierId === "number") campaign.tierId = Math.max(1, Math.min(4, Math.floor(body.tierId)));
  if (typeof body.themeId === "number") campaign.themeId = Math.max(1, Math.min(5, Math.floor(body.themeId)));
  if (typeof body.thumbnailUrl === "string") campaign.thumbnailUrl = body.thumbnailUrl || null;
  if (typeof body.maxUsers === "number") campaign.maxUsers = Math.max(1, Math.floor(body.maxUsers));
  if (typeof body.maxDevices === "number") campaign.maxDevices = Math.max(1, Math.floor(body.maxDevices));
  if (typeof body.maxRedemptions === "number") campaign.maxRedemptions = Math.max(1, Math.floor(body.maxRedemptions));
  if (typeof body.ticketTtlMinutes === "number") campaign.ticketTtlMinutes = Math.max(5, Math.floor(body.ticketTtlMinutes));
  if ("licenseExpiresAt" in body) campaign.licenseExpiresAt = body.licenseExpiresAt ? new Date(body.licenseExpiresAt).toISOString() : null;
  campaign.updatedAt = new Date().toISOString();

  await saveClaimCampaign(campaign);
  return NextResponse.json({ campaign });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await deleteClaimCampaign(id);
  return NextResponse.json({ ok: true });
}
