"use client";

import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Code2,
  Copy,
  Crown,
  Eye,
  EyeOff,
  FileCode2,
  KeyRound,
  Link2,
  Megaphone,
  Plus,
  Power,
  Search,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
  Wand2,
} from "lucide-react";
import { Badge, EmptyState, Field, MiniBarChart, Panel, ScrollArea, StatCard, Tabs, dashboardTheme } from "@/components/dashboard/ui";
import { InteractiveShell, Reveal } from "@/components/motion";

type AppUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "customer";
  plan?: "free" | "pro" | "enterprise";
  subscriptionStatus?: "free" | "trialing" | "active" | "past_due" | "canceled";
};
type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "customer";
  plan: "free" | "pro" | "enterprise";
  subscriptionStatus: "free" | "trialing" | "active" | "past_due" | "canceled";
  subscriptionRenewsAt: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};
type ScriptProject = { id: string; ownerId?: string | null; name: string; slug: string; active: boolean; requireDeviceId: boolean; sourceBytes?: number; protectedAt?: string | null };
type Device = { hash: string; userId: string; username: string | null; status: "active" | "blocked" };
type License = {
  id: string;
  ownerId?: string | null;
  label: string;
  active: boolean;
  hasStoredKey?: boolean;
  scriptIds: string[];
  maxUsers: number;
  users: string[];
  maxDevices: number;
  devices: Device[];
  expiresAt: string | null;
  lastUsername: string | null;
};
type AuthLog = {
  id: string;
  scriptId: string | null;
  userId: string;
  username: string;
  ok: boolean;
  reason: string;
  createdAt: string;
};
type ClaimCampaign = {
  id: string;
  name: string;
  provider: "lootlabs";
  active: boolean;
  scriptIds: string[];
  labelPrefix: string;
  apiKeyHash?: string | null;
  deliveryKeyHash?: string | null;
  deliveryLicenseId?: string | null;
  steps?: number;
  keyDurationHours?: number;
  discordRequired?: boolean;
  maxUsers: number;
  maxDevices: number;
  licenseExpiresAt: string | null;
  ticketTtlMinutes: number;
  maxRedemptions: number;
  tierId?: number;
  themeId?: number;
  thumbnailUrl?: string | null;
};
type ClaimTicket = { id: string; campaignId: string; expiresAt: string; maxRedemptions: number; redeemedCount: number; createdAt: string; claimUrl: string; monetizedUrl?: string | null };
type ClaimRedemption = { id: string; campaignId: string | null; ticketId: string | null; licenseId: string | null; ok: boolean; reason: string; createdAt: string };
type AutoKeyRule = {
  id: string;
  name: string;
  active: boolean;
  scriptIds: string[];
  labelPrefix: string;
  intervalCount: number;
  intervalUnit: "days" | "weeks" | "months";
  maxUsers: number;
  maxDevices: number;
  keyExpiresInDays: number | null;
  lastGeneratedAt: string | null;
  nextRunAt: string;
  currentLicenseId: string | null;
};

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "scripts", label: "Scripts", icon: FileCode2 },
  { id: "keys", label: "Keys", icon: KeyRound },
  { id: "auto", label: "Auto Keys", icon: Wand2, premium: true },
  { id: "deployment", label: "Ad Systems", icon: Megaphone, premium: true },
  { id: "logs", label: "Logs", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "owner", label: "Owner", icon: Users, ownerOnly: true },
  { id: "api", label: "Advanced", icon: Code2, premium: true },
];

