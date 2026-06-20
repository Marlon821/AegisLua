const CONTENT_LOCKER_URL = "https://creators.lootlabs.gg/api/public/content_locker";

export type LootLabsCreateInput = {
  apiKey: string;
  title: string;
  destinationUrl: string;
  tierId: number;
  numberOfTasks: number;
  themeId: number;
  thumbnailUrl?: string | null;
};

export async function createLootLabsLink(input: LootLabsCreateInput) {
  const response = await fetch(CONTENT_LOCKER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title.slice(0, 30) || "AegisLua",
      url: input.destinationUrl,
      tier_id: input.tierId,
      number_of_tasks: input.numberOfTasks,
      theme: input.themeId,
      ...(input.thumbnailUrl ? { thumbnail: input.thumbnailUrl } : {}),
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.type === "error") {
    throw new Error(typeof payload.message === "string" ? payload.message : "LootLabs link creation failed");
  }

  const lootUrl = payload?.message?.loot_url;
  if (typeof lootUrl !== "string" || !lootUrl) {
    throw new Error("LootLabs did not return a loot_url");
  }

  return lootUrl;
}
