"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { InteractiveShell, Reveal } from "@/components/motion";

type ClaimInfo = {
  name: string;
  provider: string;
  active: boolean;
  status: string;
  expiresAt: string;
  remaining: number;
};

export default function ClaimPage({ params }: { params: Promise<{ ticket: string }> }) {
  const { ticket } = use(params);
  const [claim, setClaim] = useState<ClaimInfo | null>(null);
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    async function loadClaim() {
      const response = await fetch(`/api/claim/${encodeURIComponent(ticket)}`, { cache: "no-store" });
      setLoading(false);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error || "This claim link is not available.");
        return;
      }
      const payload = await response.json();
      setClaim(payload.claim);
    }

    loadClaim();
  }, [ticket]);

  async function redeem() {
    setRedeeming(true);
    setError("");
    const response = await fetch(`/api/claim/${encodeURIComponent(ticket)}/redeem`, { method: "POST" });
    setRedeeming(false);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.reason || payload.error || "Could not redeem this claim.");
      return;
    }
    setKey(payload.key);
    setClaim((current) => current ? { ...current, status: "redeemed", remaining: Math.max(0, current.remaining - 1) } : current);
  }

  return (
    <InteractiveShell className="relative grid min-h-screen place-items-center px-6 py-10">
      <div className="liquid-grid pointer-events-none absolute inset-0" />
      <Reveal className="glass-card relative w-full max-w-xl rounded-3xl p-6">
        <Link className="mb-8 flex items-center gap-3" href="/">
          <Shield className="text-rose-500" size={18} />
          <strong className="brand-word text-sm text-white">AEGISLUA</strong>
        </Link>

        <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-rose-500">Key Claim</p>
        <h1 className="mt-3 text-4xl font-black text-white">Redeem your script key</h1>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Your key is generated server-side and shown once. Keep it somewhere safe after redeeming.
        </p>

        {loading ? <div className="mt-6 rounded-xl border border-white/10 bg-black/45 p-4 text-slate-300">Checking claim link...</div> : null}
        {error ? <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div> : null}

        {claim ? (
          <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-black/45 p-4 text-sm">
            <Info label="Campaign" value={claim.name} />
            <Info label="Provider" value={claim.provider} />
            <Info label="Status" value={claim.status} />
            <Info label="Remaining" value={String(claim.remaining)} />
            <Info label="Expires" value={new Date(claim.expiresAt).toLocaleString()} />
          </div>
        ) : null}

        {key ? (
          <div className="mt-6 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
            <span className="text-sm font-bold text-rose-100">Your key, shown once</span>
            <code className="mt-3 block break-all rounded-lg bg-black/55 p-3 text-rose-100">{key}</code>
          </div>
        ) : (
          <button
            className="magnetic-button mt-6 w-full rounded-xl bg-rose-600 px-5 py-3 font-black text-white shadow-lg shadow-rose-950/30 transition hover:-translate-y-0.5 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!claim || claim.status !== "available" || redeeming}
            onClick={redeem}
            type="button"
          >
            {redeeming ? "Redeeming..." : "Redeem key"}
          </button>
        )}
      </Reveal>
    </InteractiveShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <span className="text-slate-500">{label}</span>
      <strong className="min-w-0 truncate text-white">{value}</strong>
    </div>
  );
}