const tabMeta: Record<string, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: "Command center",
    title: "Overview",
    description: "A quick read on executions, keys, claims, revenue estimates, and recent growth.",
  },
  scripts: {
    eyebrow: "Protection",
    title: "Scripts",
    description: "Upload Lua files, create protected loaders, and manage each script's public loadstring.",
  },
  keys: {
    eyebrow: "Access",
    title: "Keys",
    description: "Create, reveal, disable, and remove long-term keys attached to your protected scripts.",
  },
  auto: {
    eyebrow: "Automation",
    title: "Auto Keys",
    description: "Create rotating public keys for ad flows, communities, and short-term access.",
  },
  deployment: {
    eyebrow: "Monetization",
    title: "Ad Systems",
    description: "Connect existing keys to LootLabs claim links and track claim URLs.",
  },
  logs: {
    eyebrow: "Monitoring",
    title: "Logs",
    description: "Inspect script executions, claim redemptions, and recently seen players.",
  },
  settings: {
    eyebrow: "Workspace",
    title: "Settings",
    description: "Manage your account, session, and deletion controls from one quiet place.",
  },
  owner: {
    eyebrow: "Owner tools",
    title: "Owner Console",
    description: "Manage accounts, subscriptions, and review every script and key across the site.",
  },
  api: {
    eyebrow: "Developer mode",
    title: "Advanced",
    description: "Optional low-level API details for custom integrations.",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<AppUser | null>(null);
  const [scripts, setScripts] = useState<ScriptProject[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [campaigns, setCampaigns] = useState<ClaimCampaign[]>([]);
  const [tickets, setTickets] = useState<ClaimTicket[]>([]);
  const [redemptions, setRedemptions] = useState<ClaimRedemption[]>([]);
  const [autoRules, setAutoRules] = useState<AutoKeyRule[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [scriptName, setScriptName] = useState("");
  const [scriptSource, setScriptSource] = useState("");
  const [scriptFileName, setScriptFileName] = useState("");
  const [newLoaderSnippet, setNewLoaderSnippet] = useState("");
  const [licenseLabel, setLicenseLabel] = useState("");
  const [selectedScriptIds, setSelectedScriptIds] = useState<string[]>([]);
  const [claimScriptIds, setClaimScriptIds] = useState<string[]>([]);
  const [maxUsers, setMaxUsers] = useState(1);
  const [maxDevices, setMaxDevices] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newAutoKey, setNewAutoKey] = useState("");
  const [newClaimUrl, setNewClaimUrl] = useState("");

  const [claimName, setClaimName] = useState("");
  const [claimProvider] = useState<ClaimCampaign["provider"]>("lootlabs");
  const [claimApiKey, setClaimApiKey] = useState("");
  const [claimDeliveryKey, setClaimDeliveryKey] = useState("");
  const [claimSteps, setClaimSteps] = useState(3);
  const [claimTierId, setClaimTierId] = useState(3);
  const [claimThemeId, setClaimThemeId] = useState(1);
  const [claimThumbnailUrl, setClaimThumbnailUrl] = useState("");
  const [claimDiscordRequired, setClaimDiscordRequired] = useState(false);
  const [claimTtl, setClaimTtl] = useState(60);
  const [claimMaxRedemptions, setClaimMaxRedemptions] = useState(1);

  const [autoName, setAutoName] = useState("");
  const [autoScriptIds, setAutoScriptIds] = useState<string[]>([]);
  const [autoIntervalCount, setAutoIntervalCount] = useState(1);
  const [autoIntervalUnit, setAutoIntervalUnit] = useState<"days" | "weeks" | "months">("weeks");
  const [autoExpiresInDays, setAutoExpiresInDays] = useState(7);

  const revenuePerClaim = 0.015;
  const allowedLogs = logs.filter((log) => log.ok);
  const uniquePlayers = new Set(allowedLogs.map((log) => log.userId || log.username).filter(Boolean)).size;
  const keysGenerated = licenses.length;
  const completedClaims = redemptions.filter((redemption) => redemption.ok).length;
  const estimatedRevenue = completedClaims * revenuePerClaim;
  const boundDevices = licenses.reduce((sum, license) => sum + license.devices.length, 0);

  const executionsChart = useMemo(() => makeDailyPoints(logs.filter((log) => log.ok).map((log) => log.createdAt)), [logs]);
  const claimsChart = useMemo(() => makeDailyPoints(redemptions.filter((redemption) => redemption.ok).map((redemption) => redemption.createdAt)), [redemptions]);
  const keyChart = useMemo(() => makeDailyPoints(licenses.map((license) => license.expiresAt || new Date().toISOString())), [licenses]);
  const revenueChart = useMemo(() => claimsChart.map((point) => ({ ...point, value: Number((point.value * revenuePerClaim).toFixed(3)) })), [claimsChart]);

  async function loadAccount() {
    const response = await fetch("/api/account/me", { cache: "no-store" });
    if (!response.ok) {
      router.push("/login");
      return;
    }
    const payload = await response.json();
    setUser(payload.user);
  }

  async function loadData() {
    setError("");
    const canUsePremium = user?.role === "owner" || user?.role === "admin" || user?.plan === "pro" || user?.plan === "enterprise";
    const [scriptsResponse, licensesResponse, logsResponse, claimsResponse, autoResponse, usersResponse] = await Promise.all([
      fetch("/api/admin/scripts", { cache: "no-store" }),
      fetch("/api/admin/licenses", { cache: "no-store" }),
      fetch("/api/admin/logs", { cache: "no-store" }),
      canUsePremium ? fetch("/api/admin/claims", { cache: "no-store" }) : Promise.resolve(null),
      canUsePremium ? fetch("/api/admin/auto-keys", { cache: "no-store" }) : Promise.resolve(null),
      user?.role === "owner" ? fetch("/api/admin/users", { cache: "no-store" }) : Promise.resolve(null),
    ]);

    if (!scriptsResponse.ok || !licensesResponse.ok || !logsResponse.ok || (claimsResponse && !claimsResponse.ok) || (autoResponse && !autoResponse.ok)) {
      setError("Your account could not load dashboard data or the backend environment is not configured.");
      return;
    }

    setScripts((await scriptsResponse.json()).scripts || []);
    setLicenses((await licensesResponse.json()).licenses || []);
    setLogs((await logsResponse.json()).logs || []);
    const claimsPayload = claimsResponse ? await claimsResponse.json() : {};
    setCampaigns(claimsPayload.campaigns || []);
    setTickets(claimsPayload.tickets || []);
    setRedemptions(claimsPayload.redemptions || []);
    setAutoRules(autoResponse ? (await autoResponse.json()).rules || [] : []);
    if (usersResponse?.ok) setManagedUsers((await usersResponse.json()).users || []);
  }

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function logout() {
    await fetch("/api/account/logout", { method: "POST" });
    router.push("/");
  }

  async function deleteOwnAccount() {
    const confirmed = window.confirm("Delete your AegisLua account and all account access? This cannot be undone.");
    if (!confirmed) return;
    setError("");
    setNotice("");
    const response = await fetch("/api/account/me", { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Could not delete your account.");
      return;
    }
    router.push("/");
  }

  async function createScript(event: FormEvent) {
    event.preventDefault();
    if (!scriptName.trim()) {
      setError("Give the script a name first.");
      return;
    }
    if (!scriptSource.trim()) {
      setError("Choose the Lua or Luau file you want AegisLua to protect.");
      return;
    }
    const slug = slugifyClient(scriptName);
    setNewLoaderSnippet("");
    const payload = await mutate("/api/admin/scripts", {
      name: scriptName,
      slug,
      sourceCode: scriptSource,
      requireDeviceId: true,
    }, `Protected loader created for "${slug}". Users will see the AegisLua key prompt before the script runs.`);
    if (payload?.loaderSnippet) setNewLoaderSnippet(payload.loaderSnippet);
    setScriptSource("");
    setScriptFileName("");
  }

  async function createLicense(event: FormEvent) {
    event.preventDefault();
    if (!licenseLabel.trim()) {
      setError("Give this key a label first.");
      return;
    }
    if (selectedScriptIds.length === 0) {
      setError("Choose at least one script for this key.");
      return;
    }
    setNewKey("");
    const payload = await mutate("/api/admin/licenses", {
      label: licenseLabel,
      scriptIds: selectedScriptIds,
      maxUsers,
      maxDevices,
      expiresAt: expiresAt || null,
    }, "Long term key generated.");
    if (payload?.key) setNewKey(payload.key);
  }

  async function createAdSystem(event: FormEvent) {
    event.preventDefault();
    if (!claimName.trim()) {
      setError("Name this ad system first.");
      return;
    }
    if (claimScriptIds.length === 0) {
      setError("Choose the script this ad system should unlock.");
      return;
    }
    if (!claimDeliveryKey.trim()) {
      setError("Paste the existing key this ad system should deliver.");
      return;
    }
    setNewClaimUrl("");
    const payload = await mutate("/api/admin/claims", {
      name: claimName,
      provider: claimProvider,
      scriptIds: claimScriptIds,
      labelPrefix: `${claimName} key`,
      apiKey: claimApiKey || null,
      deliveryKey: claimDeliveryKey,
      steps: claimSteps,
      tierId: claimTierId,
      themeId: claimThemeId,
      thumbnailUrl: claimThumbnailUrl || null,
      discordRequired: claimDiscordRequired,
      maxUsers: 1000000,
      maxDevices: 1000000,
      ticketTtlMinutes: claimTtl,
      maxRedemptions: claimMaxRedemptions,
      licenseExpiresAt: expiresAt || null,
    }, "Ad system created.");
    if (payload?.monetizedUrl || payload?.claimUrl) setNewClaimUrl(payload.monetizedUrl || payload.claimUrl);
    if (payload?.warning) setNotice(`Ad system created, but LootLabs returned: ${payload.warning}. The fallback AegisLua URL is shown.`);
    setClaimApiKey("");
    setClaimDeliveryKey("");
  }

  async function createAutoRule(event: FormEvent) {
    event.preventDefault();
    if (!autoName.trim()) {
      setError("Name this auto key rule first.");
      return;
    }
    if (autoScriptIds.length === 0) {
      setError("Choose the script that should receive rotating keys.");
      return;
    }
    await mutate("/api/admin/auto-keys", {
      name: autoName,
      scriptIds: autoScriptIds,
      labelPrefix: autoName,
      intervalCount: autoIntervalCount,
      intervalUnit: autoIntervalUnit,
      maxUsers: 1000000,
      maxDevices: 1000000,
      keyExpiresInDays: autoExpiresInDays || null,
    }, "Auto key rule created.");
  }

  async function mutate(url: string, body: Record<string, unknown>, success: string) {
    setError("");
    setNotice("");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Request failed.");
      return null;
    }
    setNotice(success);
    await loadData();
    return payload;
  }

  async function patch(url: string, body: Record<string, unknown>, success: string) {
    setError("");
    setNotice("");
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Request failed.");
      return null;
    }
    setNotice(success);
    await loadData();
    return payload;
  }

  async function remove(url: string, success: string) {
    setError("");
    setNotice("");
    const response = await fetch(url, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Delete failed.");
      return;
    }
    setNotice(success);
    await loadData();
  }

  function scriptNames(scriptIds: string[]) {
    return scriptIds.map((id) => scripts.find((script) => script.id === id)?.name || id).join(", ");
  }

  function copy(value: string) {
    navigator.clipboard?.writeText(value).catch(() => undefined);
    setNotice("Copied to clipboard.");
  }

  if (!user) return <main className="grid min-h-screen place-items-center text-slate-300">Loading AegisLua...</main>;

  const canUsePremium = user.role === "owner" || user.role === "admin" || user.plan === "pro" || user.plan === "enterprise";
  const visibleTabs = tabs
    .filter((tab) => !tab.ownerOnly || user.role === "owner")
    .map((tab) => ({ ...tab, locked: Boolean(tab.premium && !canUsePremium) }));
  const currentTab = tabMeta[activeTab] || tabMeta.overview;
  const activeTabIsLocked = Boolean(tabs.find((tab) => tab.id === activeTab)?.premium && !canUsePremium);

  return (
    <InteractiveShell className={`${dashboardTheme.page} h-screen overflow-hidden md:grid md:grid-cols-[224px_1fr]`}>
      <aside className={`${dashboardTheme.sidebar} hidden min-h-0 md:flex md:flex-col`}>
        <Link className="mb-4 flex h-11 items-center gap-2 border-b border-white/[0.08] pb-3" href="/">
          <Shield className="text-[#e5183a]" size={17} />
          <strong className="brand-word text-sm text-white">AEGISLUA</strong>
        </Link>
        <Tabs tabs={visibleTabs} active={activeTab} onChange={setActiveTab} />
        <div className="mt-auto rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-white/25">Session</span>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e5183a] text-xs font-bold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-white">{user.name}</p>
              <p className="truncate text-xs text-white/30">{user.plan || "free"} plan</p>
            </div>
          </div>
          <button className={`${dashboardTheme.ghostButton} mt-3 flex w-full items-center justify-center gap-2`} onClick={logout} type="button">
            <Power size={14} />
            Logout
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-col overflow-hidden">
        <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#050508]/55 px-4 backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <p className="hidden font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#e5183a] sm:block">{currentTab.eyebrow}</p>
            <h1 className="truncate text-lg font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>{currentTab.title}</h1>
          </div>
          <div className="hidden grid-cols-3 gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] p-1.5 lg:grid lg:min-w-[360px]">
            <MiniMetric label="Scripts" value={scripts.length} />
            <MiniMetric label="Keys" value={licenses.length} />
            <MiniMetric label="Ads" value={campaigns.length} />
          </div>
        </header>

        <div className="border-b border-white/[0.08] bg-[#050508]/80 p-3 md:hidden">
          <Tabs tabs={visibleTabs} active={activeTab} onChange={setActiveTab} />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {error ? <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
        {notice ? <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">{notice}</div> : null}

        <Reveal className="tab-motion mx-auto min-w-0 max-w-7xl" key={activeTab}>
          {activeTabIsLocked ? <UpgradeLocked tabTitle={currentTab.title} /> : null}
          {!activeTabIsLocked && activeTab === "overview" ? (
            <Overview
              stats={{ uniquePlayers, keysGenerated, completedClaims, estimatedRevenue, boundDevices }}
              charts={{ executionsChart, claimsChart, keyChart, revenueChart }}
            />
          ) : null}

          {!activeTabIsLocked && activeTab === "scripts" ? (
            <ScriptManagement
            scripts={scripts}
            logs={logs}
            scriptName={scriptName}
            setScriptName={setScriptName}
            scriptSource={scriptSource}
            setScriptSource={setScriptSource}
            scriptFileName={scriptFileName}
            setScriptFileName={setScriptFileName}
            newLoaderSnippet={newLoaderSnippet}
            createScript={createScript}
            copy={copy}
            toggleScript={(script) => patch(`/api/admin/scripts/${script.id}`, { active: !script.active }, script.active ? "Script disabled." : "Script enabled.")}
            deleteScript={(script) => remove(`/api/admin/scripts/${script.id}`, "Script removed.")}
          />
          ) : null}

          {!activeTabIsLocked && activeTab === "keys" ? (
            <KeyManagement
              scripts={scripts}
              licenses={licenses}
              selectedScriptIds={selectedScriptIds}
              setSelectedScriptIds={setSelectedScriptIds}
              licenseLabel={licenseLabel}
              setLicenseLabel={setLicenseLabel}
              maxUsers={maxUsers}
              setMaxUsers={setMaxUsers}
              maxDevices={maxDevices}
              setMaxDevices={setMaxDevices}
              expiresAt={expiresAt}
              setExpiresAt={setExpiresAt}
              createLicense={createLicense}
              newKey={newKey}
            scriptNames={scriptNames}
            copy={copy}
            revealLicenseKey={async (license) => {
              const payload = await patch(`/api/admin/licenses/${license.id}`, { action: "reveal" }, "Key revealed.");
              return typeof payload?.key === "string" ? payload.key : null;
            }}
            toggleLicense={(license) => patch(`/api/admin/licenses/${license.id}`, { active: !license.active }, license.active ? "License revoked." : "License enabled.")}
            deleteLicense={(license) => remove(`/api/admin/licenses/${license.id}`, "License deleted.")}
          />
          ) : null}

          {!activeTabIsLocked && activeTab === "auto" ? (
          <AutoKeyManagement
              scripts={scripts}
              rules={autoRules}
              autoName={autoName}
              setAutoName={setAutoName}
              autoScriptIds={autoScriptIds}
              setAutoScriptIds={setAutoScriptIds}
              autoIntervalCount={autoIntervalCount}
              setAutoIntervalCount={setAutoIntervalCount}
              autoIntervalUnit={autoIntervalUnit}
              setAutoIntervalUnit={setAutoIntervalUnit}
              autoExpiresInDays={autoExpiresInDays}
            setAutoExpiresInDays={setAutoExpiresInDays}
            createAutoRule={createAutoRule}
            newAutoKey={newAutoKey}
            openKeyInventory={() => setActiveTab("keys")}
            scriptNames={scriptNames}
            generateNow={async (rule) => {
              setNewAutoKey("");
              const payload = await patch(`/api/admin/auto-keys/${rule.id}`, { action: "generate" }, "Short-term key generated and added to Key Inventory.");
              if (payload?.key) setNewAutoKey(payload.key);
            }}
              toggleRule={(rule) => patch(`/api/admin/auto-keys/${rule.id}`, { active: !rule.active }, rule.active ? "Auto rule paused." : "Auto rule enabled.")}
              deleteRule={(rule) => remove(`/api/admin/auto-keys/${rule.id}`, "Auto rule deleted.")}
            />
          ) : null}

          {!activeTabIsLocked && activeTab === "deployment" ? (
            <AdSystems
              scripts={scripts}
              campaigns={campaigns}
              tickets={tickets}
              claimScriptIds={claimScriptIds}
              setClaimScriptIds={setClaimScriptIds}
            claimName={claimName}
            setClaimName={setClaimName}
            claimProvider={claimProvider}
            claimApiKey={claimApiKey}
            setClaimApiKey={setClaimApiKey}
            claimDeliveryKey={claimDeliveryKey}
            setClaimDeliveryKey={setClaimDeliveryKey}
            claimSteps={claimSteps}
            setClaimSteps={setClaimSteps}
            claimTierId={claimTierId}
            setClaimTierId={setClaimTierId}
            claimThemeId={claimThemeId}
            setClaimThemeId={setClaimThemeId}
            claimThumbnailUrl={claimThumbnailUrl}
            setClaimThumbnailUrl={setClaimThumbnailUrl}
            claimDiscordRequired={claimDiscordRequired}
            setClaimDiscordRequired={setClaimDiscordRequired}
            claimTtl={claimTtl}
              setClaimTtl={setClaimTtl}
              claimMaxRedemptions={claimMaxRedemptions}
              setClaimMaxRedemptions={setClaimMaxRedemptions}
              createAdSystem={createAdSystem}
              newClaimUrl={newClaimUrl}
              copy={copy}
              scriptNames={scriptNames}
              generateTicket={(campaign) => patch(`/api/admin/claims/${campaign.id}`, { action: "ticket" }, "New ad system URL generated.")}
              toggleCampaign={(campaign) => patch(`/api/admin/claims/${campaign.id}`, { active: !campaign.active }, campaign.active ? "Ad system disabled." : "Ad system enabled.")}
              deleteCampaign={(campaign) => remove(`/api/admin/claims/${campaign.id}`, "Ad system deleted.")}
            />
          ) : null}

          {!activeTabIsLocked && activeTab === "logs" ? <Logs logs={logs} redemptions={redemptions} licenses={licenses} /> : null}
          {!activeTabIsLocked && activeTab === "settings" ? <SettingsPanel user={user} logout={logout} deleteOwnAccount={deleteOwnAccount} /> : null}
          {!activeTabIsLocked && activeTab === "owner" && user.role === "owner" ? (
            <UserManagement
              users={managedUsers}
              scripts={scripts}
              licenses={licenses}
              currentUserId={user.id}
              copy={copy}
              revealLicenseKey={async (license) => {
                const payload = await patch(`/api/admin/licenses/${license.id}`, { action: "reveal" }, "Key revealed.");
                return typeof payload?.key === "string" ? payload.key : null;
              }}
              updateUser={(target, body) => patch(`/api/admin/users/${target.id}`, body, "User updated.")}
              deleteUser={(target) => remove(`/api/admin/users/${target.id}`, "User deleted.")}
              scriptNames={scriptNames}
            />
          ) : null}
          {!activeTabIsLocked && activeTab === "api" ? <ApiDocs scripts={scripts} /> : null}
        </Reveal>
        </main>
      </section>
    </InteractiveShell>
  );
}

function CustomerPortal({ user, logout, deleteOwnAccount }: { user: AppUser; logout: () => void; deleteOwnAccount: () => void }) {
  return (
    <InteractiveShell className={`${dashboardTheme.page} min-h-screen`}>
      <main className="mx-auto grid min-h-screen max-w-6xl content-center gap-5 px-6 py-10">
        <section className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-rose-500">Customer portal</p>
              <h1 className="mt-2 text-4xl font-black text-white">Welcome, {user.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Your account is on the Free customer plan. You can protect up to 3 scripts once customer workspaces are enabled. Owner approval is required for higher limits.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className={dashboardTheme.ghostButton} href="/docs">Read docs</Link>
              <button className={dashboardTheme.button} onClick={logout} type="button">Logout</button>
            </div>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Free script slots" value="0 / 3" hint="Workspace ownership is coming next." />
          <StatCard label="Plan" value="Free" hint="Starter access" />
          <StatCard label="Status" value="Active" hint={user.email} />
        </section>
        <Panel title="What You Can Do">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Protect scripts", "Free customers will be limited to 3 protected scripts."],
              ["Use hosted loaders", "Your users will run AegisLua loadstrings with the same key prompt."],
              ["Upgrade later", "Pro and Enterprise plans will unlock higher script, key, and automation limits."],
            ].map(([title, text]) => (
              <div className={dashboardTheme.panelSoft} key={title}>
                <strong className="text-white">{title}</strong>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Settings">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h3 className="font-black text-white">Account</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{user.email}</p>
            </div>
            <button className={dashboardTheme.dangerButton} onClick={deleteOwnAccount} type="button">
              Delete account
            </button>
          </div>
        </Panel>
      </main>
    </InteractiveShell>
  );
}

function SettingsPanel({ user, logout, deleteOwnAccount }: { user: AppUser; logout: () => void; deleteOwnAccount: () => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Account">
        <div className="grid gap-3">
          <InfoRow label="Name" value={user.name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Role" value={user.role} />
        </div>
      </Panel>
      <Panel title="Session">
        <p className="text-sm leading-6 text-slate-400">
          Your login is remembered with a secure browser cookie. Sign out when using a shared device.
        </p>
        <button className={`${dashboardTheme.ghostButton} mt-4 w-full`} onClick={logout} type="button">
          Logout
        </button>
      </Panel>
      <section className="glass-card rounded-2xl border-rose-500/30 p-4 sm:p-5 lg:col-span-2">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-rose-500">Danger zone</p>
            <h2 className="mt-2 text-lg font-black text-white">Delete account</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              This removes your account and signs this browser out. Owner accounts cannot delete themselves when they are the only owner.
            </p>
          </div>
          <button className={dashboardTheme.dangerButton} onClick={deleteOwnAccount} type="button">
            Delete my account
          </button>
        </div>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-xl border border-white/10 bg-black/35 p-3">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{label}</span>
      <strong className="break-all text-sm text-white">{value}</strong>
    </div>
  );
}

function Overview({
  stats,
  charts,
}: {
  stats: { uniquePlayers: number; keysGenerated: number; completedClaims: number; estimatedRevenue: number; boundDevices: number };
  charts: Record<string, Array<{ label: string; value: number }>>;
}) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Players executed" value={stats.uniquePlayers} hint="unique allowed users" />
        <StatCard label="Keys generated" value={stats.keysGenerated} />
        <StatCard label="Claims completed" value={stats.completedClaims} />
        <StatCard label="Revenue estimate" value={`$${stats.estimatedRevenue.toFixed(2)}`} hint="based on completed claim logs" />
        <StatCard label="Bound devices" value={stats.boundDevices} />
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <MiniBarChart label="Script executions" points={charts.executionsChart} />
        <MiniBarChart label="Claim completions" points={charts.claimsChart} />
        <MiniBarChart label="Keys generated" points={charts.keyChart} />
        <MiniBarChart label="Revenue estimate" points={charts.revenueChart} />
      </section>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-black/35 px-3 py-2 text-center">
      <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">{label}</span>
      <strong className="mt-1 block text-lg text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>{value}</strong>
    </div>
  );
}

function UpgradeLocked({ tabTitle }: { tabTitle: string }) {
  return (
    <section className="glass-card mx-auto grid max-w-3xl place-items-center rounded-3xl p-8 text-center sm:p-10">
      <span className="grid size-14 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200">
        <Crown size={26} />
      </span>
      <p className="mt-5 font-mono text-xs font-black uppercase tracking-[0.22em] text-amber-200">Premium feature</p>
      <h2 className="mt-2 text-3xl font-black text-white">{tabTitle}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
        This area is visible so you can see what AegisLua can do, but it requires a Pro or Enterprise plan before the controls unlock.
      </p>
      <Link className={`${dashboardTheme.button} mt-6 inline-flex items-center justify-center gap-2`} href="/pricing">
        <Crown size={16} />
        View pricing
      </Link>
    </section>
  );
}

function ScriptManagement(props: {
  scripts: ScriptProject[];
  logs: AuthLog[];
  scriptName: string;
  setScriptName: (value: string) => void;
  scriptSource: string;
  setScriptSource: (value: string) => void;
  scriptFileName: string;
  setScriptFileName: (value: string) => void;
  newLoaderSnippet: string;
  createScript: (event: FormEvent) => void;
  copy: (value: string) => void;
  toggleScript: (script: ScriptProject) => void;
  deleteScript: (script: ScriptProject) => void;
}) {
  const generatedId = slugifyClient(props.scriptName);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const filteredScripts = props.scripts.filter((script) => {
    const search = query.trim().toLowerCase();
    if (!search) return true;
    return script.name.toLowerCase().includes(search) || script.slug.toLowerCase().includes(search);
  });
  async function readScriptFile(file: File | undefined) {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".lua") && !lowerName.endsWith(".luau")) {
      props.setScriptFileName("");
      props.setScriptSource("");
      return;
    }
    props.setScriptFileName(file.name);
    props.setScriptSource(await file.text());
    if (!props.scriptName.trim()) {
      props.setScriptName(file.name.replace(/\.(lua|luau)$/i, ""));
    }
  }

  return (
    <div className="grid gap-5">
      <Panel title="Script Library" meta={`${props.scripts.length} protected`}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Each script gets a hosted loadstring that prompts for a key, validates server-side, then releases the protected source.
          </p>
          <button className={`${dashboardTheme.button} flex items-center justify-center gap-2`} onClick={() => setCreating(true)} type="button">
            <Upload size={16} />
            Protect script
          </button>
        </div>
        {props.newLoaderSnippet ? <CopyBox label="Newest protected loader" value={props.newLoaderSnippet} copy={props.copy} compact /> : null}
      </Panel>

      <Panel title="Protected Scripts" meta={`${filteredScripts.length} shown`}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
            <input
              className={`${dashboardTheme.input} py-2.5 pl-10`}
              placeholder="Search scripts"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <span className="text-sm text-slate-500">{props.scripts.length} total scripts</span>
        </div>
        {props.scripts.length === 0 ? <EmptyState text="No scripts yet. Protect a Lua file to generate your first loader." /> : null}
        {props.scripts.length > 0 && filteredScripts.length === 0 ? <EmptyState text="No scripts match that search." /> : null}
        <ScrollArea className="max-h-[56vh] rounded-2xl border border-white/10">
          <div className="min-w-[860px]">
            <div className="sticky top-0 z-10 grid grid-cols-[1.2fr_1fr_0.55fr_0.6fr_0.9fr] border-b border-white/10 bg-[#0b0b10]/95 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-600 backdrop-blur-xl">
              <span>Script</span>
              <span>ID</span>
              <span>Runs</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {filteredScripts.map((script) => {
          const runs = props.logs.filter((log) => log.ok && log.scriptId === script.id).length;
          return (
              <div className="grid grid-cols-[1.2fr_1fr_0.55fr_0.6fr_0.9fr] items-center gap-3 border-b border-white/5 px-4 py-3 text-sm last:border-b-0" key={script.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="text-rose-500" size={18} />
                    <div className="min-w-0">
                      <strong className="block truncate text-white">{script.name}</strong>
                      <span className="text-xs text-slate-500">{script.sourceBytes ? `${Math.ceil(script.sourceBytes / 1024)} KB protected` : "No source stored"}</span>
                    </div>
                  </div>
                </div>
                <code className="truncate text-xs text-rose-300">{script.slug}</code>
                <strong className="text-white">{runs}</strong>
                <Badge tone={script.active ? "good" : "bad"}>{script.active ? "Active" : "Disabled"}</Badge>
                <div className="flex justify-end gap-2">
                  <button className={`${dashboardTheme.button} flex items-center gap-2 px-3 py-2 text-xs`} onClick={() => props.copy(loaderSnippetFor(script.slug))} type="button">
                    <Copy size={15} />
                    Loader
                  </button>
                  <button className={`${dashboardTheme.ghostButton} px-3 py-2 text-xs`} onClick={() => props.copy(script.slug)} type="button">ID</button>
                  <button className={`${dashboardTheme.ghostButton} flex items-center gap-2 px-3 py-2 text-xs`} onClick={() => props.toggleScript(script)} type="button">
                    <Power size={15} />
                    {script.active ? "Disable" : "Enable"}
                  </button>
                  <button className={`${dashboardTheme.dangerButton} flex items-center gap-2 px-3 py-2 text-xs`} onClick={() => props.deleteScript(script)} type="button">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
          );
        })}
          </div>
        </ScrollArea>
      </Panel>

      <Modal open={creating} title="Protect a Script" onClose={() => setCreating(false)}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            props.createScript(event);
            setCreating(false);
          }}
        >
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
            Upload a .lua or .luau file. AegisLua stores the source encrypted and gives you a hosted loadstring that opens a key prompt before the script can run.
          </div>
          <Field label="Script name">
            <input className={dashboardTheme.input} value={props.scriptName} onChange={(event) => props.setScriptName(event.target.value)} />
          </Field>
          <Field label="Lua or Luau file">
            <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-rose-400/35 bg-black/30 px-5 py-8 text-center transition hover:-translate-y-0.5 hover:border-rose-300/70 hover:bg-rose-500/10">
              <input
                accept=".lua,.luau"
                className="sr-only"
                type="file"
                onChange={(event) => readScriptFile(event.target.files?.[0])}
              />
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-200 transition group-hover:scale-105">
                <Upload size={22} />
              </span>
              <strong className="mt-4 text-white">Choose script file</strong>
              <span className="mt-1 text-sm text-zinc-500">Only .lua and .luau files are accepted.</span>
            </label>
          </Field>
          {props.scriptFileName ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">Selected file</span>
                  <strong className="mt-1 block break-all text-white">{props.scriptFileName}</strong>
                </div>
                <Badge tone="good">{Math.max(1, Math.ceil(props.scriptSource.length / 1024))} KB loaded</Badge>
              </div>
            </div>
          ) : null}
          <div className={dashboardTheme.panelSoft}>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Generated script ID</span>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-black/40 p-3">
              <code className="min-w-0 break-all text-sm text-rose-100">{props.scriptName.trim() ? generatedId : "Your script ID will appear here"}</code>
              <button className={dashboardTheme.ghostButton} onClick={() => props.copy(generatedId)} type="button">
                <Copy size={15} />
              </button>
            </div>
          </div>
          <button className={`${dashboardTheme.button} magnetic-button flex items-center justify-center gap-2`} type="submit">
            <Plus size={16} />
            Add script
          </button>
        </form>
      </Modal>
    </div>
  );
}

