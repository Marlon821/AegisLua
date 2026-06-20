"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Shield } from "lucide-react";
import { InteractiveShell, Reveal } from "@/components/motion";

const plans = [
  {
    tier: "Starter",
    name: "Free",
    monthly: 0,
    description: "For solo developers.",
    features: ["3 API keys", "1,000 auth/mo", "HWID locking", "Basic dashboard"],
    cta: "Get started",
  },
  {
    tier: "Pro",
    name: "Pro",
    monthly: 12,
    description: "For scripts with a real user base.",
    features: ["Unlimited keys", "50,000 auth/mo", "HWID + resets", "Key expiry", "Ad systems", "Priority support"],
    cta: "Start free trial",
    featured: true,
  },
  {
    tier: "Enterprise",
    name: "Enterprise",
    monthly: 49,
    description: "High-volume and resellers.",
    features: ["Unlimited everything", "Custom rate limits", "IP whitelisting", "Audit logs", "Dedicated instance", "SLA"],
    cta: "Contact sales",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <InteractiveShell className="relative min-h-screen overflow-hidden">
      <div className="liquid-grid pointer-events-none absolute inset-0" />
      <nav className="relative mx-4 mt-4 rounded-2xl glass-shell">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link className="flex items-center gap-3" href="/">
            <Shield className="text-rose-500" size={18} />
            <span className="brand-word text-sm text-white">AEGISLUA</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link className="px-3 py-2 font-semibold text-zinc-500 transition hover:text-white" href="/">Home</Link>
            <Link className="magnetic-button rounded-xl bg-rose-600 px-5 py-3 font-black text-white transition hover:bg-rose-500" href="/login?mode=signup">Get started</Link>
          </div>
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-rose-500">Pricing</p>
          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h1 className="text-5xl font-black text-white">Simple pricing.</h1>
            <div className="flex items-center gap-3 text-sm">
              <button className={annual ? "text-zinc-500" : "font-semibold text-white"} onClick={() => setAnnual(false)} type="button">Monthly</button>
              <button
                aria-pressed={annual}
                className={`h-6 w-12 rounded-full p-1 transition ${annual ? "bg-rose-600" : "bg-zinc-800"}`}
                onClick={() => setAnnual((value) => !value)}
                type="button"
              >
                <span className={`block h-4 w-4 rounded-full bg-white transition ${annual ? "translate-x-6" : ""}`} />
              </button>
              <button className={annual ? "font-semibold text-white" : "text-zinc-500"} onClick={() => setAnnual(true)} type="button">Annual <span className="text-rose-500">-25%</span></button>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <Reveal className={`glass-card relative rounded-2xl p-8 ${plan.featured ? "border-rose-500/40 shadow-rose-950/30" : ""}`} delay={index * 110} key={plan.name}>
              {plan.featured ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-rose-600 px-5 py-1 text-xs font-black text-white">MOST POPULAR</span> : null}
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-600">{plan.tier}</p>
              <h2 className="mt-4 text-3xl font-black text-white">{plan.name}</h2>
              <div className="mt-3 flex items-end gap-2">
                <strong className="text-4xl font-black text-white">{priceLabel(plan.monthly, annual)}</strong>
                {plan.monthly > 0 ? <span className="pb-1 text-zinc-500">/ {annual ? "yr" : "mo"}</span> : null}
              </div>
              <p className="mt-4 text-zinc-500">{plan.description}</p>
              <ul className="mt-8 grid gap-4 text-sm text-zinc-400">
                {plan.features.map((feature) => (
                  <li className="flex items-center gap-3" key={feature}>
                    <CheckCircle2 className="text-rose-500" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link className={`magnetic-button mt-10 block rounded-xl px-5 py-3 text-center font-black transition ${plan.featured ? "bg-rose-600 text-white hover:bg-rose-500" : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/10"}`} href="/login?mode=signup">
                {plan.cta}
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </InteractiveShell>
  );
}

function priceLabel(monthly: number, annual: boolean) {
  if (monthly === 0) return "Free";
  if (!annual) return `$${monthly}`;
  return `$${Math.round(monthly * 12 * 0.75)}`;
}
