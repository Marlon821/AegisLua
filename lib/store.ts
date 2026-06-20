import {
  AuthLog,
  AutoKeyRule,
  ClaimCampaign,
  ClaimRedemption,
  ClaimTicket,
  LicenseRecord,
  PasswordResetRecord,
  ScriptProject,
  SessionRecord,
  UserAccount,
} from "./types";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const SCRIPT_INDEX = "luaauth:scripts:index";
const SCRIPT_PREFIX = "luaauth:scripts:";
const LICENSE_INDEX = "luaauth:licenses:index";
const LICENSE_PREFIX = "luaauth:licenses:";
const LOG_INDEX = "luaauth:auth:logs";
const CLAIM_CAMPAIGN_INDEX = "luaauth:claims:campaigns:index";
const CLAIM_CAMPAIGN_PREFIX = "luaauth:claims:campaigns:";
const CLAIM_TICKET_INDEX = "luaauth:claims:tickets:index";
const CLAIM_TICKET_PREFIX = "luaauth:claims:tickets:";
const CLAIM_REDEMPTION_INDEX = "luaauth:claims:redemptions";
const AUTO_KEY_INDEX = "luaauth:auto-keys:index";
const AUTO_KEY_PREFIX = "luaauth:auto-keys:";
const USER_INDEX = "luaauth:users:index";
const USER_PREFIX = "luaauth:users:";
const SESSION_PREFIX = "luaauth:sessions:";
const PASSWORD_RESET_PREFIX = "luaauth:password-resets:";

type LocalStore = {
  values: Record<string, string>;
  sets: Record<string, string[]>;
  lists: Record<string, string[]>;
};

const LOCAL_STORE_PATH = path.join(process.cwd(), ".data", "local-store.json");

async function readLocalStore(): Promise<LocalStore> {
  try {
    const raw = await readFile(LOCAL_STORE_PATH, "utf8");
    return JSON.parse(raw) as LocalStore;
  } catch {
    return { values: {}, sets: {}, lists: {} };
  }
}