function KeyManagement(props: {
  scripts: ScriptProject[];
  licenses: License[];
  selectedScriptIds: string[];
  setSelectedScriptIds: (value: string[]) => void;
  licenseLabel: string;
  setLicenseLabel: (value: string) => void;
  maxUsers: number;
  setMaxUsers: (value: number) => void;
  maxDevices: number;
  setMaxDevices: (value: number) => void;
  expiresAt: string;
  setExpiresAt: (value: string) => void;
  createLicense: (event: FormEvent) => void;
  newKey: string;
  scriptNames: (ids: string[]) => string;
  revealLicenseKey: (license: License) => Promise<string | null>;
  copy: (value: string) => void;
  toggleLicense: (license: License) => void;
  deleteLicense: (license: License) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [scriptFilter, setScriptFilter] = useState("all");
  const filteredLicenses = props.licenses.filter((license) => {
    const search = query.trim().toLowerCase();
    const scriptMatch = scriptFilter === "all" || license.scriptIds.includes(scriptFilter);
    const textMatch =
      !search ||
      license.label.toLowerCase().includes(search) ||
      props.scriptNames(license.scriptIds).toLowerCase().includes(search) ||
      visibleKeys[license.id]?.toLowerCase().includes(search);
    return scriptMatch && textMatch;
  });

  async function revealKey(license: License) {
    const key = await props.revealLicenseKey(license);
    if (key) setVisibleKeys((current) => ({ ...current, [license.id]: key }));
  }

  return (
    <div className="grid gap-5">
      <Panel title="Key Management" meta={`${props.licenses.length} total`}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              Long-term keys are best for paid customers, testers, and private access. Create keys in a focused dialog, then manage status and visibility from the inventory.
            </p>
          </div>
          <button className={`${dashboardTheme.button} flex items-center justify-center gap-2`} onClick={() => setCreating(true)} type="button">
            <KeyRound size={16} />
            Generate key
          </button>
        </div>
        {props.newKey ? <KeyBox label="Newest key, shown here for this session" value={props.newKey} /> : null}
      </Panel>

      <Panel title="Key Inventory" meta={`${filteredLicenses.length} shown`}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input
                className={`${dashboardTheme.input} py-2.5 pl-10`}
                placeholder="Search keys"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select className={`${dashboardTheme.input} py-2.5 sm:w-56`} value={scriptFilter} onChange={(event) => setScriptFilter(event.target.value)}>
              <option value="all">All scripts</option>
              {props.scripts.map((script) => <option key={script.id} value={script.id}>{script.name}</option>)}
            </select>
          </div>
          <span className="text-sm text-slate-500">{props.licenses.length} total keys</span>
        </div>
        {props.licenses.length === 0 ? <EmptyState text="No keys generated yet." /> : null}
        {props.licenses.length > 0 && filteredLicenses.length === 0 ? <EmptyState text="No keys match those filters." /> : null}
        <ScrollArea className="max-h-[56vh] rounded-2xl border border-white/10">
          <div className="min-w-[980px]">
            <div className="sticky top-0 z-10 grid grid-cols-[1.05fr_1.35fr_1fr_0.75fr_0.8fr_1fr] border-b border-white/10 bg-[#0b0b10]/95 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-600 backdrop-blur-xl">
              <span>Label</span>
              <span>Key</span>
              <span>Script</span>
              <span>Limits</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {filteredLicenses.map((license) => {
            const visibleKey = visibleKeys[license.id];
            return (
              <div className="grid grid-cols-[1.05fr_1.35fr_1fr_0.75fr_0.8fr_1fr] items-center gap-3 border-b border-white/5 px-4 py-3 text-sm last:border-b-0" key={license.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="shrink-0 text-rose-500" size={17} />
                    <strong className="truncate text-white">{license.label}</strong>
                  </div>
                  <span className="mt-1 block text-xs text-slate-600">{license.expiresAt ? `Expires ${new Date(license.expiresAt).toLocaleDateString()}` : "No expiry"}</span>
                </div>
                <code className="truncate rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-rose-100">
                  {visibleKey || (license.hasStoredKey ? "AEGIS-****************" : "Legacy hash only")}
                </code>
                <span className="truncate text-slate-400">{props.scriptNames(license.scriptIds) || "No scripts"}</span>
                <span className="text-xs text-slate-500">
                  {license.maxUsers >= 1000000 ? "Shared" : `${license.users.length}/${license.maxUsers} users`}
                  <br />
                  {license.maxDevices >= 1000000 ? "Any device" : `${license.devices.length}/${license.maxDevices} devices`}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={license.active ? "good" : "bad"}>{license.active ? "Active" : "Revoked"}</Badge>
                  {!license.hasStoredKey ? <Badge tone="warn">Legacy</Badge> : null}
                </div>
                <div className="flex justify-end gap-2">
                  {visibleKey ? (
                    <button className={`${dashboardTheme.ghostButton} px-3 py-2 text-xs`} onClick={() => props.copy(visibleKey)} type="button">
                      Copy
                    </button>
                  ) : null}
                  <button
                    className={`${dashboardTheme.ghostButton} flex items-center gap-2 px-3 py-2 text-xs`}
                    disabled={!license.hasStoredKey}
                    onClick={() => {
                      if (visibleKey) {
                        setVisibleKeys((current) => {
                          const next = { ...current };
                          delete next[license.id];
                          return next;
                        });
                      } else {
                        revealKey(license);
                      }
                    }}
                    type="button"
                  >
                      {visibleKey ? <EyeOff size={15} /> : <Eye size={15} />}
                      {visibleKey ? "Hide" : "Show"}
                    </button>
                    <button className={`${dashboardTheme.ghostButton} flex items-center gap-2 px-3 py-2 text-xs`} onClick={() => props.toggleLicense(license)} type="button">
                      <Power size={15} />
                      {license.active ? "Disable" : "Enable"}
                    </button>
                    <button className={`${dashboardTheme.dangerButton} flex items-center gap-2 px-3 py-2 text-xs`} onClick={() => props.deleteLicense(license)} type="button">
                      <Trash2 size={15} />
                    </button>
                </div>
              </div>
            );
          })}
          </div>
        </ScrollArea>
      </Panel>

      <Modal open={creating} title="Create Long-Term Key" onClose={() => setCreating(false)}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            props.createLicense(event);
            setCreating(false);
          }}
        >
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-zinc-400">
            Configure limits for one reusable key. New keys are encrypted at rest so you can reveal them later from the inventory.
          </div>
          <Field label="Label"><input className={dashboardTheme.input} value={props.licenseLabel} onChange={(event) => props.setLicenseLabel(event.target.value)} /></Field>
          <MultiScriptSelect scripts={props.scripts} value={props.selectedScriptIds} onChange={props.setSelectedScriptIds} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Max users"><input className={dashboardTheme.input} min={1} type="number" value={props.maxUsers} onChange={(event) => props.setMaxUsers(Number(event.target.value))} /></Field>
            <Field label="Max devices"><input className={dashboardTheme.input} min={1} type="number" value={props.maxDevices} onChange={(event) => props.setMaxDevices(Number(event.target.value))} /></Field>
          </div>
          <Field label="Expires"><input className={dashboardTheme.input} value={props.expiresAt} onChange={(event) => props.setExpiresAt(event.target.value)} type="datetime-local" /></Field>
          <button className={`${dashboardTheme.button} magnetic-button flex items-center justify-center gap-2`} type="submit">
            <KeyRound size={16} />
            Generate key
          </button>
        </form>
      </Modal>
    </div>
  );
}

