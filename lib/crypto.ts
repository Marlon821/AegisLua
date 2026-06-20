import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";

export function createPlainKey() {
  return `AEGIS-${randomBytes(18).toString("base64url").toUpperCase()}`;
}

export function hashKey(key: string) {
  return createHash("sha256").update(key.trim()).digest("hex");
}

export function hashDeviceId(deviceId: string) {
  const salt = process.env.DEVICE_HASH_SALT || "dev-device-salt-change-me";
  return createHash("sha256").update(`${salt}:${deviceId.trim()}`).digest("hex");
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function createId() {
  return randomUUID();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [method, salt, hash] = storedHash.split("$");
  if (method !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function claimSecret() {
  return process.env.CLAIM_SECRET || process.env.DEVICE_HASH_SALT || "dev-claim-secret-change-me";
}

function encryptionKey() {
  return createHash("sha256").update(claimSecret()).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptSecret(value: string) {
  const [ivRaw, tagRaw, ciphertextRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !ciphertextRaw) throw new Error("Invalid encrypted secret");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextRaw, "base64url")), decipher.final()]);
  return plaintext.toString("utf8");
}

export function createClaimSignature(ticketId: string, campaignId: string, expiresAt: string, maxRedemptions: number) {
  return createHmac("sha256", claimSecret())
    .update(`${ticketId}:${campaignId}:${expiresAt}:${maxRedemptions}`)
    .digest("base64url");
}

export function createClaimToken(ticketId: string, signature: string) {
  return `agt_${ticketId}_${signature}`;
}

export function parseClaimToken(token: string) {
  const [prefix, ticketId, signature] = token.trim().split("_");
  if (prefix !== "agt" || !ticketId || !signature) return null;
  return { ticketId, signature };
}
