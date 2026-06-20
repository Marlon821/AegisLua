import { ClaimCampaign, ClaimTicket } from "./types";
import { createClaimSignature, createClaimToken, createId, hashKey } from "./crypto";

export function createTicketForCampaign(campaign: ClaimCampaign): { ticket: ClaimTicket; token: string } {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + campaign.ticketTtlMinutes * 60 * 1000).toISOString();
  const id = createId();
  const signature = createClaimSignature(id, campaign.id, expiresAt, campaign.maxRedemptions);
  const token = createClaimToken(id, signature);

  return {
    token,
    ticket: {
      id,
      campaignId: campaign.id,
      tokenHash: hashKey(token),
      signature,
      expiresAt,
      maxRedemptions: campaign.maxRedemptions,
      redeemedCount: 0,
      monetizedUrl: null,
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function publicClaimUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, "")}/claim/${encodeURIComponent(token)}`;
}

export function claimTicketUrl(origin: string, ticket: ClaimTicket) {
  return publicClaimUrl(origin, createClaimToken(ticket.id, ticket.signature));
}

export function ticketStatus(ticket: ClaimTicket) {
  if (Date.now() > new Date(ticket.expiresAt).getTime()) return "expired";
  if (ticket.redeemedCount >= ticket.maxRedemptions) return "redeemed";
  return "available";
}
