export type ScriptProject = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sourceEncrypted: string | null;
  sourceBytes: number;
  protectedAt: string | null;
  active: boolean;
  requireDeviceId: boolean;
  allowMissingDeviceId: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BoundDevice = {
  hash: string;
  userId: string;
  username: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  status: "active" | "blocked";
};

export type LicenseRecord = {
  id: string;
  keyHash: string;
  label: string;
  active: boolean;
  scriptIds: string[];
  maxUsers: number;
  users: string[];
  maxDevices: number;
  devices: BoundDevice[];
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  lastUsername: string | null;
};

export type AuthLog = {
  id: string;
  scriptId: string | null;
  licenseId: string | null;
  userId: string;
  username: string;
  placeId: string | null;
  deviceHash: string | null;
  ok: boolean;
  reason: string;
  createdAt: string;
};

export type ClaimProvider = "lootlabs";

export type ClaimCampaign = {
  id: string;
  name: string;
  provider: ClaimProvider;
  active: boolean;
  scriptIds: string[];
  labelPrefix: string;
  apiKeyHash: string | null;
  apiKeyEncrypted: string | null;
  deliveryKeyHash: string | null;
  deliveryKeyEncrypted: string | null;
  deliveryLicenseId: string | null;
  steps: number;
  keyDurationHours: number;
  discordRequired: boolean;
  maxUsers: number;
  maxDevices: number;
  licenseExpiresAt: string | null;
  ticketTtlMinutes: number;
  maxRedemptions: number;
  tierId: number;
  themeId: number;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClaimTicket = {
  id: string;
  campaignId: string;
  tokenHash: string;
  signature: string;
  expiresAt: string;
  maxRedemptions: number;
  redeemedCount: number;
  monetizedUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClaimRedemption = {
  id: string;
  campaignId: string | null;
  ticketId: string | null;
  licenseId: string | null;
  ok: boolean;
  reason: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AutoKeyIntervalUnit = "days" | "weeks" | "months";

export type AutoKeyRule = {
  id: string;
  name: string;
  active: boolean;
  scriptIds: string[];
  labelPrefix: string;
  intervalCount: number;
  intervalUnit: AutoKeyIntervalUnit;
  maxUsers: number;
  maxDevices: number;
  keyExpiresInDays: number | null;
  lastGeneratedAt: string | null;
  nextRunAt: string;
  currentLicenseId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserAccount = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "customer";
  plan?: "free" | "pro" | "enterprise";
  subscriptionStatus?: "free" | "trialing" | "active" | "past_due" | "canceled";
  subscriptionRenewsAt?: string | null;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type SessionRecord = {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

export type PasswordResetRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};