async function writeLocalStore(store: LocalStore) {
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function localCommand<T>(command: unknown[]): Promise<T> {
  const [operation, key, ...args] = command.map(String);
  const store = await readLocalStore();

  if (operation === "GET") return (store.values[key] ?? null) as T;
  if (operation === "SET") {
    store.values[key] = args[0] || "";
    await writeLocalStore(store);
    return "OK" as T;
  }
  if (operation === "DEL") {
    delete store.values[key];
    delete store.sets[key];
    delete store.lists[key];
    await writeLocalStore(store);
    return 1 as T;
  }
  if (operation === "SADD") {
    const set = new Set(store.sets[key] || []);
    set.add(args[0]);
    store.sets[key] = Array.from(set);
    await writeLocalStore(store);
    return 1 as T;
  }
  if (operation === "SREM") {
    store.sets[key] = (store.sets[key] || []).filter((item) => item !== args[0]);
    await writeLocalStore(store);
    return 1 as T;
  }
  if (operation === "SMEMBERS") return (store.sets[key] || []) as T;
  if (operation === "LPUSH") {
    store.lists[key] = [args[0], ...(store.lists[key] || [])];
    await writeLocalStore(store);
    return store.lists[key].length as T;
  }
  if (operation === "LTRIM") {
    const start = Number(args[0]);
    const stop = Number(args[1]);
    store.lists[key] = (store.lists[key] || []).slice(start, stop + 1);
    await writeLocalStore(store);
    return "OK" as T;
  }
  if (operation === "LRANGE") {
    const start = Number(args[0]);
    const stop = Number(args[1]);
    return (store.lists[key] || []).slice(start, stop + 1) as T;
  }

  throw new Error(`Unsupported local KV command: ${operation}`);
}

async function redisCommand<T>(command: unknown[]): Promise<T> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const localFallbackEnabled = process.env.LOCAL_KV_FALLBACK === "true";

  if (!url || !token) {
    if (process.env.NODE_ENV !== "production" || localFallbackEnabled) {
      return localCommand<T>(command);
    }
    throw new Error("Missing KV_REST_API_URL or KV_REST_API_TOKEN. For local production testing, set LOCAL_KV_FALLBACK=true.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`KV command failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as { result: T };
  return payload.result;
}

async function listByIndex<T>(indexKey: string, prefix: string): Promise<T[]> {
  const ids = await redisCommand<string[]>(["SMEMBERS", indexKey]);
  const records: Array<T | null> = await Promise.all(
    ids.map(async (id) => {
      const raw = await redisCommand<string | null>(["GET", `${prefix}${id}`]);
      return raw ? (JSON.parse(raw) as T) : null;
    }),
  );
  return records.filter((record): record is T => record !== null);
}

export async function saveScript(record: ScriptProject) {
  await redisCommand(["SET", `${SCRIPT_PREFIX}${record.id}`, JSON.stringify(record)]);
  await redisCommand(["SADD", SCRIPT_INDEX, record.id]);
}

export async function getScript(id: string) {
  const raw = await redisCommand<string | null>(["GET", `${SCRIPT_PREFIX}${id}`]);
  return raw ? (JSON.parse(raw) as ScriptProject) : null;
}

export async function listScripts() {
  return listByIndex<ScriptProject>(SCRIPT_INDEX, SCRIPT_PREFIX);
}

export async function deleteScript(id: string) {
  await redisCommand(["DEL", `${SCRIPT_PREFIX}${id}`]);
  await redisCommand(["SREM", SCRIPT_INDEX, id]);
}

export async function saveLicense(record: LicenseRecord) {
  await redisCommand(["SET", `${LICENSE_PREFIX}${record.id}`, JSON.stringify(record)]);
  await redisCommand(["SADD", LICENSE_INDEX, record.id]);
}

export async function getLicense(id: string) {
  const raw = await redisCommand<string | null>(["GET", `${LICENSE_PREFIX}${id}`]);
  return raw ? (JSON.parse(raw) as LicenseRecord) : null;
}

export async function listLicenses() {
  return listByIndex<LicenseRecord>(LICENSE_INDEX, LICENSE_PREFIX);
}

export async function findLicenseByHash(keyHash: string) {
  const records = await listLicenses();
  return records.find((record) => record.keyHash === keyHash) || null;
}

export async function deleteLicense(id: string) {
  await redisCommand(["DEL", `${LICENSE_PREFIX}${id}`]);
  await redisCommand(["SREM", LICENSE_INDEX, id]);
}

export async function appendLog(log: AuthLog) {
  await redisCommand(["LPUSH", LOG_INDEX, JSON.stringify(log)]);
  await redisCommand(["LTRIM", LOG_INDEX, 0, 499]);
}

export async function listLogs() {
  const rows = await redisCommand<string[]>(["LRANGE", LOG_INDEX, 0, 149]);
  return rows.map((row) => JSON.parse(row) as AuthLog);
}

export async function saveClaimCampaign(record: ClaimCampaign) {
  await redisCommand(["SET", `${CLAIM_CAMPAIGN_PREFIX}${record.id}`, JSON.stringify(record)]);
  await redisCommand(["SADD", CLAIM_CAMPAIGN_INDEX, record.id]);
}

export async function getClaimCampaign(id: string) {
  const raw = await redisCommand<string | null>(["GET", `${CLAIM_CAMPAIGN_PREFIX}${id}`]);
  return raw ? (JSON.parse(raw) as ClaimCampaign) : null;
}

export async function listClaimCampaigns() {
  return listByIndex<ClaimCampaign>(CLAIM_CAMPAIGN_INDEX, CLAIM_CAMPAIGN_PREFIX);
}

export async function deleteClaimCampaign(id: string) {
  await redisCommand(["DEL", `${CLAIM_CAMPAIGN_PREFIX}${id}`]);
  await redisCommand(["SREM", CLAIM_CAMPAIGN_INDEX, id]);
}

export async function saveClaimTicket(record: ClaimTicket) {
  await redisCommand(["SET", `${CLAIM_TICKET_PREFIX}${record.id}`, JSON.stringify(record)]);
  await redisCommand(["SADD", CLAIM_TICKET_INDEX, record.id]);
}

export async function getClaimTicket(id: string) {
  const raw = await redisCommand<string | null>(["GET", `${CLAIM_TICKET_PREFIX}${id}`]);
  return raw ? (JSON.parse(raw) as ClaimTicket) : null;
}

export async function listClaimTickets() {
  return listByIndex<ClaimTicket>(CLAIM_TICKET_INDEX, CLAIM_TICKET_PREFIX);
}

export async function appendClaimRedemption(record: ClaimRedemption) {
  await redisCommand(["LPUSH", CLAIM_REDEMPTION_INDEX, JSON.stringify(record)]);
  await redisCommand(["LTRIM", CLAIM_REDEMPTION_INDEX, 0, 499]);
}

export async function listClaimRedemptions() {
  const rows = await redisCommand<string[]>(["LRANGE", CLAIM_REDEMPTION_INDEX, 0, 149]);
  return rows.map((row) => JSON.parse(row) as ClaimRedemption);
}

export async function saveAutoKeyRule(record: AutoKeyRule) {
  await redisCommand(["SET", `${AUTO_KEY_PREFIX}${record.id}`, JSON.stringify(record)]);
  await redisCommand(["SADD", AUTO_KEY_INDEX, record.id]);
}

export async function getAutoKeyRule(id: string) {
  const raw = await redisCommand<string | null>(["GET", `${AUTO_KEY_PREFIX}${id}`]);
  return raw ? (JSON.parse(raw) as AutoKeyRule) : null;
}

export async function listAutoKeyRules() {
  return listByIndex<AutoKeyRule>(AUTO_KEY_INDEX, AUTO_KEY_PREFIX);
}

export async function deleteAutoKeyRule(id: string) {
  await redisCommand(["DEL", `${AUTO_KEY_PREFIX}${id}`]);
  await redisCommand(["SREM", AUTO_KEY_INDEX, id]);
}

export async function saveUser(record: UserAccount) {
  await redisCommand(["SET", `${USER_PREFIX}${record.id}`, JSON.stringify(record)]);
  await redisCommand(["SADD", USER_INDEX, record.id]);
}

export async function getUser(id: string) {
  const raw = await redisCommand<string | null>(["GET", `${USER_PREFIX}${id}`]);
  return raw ? (JSON.parse(raw) as UserAccount) : null;
}

export async function deleteUser(id: string) {
  await redisCommand(["DEL", `${USER_PREFIX}${id}`]);
  await redisCommand(["SREM", USER_INDEX, id]);
}

export async function listUsers() {
  return listByIndex<UserAccount>(USER_INDEX, USER_PREFIX);
}

export async function findUserByEmail(email: string) {
  const users = await listUsers();
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function saveSession(record: SessionRecord) {
  const ttlSeconds = Math.max(1, Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000));
  await redisCommand(["SET", `${SESSION_PREFIX}${record.id}`, JSON.stringify(record), "EX", ttlSeconds]);
}

export async function getSession(id: string) {
  const raw = await redisCommand<string | null>(["GET", `${SESSION_PREFIX}${id}`]);
  return raw ? (JSON.parse(raw) as SessionRecord) : null;
}

export async function deleteSession(id: string) {
  await redisCommand(["DEL", `${SESSION_PREFIX}${id}`]);
}

export async function savePasswordReset(record: PasswordResetRecord) {
  const ttlSeconds = Math.max(1, Math.floor((new Date(record.expiresAt).getTime() - Date.now()) / 1000));
  await redisCommand(["SET", `${PASSWORD_RESET_PREFIX}${record.id}`, JSON.stringify(record), "EX", ttlSeconds]);
}

export async function getPasswordReset(id: string) {
  const raw = await redisCommand<string | null>(["GET", `${PASSWORD_RESET_PREFIX}${id}`]);
  return raw ? (JSON.parse(raw) as PasswordResetRecord) : null;
}
