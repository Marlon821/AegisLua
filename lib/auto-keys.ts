import { AutoKeyIntervalUnit, AutoKeyRule, LicenseRecord } from "./types";
import { createId, createPlainKey, encryptSecret, hashKey } from "./crypto";

export function nextRunFrom(start: Date, count: number, unit: AutoKeyIntervalUnit) {
  const next = new Date(start);
  if (unit === "days") next.setDate(next.getDate() + count);
  if (unit === "weeks") next.setDate(next.getDate() + count * 7);
  if (unit === "months") next.setMonth(next.getMonth() + count);
  return next.toISOString();
}

export function createLicenseFromRule(rule: AutoKeyRule) {
  const now = new Date();
  const plainKey = createPlainKey();
  const expiresAt = rule.keyExpiresInDays
    ? new Date(now.getTime() + rule.keyExpiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const license: LicenseRecord = {
    id: createId(),
    keyHash: hashKey(plainKey),
    keyEncrypted: encryptSecret(plainKey),
    label: `${rule.labelPrefix} ${now.toLocaleDateString("en-US")}`,
    active: true,
    scriptIds: rule.scriptIds,
    maxUsers: rule.maxUsers,
    users: [],
    maxDevices: rule.maxDevices,
    devices: [],
    expiresAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastUsedAt: null,
    lastUsername: null,
  };
  return { plainKey, license };
}