function AutoKeyManagement(props: {
  scripts: ScriptProject[];
  rules: AutoKeyRule[];
  autoName: string;
  setAutoName: (value: string) => void;
  autoScriptIds: string[];
  setAutoScriptIds: (value: string[]) => void;
  autoIntervalCount: number;
  setAutoIntervalCount: (value: number) => void;
  autoIntervalUnit: "days" | "weeks" | "months";
  setAutoIntervalUnit: (value: "days" | "weeks" | "months") => void;
  autoExpiresInDays: number;
  setAutoExpiresInDays: (value: number) => void;
  createAutoRule: (event: FormEvent) => void;
  newAutoKey: string;
  openKeyInventory: () => void;
  scriptNames: (ids: string[]) => string;
  generateNow: (rule: AutoKeyRule) => void;
  toggleRule: (rule: AutoKeyRule) => void;
  deleteRule: (rule: AutoKeyRule) => void;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <div className="grid gap-5">
      <Panel title="Auto Key Rules" meta={`${props.rules.length} rules`}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Generate short-term shared keys on a schedule, then manage every generated key from the Key Inventory.
          </p>
          <button className={`${dashboardTheme.button} flex items-center justify-center gap-2`} onClick={() => setCreating(true)} type="button">
            <Wand2 size={16} />
            New rule
          </button>
        </div>
        {props.newAutoKey ? (
          <div className="mt-4 grid gap-3">
            <KeyBox label="Generated short-term key" value={props.newAutoKey} />
            <button className={dashboardTheme.ghostButton} onClick={props.openKeyInventory} type="button">View it in Key Inventory</button>
          </div>
        ) : null}
      </Panel>

      <ScrollArea className="max-h-[52vh] pr-1">
        <div className="grid gap-4">
        {props.rules.length === 0 ? <EmptyState text="No auto key rules yet. Create one for rotating weekly or daily keys." /> : null}
        {props.rules.map((rule) => (
          <article className="glass-card rounded-2xl p-5" key={rule.id}>
            <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Wand2 className="text-rose-500" size={18} />
                  <strong className="text-lg text-white">{rule.name}</strong>
                  <Badge tone={rule.active ? "good" : "bad"}>{rule.active ? "Active" : "Paused"}</Badge>
                  <Badge>Every {rule.intervalCount} {rule.intervalUnit}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-3">
                  <span><strong className="text-slate-300">Scripts:</strong> {props.scriptNames(rule.scriptIds) || "No scripts assigned"}</span>
                  <span><strong className="text-slate-300">Next run:</strong> {new Date(rule.nextRunAt).toLocaleString()}</span>
                  <span><strong className="text-slate-300">Last generated:</strong> {rule.lastGeneratedAt ? new Date(rule.lastGeneratedAt).toLocaleString() : "Never"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <button className={`${dashboardTheme.button} flex items-center gap-2`} onClick={() => props.generateNow(rule)} type="button"><KeyRound size={15} />Generate</button>
                <button className={`${dashboardTheme.ghostButton} flex items-center gap-2`} onClick={() => props.toggleRule(rule)} type="button"><Power size={15} />{rule.active ? "Pause" : "Enable"}</button>
                <button className={`${dashboardTheme.dangerButton} flex items-center gap-2`} onClick={() => props.deleteRule(rule)} type="button"><Trash2 size={15} />Delete</button>
              </div>
            </div>
          </article>
        ))}
        </div>
      </ScrollArea>

      <Modal open={creating} title="Create Auto Key Rule" onClose={() => setCreating(false)}>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            props.createAutoRule(event);
            setCreating(false);
          }}
        >
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
            Auto key rules generate one shared short-term key on a schedule. Each generated key is saved into Key Inventory automatically, so you can disable, enable, or remove it later.
          </div>
          <Field label="Rule name"><input className={dashboardTheme.input} value={props.autoName} onChange={(event) => props.setAutoName(event.target.value)} /></Field>
          <MultiScriptSelect scripts={props.scripts} value={props.autoScriptIds} onChange={props.setAutoScriptIds} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Every"><input className={dashboardTheme.input} min={1} type="number" value={props.autoIntervalCount} onChange={(event) => props.setAutoIntervalCount(Number(event.target.value))} /></Field>
            <Field label="Unit">
              <select className={dashboardTheme.input} value={props.autoIntervalUnit} onChange={(event) => props.setAutoIntervalUnit(event.target.value as "days" | "weeks" | "months")}>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </Field>
          </div>
          <Field label="Generated key expires after days"><input className={dashboardTheme.input} min={1} type="number" value={props.autoExpiresInDays} onChange={(event) => props.setAutoExpiresInDays(Number(event.target.value))} /></Field>
          <button className={`${dashboardTheme.button} magnetic-button flex items-center justify-center gap-2`} type="submit">
            <Wand2 size={16} />
            Create auto rule
          </button>
        </form>
      </Modal>
    </div>
  );
}

