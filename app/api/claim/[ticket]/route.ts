import { NextRequest, NextResponse } from "next/server";
import { createClaimSignature, hashKey, parseClaimToken } from "@/lib/crypto";
import { getClaimCampaign, getClaimTicket } from "@/lib/store";
import { ticketStatus } from "@/lib/claims";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ ticket: string }> }) {
  const { ticket: rawTicket } = await context.params;
  const token = decodeURIComponent(rawTicket || "");
  const parsed = parseClaimToken(token);
  if (!parsed) return NextResponse.json({ error: "Invalid claim link" }, { status: 404 });

  const ticket = await getClaimTicket(parsed.ticketId);
  if (!ticket || ticket.tokenHash !== hashKey(token)) {
    return NextResponse.json({ error: "Invalid claim link" }, { status: 404 });
  }

  const campaign = await getClaimCampaign(ticket.campaignId);
  if (!campaign) return NextResponse.json({ error: "Claim link is unavailable" }, { status: 404 });

  const expected = createClaimSignature(ticket.id, ticket.campaignId, ticket.expiresAt, ticket.maxRedemptions);
  if (expected !== parsed.signature || expected !== ticket.signature) {
    return NextResponse.json({ error: "Claim signature failed" }, { status: 403 });
  }

  return NextResponse.json({
    claim: {
      name: campaign.name,
      provider: campaign.provider,
      active: campaign.active,
      status: campaign.active ? ticketStatus(ticket) : "disabled",
      expiresAt: ticket.expiresAt,
      remaining: Math.max(0, ticket.maxRedemptions - ticket.redeemedCount),
    },
  });
}