function AdSystems(props: {
  scripts: ScriptProject[];
  campaigns: ClaimCampaign[];
  tickets: ClaimTicket[];
  claimScriptIds: string[];
  setClaimScriptIds: (value: string[]) => void;
  claimName: string;
  setClaimName: (value: string) => void;
  claimProvider: ClaimCampaign["provider"];
  claimApiKey: string;
  setClaimApiKey: (value: string) => void;
  claimDeliveryKey: string;
  setClaimDeliveryKey: (value: string) => void;
  claimSteps: number;
  setClaimSteps: (value: number) => void;
  claimTierId: number;
  setClaimTierId: (value: number) => void;
  claimThemeId: number;
  setClaimThemeId: (value: number) => void;
  claimThumbnailUrl: string;
  setClaimThumbnailUrl: (value: string) => void;
  claimDiscordRequired: boolean;
  setClaimDiscordRequired: (value: boolean) => void;
  claimTtl: number;
  setClaimTtl: (value: number) => void;
  claimMaxRedemptions: number;
  setClaimMaxRedemptions: (value: number) => void;
  createAdSystem: (event: FormEvent) => void;
  newClaimUrl: string;
  copy: (value: string) => void;
  scriptNames: (ids: string[]) => string;
  generateTicket: (campaign: ClaimCampaign) => void;
  toggleCampaign: (campaign: ClaimCampaign) => void;
  deleteCampaign: (campaign: ClaimCampaign) => void;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <div className="grid gap-5">
      <section className="grid gap-3 lg:grid-cols-4">
        {[
          ["1", "Choose script", "Pick the protected script this link should unlock."],
          ["2", "Attach key", "Paste an existing key from Key Inventory."],
          ["3", "Create LootLabs link", "AegisLua calls LootLabs and locks your claim page."],
          ["4", "Share monetized URL", "Users complete LootLabs, return to AegisLua, then see the attached key."],
        ].map(([step, title, text]) => (
          <article className="glass-card rounded-2xl p-4" key={step}>
            <span className="flex size-8 items-center justify-center rounded-full bg-rose-500 text-sm font-black text-white">{step}</span>
            <h3 className="mt-4 font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
          </article>
        ))}
      </section>

      <Panel title="Ad Systems" meta={`${props.campaigns.length} systems`}>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              Build LootLabs links that return users to AegisLua and reveal an existing key from your inventory.
            </p>
          </div>
          <button className={`${dashboardTheme.button} flex items-center justify-center gap-2`} onClick={() => setCreating(true)} type="button">
            <Megaphone size={16} />
            New ad system
          </button>
        </div>
        {props.newClaimUrl ? <CopyBox label="Newest provider destination URL" value={props.newClaimUrl} copy={props.copy} compact /> : null}
      </Panel>

      <ScrollArea className="max-h-[52vh] pr-1">
        <div className="grid gap-4">
        {props.campaigns.length === 0 ? <EmptyState text="No ad systems created yet. Create one to start monetizing keys." /> : null}
        {props.campaigns.map((campaign) => {
          const latestTicket = props.tickets
            .filter((ticket) => ticket.campaignId === campaign.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          return (
            <article className="glass-card rounded-2xl p-5" key={campaign.id}>
              <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Megaphone className="text-rose-500" size={18} />
                    <strong className="text-lg text-white">{campaign.name}</strong>
                    <Badge tone={campaign.active ? "good" : "bad"}>{campaign.active ? "Active" : "Disabled"}</Badge>
                    <Badge>{providerLabel(campaign.provider)}</Badge>
                    <Badge tone={campaign.deliveryLicenseId ? "good" : "bad"}>{campaign.deliveryLicenseId ? "Key attached" : "No key"}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-3">
                    <span><strong className="text-slate-300">Script:</strong> {props.scriptNames(campaign.scriptIds) || "No script selected"}</span>
                    <span><strong className="text-slate-300">Steps:</strong> {campaign.steps || 3}</span>
                    <span><strong className="text-slate-300">URL TTL:</strong> {campaign.ticketTtlMinutes}m</span>
                    <span><strong className="text-slate-300">Claims:</strong> {campaign.maxRedemptions}</span>
                    <span><strong className="text-slate-300">Discord:</strong> {campaign.discordRequired ? "Required" : "Off"}</span>
                    <span><strong className="text-slate-300">API:</strong> {campaign.apiKeyHash ? "Connected" : "Missing"}</span>
                  </div>
                  {latestTicket ? <CopyBox label={latestTicket.monetizedUrl ? "LootLabs URL" : "Fallback claim URL"} value={latestTicket.monetizedUrl || latestTicket.claimUrl} copy={props.copy} compact /> : null}
                </div>
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <button className={`${dashboardTheme.button} flex items-center gap-2`} onClick={() => props.generateTicket(campaign)} type="button"><Link2 size={15} />Refresh URL</button>
                  <button className={`${dashboardTheme.ghostButton} flex items-center gap-2`} onClick={() => props.toggleCampaign(campaign)} type="button"><Power size={15} />{campaign.active ? "Disable" : "Enable"}</button>
                  <button className={`${dashboardTheme.dangerButton} flex items-center gap-2`} onClick={() => props.deleteCampaign(campaign)} type="button"><Trash2 size={15} />Remove</button>
                </div>
              </div>
            </article>
          );
        })}
        </div>
      </ScrollArea>

      <Modal open={creating} title="Create Ad System" onClose={() => setCreating(false)}>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              props.createAdSystem(event);
              setCreating(false);
            }}
          >
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
              Configure a checkpoint system for one script. Users complete your provider flow, return to AegisLua, then receive the existing key you attach here.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input className={dashboardTheme.input} value={props.claimName} onChange={(event) => props.setClaimName(event.target.value)} /></Field>
              <Field label="Integration"><input className={dashboardTheme.input} readOnly value="LootLabs" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="LootLabs API key"><input className={dashboardTheme.input} value={props.claimApiKey} onChange={(event) => props.setClaimApiKey(event.target.value)} type="password" /></Field>
              <SingleScriptSelect scripts={props.scripts} value={props.claimScriptIds[0] || ""} onChange={(scriptId) => props.setClaimScriptIds(scriptId ? [scriptId] : [])} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Key to deliver"><input className={dashboardTheme.input} value={props.claimDeliveryKey} onChange={(event) => props.setClaimDeliveryKey(event.target.value)} type="password" /></Field>
              <Field label="LootLabs tasks"><input className={dashboardTheme.input} min={1} max={5} type="number" value={props.claimSteps} onChange={(event) => props.setClaimSteps(Number(event.target.value))} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ad tier">
                <select className={dashboardTheme.input} value={props.claimTierId} onChange={(event) => props.setClaimTierId(Number(event.target.value))}>
                  <option value={1}>Trending and recommended</option>
                  <option value={2}>Gaming offers</option>
                  <option value={3}>Profit maximization</option>
                  <option value={4}>Software products</option>
                </select>
              </Field>
              <Field label="Theme">
                <select className={dashboardTheme.input} value={props.claimThemeId} onChange={(event) => props.setClaimThemeId(Number(event.target.value))}>
                  <option value={1}>Classic</option>
                  <option value={2}>Sims</option>
                  <option value={3}>Minecraft</option>
                  <option value={4}>GTA</option>
                  <option value={5}>Space</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Claim URL lifetime"><input className={dashboardTheme.input} min={5} type="number" value={props.claimTtl} onChange={(event) => props.setClaimTtl(Number(event.target.value))} /></Field>
              <Field label="Max claims"><input className={dashboardTheme.input} min={1} type="number" value={props.claimMaxRedemptions} onChange={(event) => props.setClaimMaxRedemptions(Number(event.target.value))} /></Field>
            </div>
            <Field label="Thumbnail URL"><input className={dashboardTheme.input} value={props.claimThumbnailUrl} onChange={(event) => props.setClaimThumbnailUrl(event.target.value)} /></Field>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-slate-300">
              Discord required
              <input checked={props.claimDiscordRequired} className="size-5 accent-rose-500" onChange={(event) => props.setClaimDiscordRequired(event.target.checked)} type="checkbox" />
            </label>
            <button className={`${dashboardTheme.button} magnetic-button flex items-center justify-center gap-2`} type="submit">
              <Megaphone size={16} />
              Create ad system
            </button>
          </form>
      </Modal>
    </div>
  );
}

function Logs({ logs, redemptions, licenses }: { logs: AuthLog[]; redemptions: ClaimRedemption[]; licenses: License[] }) {
  const players = Array.from(new Map(logs.filter((log) => log.userId || log.username).map((log) => [log.userId || log.username, log])).values());
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Script Executions" meta={`${logs.length} auth attempts`}>
        <ScrollArea className="max-h-[44vh] pr-1">
        <div className="grid gap-2">
          {logs.length === 0 ? <EmptyState text="No script execution logs yet." /> : null}
          {logs.map((log) => (
            <div className="grid gap-2 rounded-xl border border-white/10 bg-black/35 p-3 text-sm sm:grid-cols-[160px_80px_1fr_160px]" key={log.id}>
              <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
              <strong className={log.ok ? "text-rose-200" : "text-zinc-500"}>{log.ok ? "Allowed" : "Denied"}</strong>
              <span className="truncate text-slate-300">{log.username || log.userId}</span>
              <span className="text-slate-400">{log.reason}</span>
            </div>
          ))}
        </div>
        </ScrollArea>
      </Panel>
      <Panel title="Players" meta={`${players.length} seen`}>
        <ScrollArea className="max-h-[44vh] pr-1">
        <div className="grid gap-2">
          {players.length === 0 ? <EmptyState text="No players have executed a secured script yet." /> : null}
          {players.map((player) => (
            <div className="rounded-xl border border-white/10 bg-black/35 p-3 text-sm" key={player.id}>
              <strong className="text-white">{player.username || "Unknown"}</strong>
              <p className="mt-1 text-slate-500">User ID: {player.userId || "missing"} - Last seen {new Date(player.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
        </ScrollArea>
      </Panel>
      <Panel title="Claim Redemptions" meta={`${redemptions.length} attempts`}>
        <ScrollArea className="max-h-[44vh] pr-1">
        <div className="grid gap-2">
          {redemptions.length === 0 ? <EmptyState text="No claim redemption logs yet." /> : null}
          {redemptions.map((redemption) => (
            <div className="grid gap-2 rounded-xl border border-white/10 bg-black/35 p-3 text-sm sm:grid-cols-[160px_80px_1fr]" key={redemption.id}>
              <span className="text-slate-500">{new Date(redemption.createdAt).toLocaleString()}</span>
              <strong className={redemption.ok ? "text-rose-200" : "text-zinc-500"}>{redemption.ok ? "Claimed" : "Denied"}</strong>
              <span className="text-slate-400">{redemption.reason}</span>
            </div>
          ))}
        </div>
        </ScrollArea>
      </Panel>
      <Panel title="Recent License Users" meta={`${licenses.length} keys`}>
        <ScrollArea className="max-h-[44vh] pr-1">
        <div className="grid gap-2">
          {licenses.map((license) => (
            <div className="rounded-xl border border-white/10 bg-black/35 p-3 text-sm" key={license.id}>
              <strong className="text-white">{license.label}</strong>
              <p className="mt-1 text-slate-500">{license.users.length} users - last username {license.lastUsername || "none"}</p>
            </div>
          ))}
        </div>
        </ScrollArea>
      </Panel>
    </div>
  );
}

function UserManagement(props: {
  users: ManagedUser[];
  scripts: ScriptProject[];
  licenses: License[];
  currentUserId: string;
  copy: (value: string) => void;
  revealLicenseKey: (license: License) => Promise<string | null>;
  updateUser: (
    target: ManagedUser,
    body: Partial<Pick<ManagedUser, "role" | "plan" | "subscriptionStatus" | "subscriptionRenewsAt" | "active">>,
  ) => void;
  deleteUser: (target: ManagedUser) => void;
  scriptNames: (ids: string[]) => string;
}) {
  const owners = props.users.filter((user) => user.role === "owner").length;
  const paidUsers = props.users.filter((user) => user.plan === "pro" || user.plan === "enterprise").length;
  const activeUsers = props.users.filter((user) => user.active).length;
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [detailMode, setDetailMode] = useState<"profile" | "scripts" | "keys">("profile");
  const [detailQuery, setDetailQuery] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Record<string, string>>({});

  async function revealOwnerKey(license: License) {
    const key = await props.revealLicenseKey(license);
    if (key) setVisibleKeys((current) => ({ ...current, [license.id]: key }));
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Site users" value={props.users.length} />
        <StatCard label="Scripts total" value={props.scripts.length} />
        <StatCard label="Keys total" value={props.licenses.length} />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active accounts" value={activeUsers} />
        <StatCard label="Paid plans" value={paidUsers} hint={`${owners} owner account${owners === 1 ? "" : "s"}`} />
        <StatCard label="Disabled accounts" value={props.users.length - activeUsers} />
      </section>
      <Panel title="User Management" meta="Owner only">
        <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
          Your owner account can promote admins, disable accounts, and manually assign subscription plans while payment automation is still being built.
        </div>
        <ScrollArea className="max-h-[58vh] pr-1">
        <div className="grid gap-3">
          {props.users.length === 0 ? <EmptyState text="No users found." /> : null}
          {props.users.map((managedUser) => (
            <article className={dashboardTheme.panelSoft} key={managedUser.id}>
              <div className="grid gap-4 2xl:grid-cols-[minmax(240px,1fr)_minmax(560px,1.8fr)] 2xl:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Users className="text-rose-500" size={18} />
                    <strong className="text-white">{managedUser.name}</strong>
                    {managedUser.id === props.currentUserId ? <Badge tone="good">You</Badge> : null}
                    <Badge tone={managedUser.active ? "good" : "bad"}>{managedUser.active ? "Active" : "Disabled"}</Badge>
                  </div>
                  <p className="mt-2 break-all text-sm text-slate-400">{managedUser.email}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Joined {new Date(managedUser.createdAt).toLocaleDateString()} - Last login {managedUser.lastLoginAt ? new Date(managedUser.lastLoginAt).toLocaleString() : "never"}
                  </p>
                </div>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Field label="Role">
                    <select
                      className={`${dashboardTheme.input} py-2.5`}
                      value={managedUser.role}
                      onChange={(event) => props.updateUser(managedUser, { role: event.target.value as ManagedUser["role"] })}
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="customer">Customer</option>
                    </select>
                  </Field>
                  <Field label="Plan">
                    <select
                      className={`${dashboardTheme.input} py-2.5`}
                      value={managedUser.plan}
                      onChange={(event) => props.updateUser(managedUser, { plan: event.target.value as ManagedUser["plan"] })}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </Field>
                  <Field label="Subscription">
                    <select
                      className={`${dashboardTheme.input} py-2.5`}
                      value={managedUser.subscriptionStatus}
                      onChange={(event) => props.updateUser(managedUser, { subscriptionStatus: event.target.value as ManagedUser["subscriptionStatus"] })}
                    >
                      <option value="free">Free</option>
                      <option value="trialing">Trialing</option>
                      <option value="active">Active</option>
                      <option value="past_due">Past due</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </Field>
                  <Field label="Renews">
                    <input
                      className={`${dashboardTheme.input} py-2.5`}
                      type="datetime-local"
                      value={toDateTimeLocal(managedUser.subscriptionRenewsAt)}
                      onChange={(event) => props.updateUser(managedUser, { subscriptionRenewsAt: event.target.value ? new Date(event.target.value).toISOString() : null })}
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-3">
                <button
                  className={`${dashboardTheme.ghostButton} px-3 py-2 text-xs`}
                  onClick={() => {
                    setSelectedUser(managedUser);
                    setDetailMode("profile");
                    setDetailQuery("");
                  }}
                  type="button"
                >
                  Details
                </button>
                <button
                  className={`${managedUser.active ? dashboardTheme.dangerButton : dashboardTheme.ghostButton} px-3 py-2 text-xs`}
                  disabled={managedUser.id === props.currentUserId}
                  onClick={() => props.updateUser(managedUser, { active: !managedUser.active })}
                  type="button"
                >
                  {managedUser.active ? "Disable" : "Enable"}
                </button>
                <button
                  className={`${dashboardTheme.dangerButton} px-3 py-2 text-xs`}
                  disabled={managedUser.id === props.currentUserId}
                  onClick={() => props.deleteUser(managedUser)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
        </ScrollArea>
      </Panel>
      <Modal open={Boolean(selectedUser)} title={selectedUser ? `${selectedUser.name} Details` : "User Details"} onClose={() => setSelectedUser(null)}>
        {selectedUser ? (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                className={detailMode === "profile" ? dashboardTheme.button : dashboardTheme.ghostButton}
                onClick={() => setDetailMode("profile")}
                type="button"
              >
                Profile
              </button>
              <button
                className={detailMode === "scripts" ? dashboardTheme.button : dashboardTheme.ghostButton}
                onClick={() => setDetailMode("scripts")}
                type="button"
              >
                Scripts
              </button>
              <button
                className={detailMode === "keys" ? dashboardTheme.button : dashboardTheme.ghostButton}
                onClick={() => setDetailMode("keys")}
                type="button"
              >
                Keys
              </button>
            </div>
            {detailMode === "profile" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow label="Name" value={selectedUser.name} />
                <InfoRow label="Email" value={selectedUser.email} />
                <InfoRow label="Role" value={selectedUser.role} />
                <InfoRow label="Plan" value={selectedUser.plan} />
                <InfoRow label="Subscription" value={selectedUser.subscriptionStatus} />
                <InfoRow label="Last login" value={selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : "Never"} />
              </div>
            ) : null}
            {detailMode !== "profile" ? (
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input
                  className={`${dashboardTheme.input} py-2.5 pl-10`}
                  placeholder={`Search ${detailMode}`}
                  value={detailQuery}
                  onChange={(event) => setDetailQuery(event.target.value)}
                />
              </label>
            ) : null}
            {detailMode === "scripts" ? (
              <OwnerUserScripts
                query={detailQuery}
                scripts={props.scripts.filter((script) => selectedUser.role === "owner" ? true : script.ownerId === selectedUser.id)}
              />
            ) : null}
            {detailMode === "keys" ? (
              <OwnerUserKeys
                copy={props.copy}
                licenses={props.licenses.filter((license) => selectedUser.role === "owner" ? true : license.ownerId === selectedUser.id)}
                query={detailQuery}
                revealKey={revealOwnerKey}
                scriptNames={props.scriptNames}
                visibleKeys={visibleKeys}
                setVisibleKeys={setVisibleKeys}
              />
            ) : null}
          </div>
        ) : null}
      </Modal>
      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="All Scripts" meta={`${props.scripts.length} total`}>
          <ScrollArea className="max-h-[36vh] pr-1">
          <div className="grid gap-2">
            {props.scripts.length === 0 ? <EmptyState text="No scripts in the system yet." /> : null}
            {props.scripts.map((script) => (
              <div className="grid gap-2 rounded-xl border border-white/10 bg-black/35 p-3 text-sm sm:grid-cols-[1fr_auto]" key={script.id}>
                <div className="min-w-0">
                  <strong className="text-white">{script.name}</strong>
                  <code className="mt-1 block truncate text-xs text-rose-300">{script.slug}</code>
                </div>
                <Badge tone={script.active ? "good" : "bad"}>{script.active ? "Active" : "Disabled"}</Badge>
              </div>
            ))}
          </div>
          </ScrollArea>
        </Panel>
        <Panel title="All Keys" meta={`${props.licenses.length} total`}>
          <ScrollArea className="max-h-[36vh] pr-1">
          <div className="grid gap-2">
            {props.licenses.length === 0 ? <EmptyState text="No keys in the system yet." /> : null}
            {props.licenses.map((license) => (
              <div className="grid gap-2 rounded-xl border border-white/10 bg-black/35 p-3 text-sm sm:grid-cols-[1fr_auto]" key={license.id}>
                <div className="min-w-0">
                  <strong className="text-white">{license.label}</strong>
                  <p className="mt-1 truncate text-xs text-slate-500">{props.scriptNames(license.scriptIds) || "No scripts assigned"}</p>
                </div>
                <Badge tone={license.active ? "good" : "bad"}>{license.active ? "Active" : "Revoked"}</Badge>
              </div>
            ))}
          </div>
          </ScrollArea>
        </Panel>
      </section>
    </div>
  );
}

function OwnerUserScripts({ scripts, query }: { scripts: ScriptProject[]; query: string }) {
  const search = query.trim().toLowerCase();
  const filtered = scripts.filter((script) => !search || script.name.toLowerCase().includes(search) || script.slug.toLowerCase().includes(search));
  if (filtered.length === 0) return <EmptyState text="No scripts found for this user." />;
  return (
    <ScrollArea className="max-h-[46vh] rounded-2xl border border-white/10">
      {filtered.map((script) => (
        <div className="grid gap-2 border-b border-white/5 p-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]" key={script.id}>
          <div className="min-w-0">
            <strong className="block truncate text-white">{script.name}</strong>
            <code className="mt-1 block truncate text-xs text-rose-300">{script.slug}</code>
          </div>
          <Badge tone={script.active ? "good" : "bad"}>{script.active ? "Active" : "Disabled"}</Badge>
        </div>
      ))}
    </ScrollArea>
  );
}

function OwnerUserKeys({
  licenses,
  query,
  visibleKeys,
  setVisibleKeys,
  revealKey,
  copy,
  scriptNames,
}: {
  licenses: License[];
  query: string;
  visibleKeys: Record<string, string>;
  setVisibleKeys: Dispatch<SetStateAction<Record<string, string>>>;
  revealKey: (license: License) => Promise<void>;
  copy: (value: string) => void;
  scriptNames: (ids: string[]) => string;
}) {
  const search = query.trim().toLowerCase();
  const filtered = licenses.filter((license) => {
    const scripts = scriptNames(license.scriptIds).toLowerCase();
    return !search || license.label.toLowerCase().includes(search) || scripts.includes(search) || visibleKeys[license.id]?.toLowerCase().includes(search);
  });
  if (filtered.length === 0) return <EmptyState text="No keys found for this user." />;
  return (
    <ScrollArea className="max-h-[46vh] rounded-2xl border border-white/10">
      {filtered.map((license) => {
        const visibleKey = visibleKeys[license.id];
        return (
          <div className="grid gap-3 border-b border-white/5 p-3 text-sm last:border-b-0 lg:grid-cols-[1fr_1.25fr_auto]" key={license.id}>
            <div className="min-w-0">
              <strong className="block truncate text-white">{license.label}</strong>
              <span className="mt-1 block truncate text-xs text-slate-500">{scriptNames(license.scriptIds) || "No scripts"}</span>
            </div>
            <code className="truncate rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-rose-100">
              {visibleKey || (license.hasStoredKey ? "AEGIS-****************" : "Legacy hash only")}
            </code>
            <div className="flex flex-wrap justify-end gap-2">
              {visibleKey ? <button className={`${dashboardTheme.ghostButton} px-3 py-2 text-xs`} onClick={() => copy(visibleKey)} type="button">Copy</button> : null}
              <button
                className={`${dashboardTheme.ghostButton} flex items-center gap-2 px-3 py-2 text-xs`}
                disabled={!license.hasStoredKey}
                onClick={() => {
                  if (visibleKey) {
                    setVisibleKeys((current) => {
                      const next = { ...current };
                      delete next[license.id];
                      return next;
                    });
                  } else {
                    revealKey(license);
                  }
                }}
                type="button"
              >
                {visibleKey ? <EyeOff size={15} /> : <Eye size={15} />}
                {visibleKey ? "Hide" : "Show"}
              </button>
              <Badge tone={license.active ? "good" : "bad"}>{license.active ? "Active" : "Revoked"}</Badge>
            </div>
          </div>
        );
      })}
    </ScrollArea>
  );
}

function ApiDocs({ scripts }: { scripts: ScriptProject[] }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const scriptSlug = scripts[0]?.slug || "your-script-id";
  const payload = `{
  "scriptId": "${scriptSlug}",
  "key": "LICENSE_KEY",
  "userId": "123456",
  "username": "RobloxName",
  "placeId": "123",
  "deviceId": "executor-or-loader-device-id"
}`;
  const lua = `local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local API_URL = "https://YOUR-DOMAIN.vercel.app/api/auth/validate"
local SCRIPT_ID = "${scriptSlug}"

local function validateKey(key)
  local player = Players.LocalPlayer
  local response = game:HttpPost(API_URL, HttpService:JSONEncode({
    scriptId = SCRIPT_ID,
    key = key,
    userId = player.UserId,
    username = player.Name,
    placeId = game.PlaceId,
    deviceId = gethwid and gethwid() or "missing-device-id",
  }), "application/json")
  return HttpService:JSONDecode(response)
end`;
  return (
    <div className="grid gap-5">
      <Panel title="Advanced Mode" meta="Optional API access">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm leading-6 text-slate-400">
              The normal workflow uses protected loaders: upload a script, copy the loadstring, and let AegisLua show the key GUI automatically. Turn this on only if you want to integrate the raw validation API yourself.
            </p>
          </div>
          <button className={`${dashboardTheme.button} flex items-center justify-center gap-2`} onClick={() => setShowAdvanced(!showAdvanced)} type="button">
            <Code2 size={16} />
            {showAdvanced ? "Hide API docs" : "Show API docs"}
          </button>
        </div>
      </Panel>
      {showAdvanced ? (
        <>
          <Panel title="Validation Endpoint" meta="POST">
            <code className="block break-all rounded-xl bg-black/55 p-4 text-rose-100">/api/auth/validate</code>
          </Panel>
          <Panel title="JSON Payload">
            <pre className="scroll-surface overflow-auto rounded-xl bg-black/55 p-4 text-sm text-slate-200">{payload}</pre>
          </Panel>
          <Panel title="Lua Example">
            <pre className="scroll-surface overflow-auto rounded-xl bg-black/55 p-4 text-sm text-slate-200">{lua}</pre>
          </Panel>
          <Panel title="Response Rules">
            <ul className="grid gap-2 text-sm text-slate-300">
              <li>200 with <code className="text-rose-300">ok=true</code> means the script can run.</li>
              <li>403 with <code className="text-rose-300">invalid_license</code>, <code className="text-rose-300">device_limit_reached</code>, or <code className="text-rose-300">license_expired</code> means block execution.</li>
              <li>Every validation attempt is saved in Logs.</li>
            </ul>
          </Panel>
        </>
      ) : null}
    </div>
  );
}

function MultiScriptSelect({ scripts, value, onChange }: { scripts: ScriptProject[]; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <Field label="Scripts">
      <select className={`${dashboardTheme.input} min-h-28`} multiple value={value} onChange={(event) => onChange(Array.from(event.target.selectedOptions).map((option) => option.value))}>
        {scripts.map((script) => <option key={script.id} value={script.id}>{script.name}</option>)}
      </select>
    </Field>
  );
}

function SingleScriptSelect({ scripts, value, onChange }: { scripts: ScriptProject[]; value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Script to unlock">
      <select className={dashboardTheme.input} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choose a script</option>
        {scripts.map((script) => <option key={script.id} value={script.id}>{script.name}</option>)}
      </select>
    </Field>
  );
}

function providerLabel(provider: ClaimCampaign["provider"]) {
  const labels: Record<ClaimCampaign["provider"], string> = {
    lootlabs: "LootLabs",
  };
  return labels[provider] || provider;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function loaderSnippetFor(scriptSlug: string) {
  const origin = typeof window === "undefined" ? "https://YOUR-DOMAIN.vercel.app" : window.location.origin;
  return `loadstring(game:HttpGet("${origin}/api/loader/${encodeURIComponent(scriptSlug)}"))()`;
}

function KeyBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm">
      <span className="text-slate-300">{label}</span>
      <code className="mt-2 block break-all text-rose-100">{value}</code>
    </div>
  );
}

function CopyBox({ label, value, copy, compact = false }: { label: string; value: string; copy: (value: string) => void; compact?: boolean }) {
  return (
    <div className={`${compact ? "mt-4" : ""} rounded-xl border border-rose-400/30 bg-rose-500/10 p-4`}>
      <span className="text-sm font-bold text-rose-100">{label}</span>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <code className="min-w-0 flex-1 break-all rounded-lg bg-black/55 p-3 text-sm text-rose-100">{value}</code>
        <button className={dashboardTheme.ghostButton} onClick={() => copy(value)} type="button">Copy</button>
      </div>
    </div>
  );
}

function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/75 p-4 py-8 backdrop-blur-xl sm:items-center" onMouseDown={onClose}>
      <section
        className="modal-pop glass-card scroll-surface max-h-[calc(100vh-4rem)] w-full max-w-2xl overflow-y-auto rounded-xl p-5 shadow-2xl shadow-black/60"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>{title}</h2>
          <button className={`${dashboardTheme.ghostButton} px-3 py-2 text-xs`} onClick={onClose} type="button">Close</button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}

function makeDailyPoints(dates: string[]) {
  const now = new Date();
  const points = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, label: date.toLocaleDateString("en-US", { weekday: "short" }), value: 0 };
  });
  const byKey = new Map(points.map((point) => [point.key, point]));
  for (const raw of dates) {
    const key = new Date(raw).toISOString().slice(0, 10);
    const point = byKey.get(key);
    if (point) point.value += 1;
  }
  return points.map(({ label, value }) => ({ label, value }));
}

function slugifyClient(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "new-script";
}
