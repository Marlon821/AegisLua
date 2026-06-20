import Link from "next/link";
import { BarChart3, Code2, Globe2, KeyRound, Lock, Shield, Zap } from "lucide-react";
import { AnimatedNumber, InteractiveShell, Reveal } from "@/components/motion";

const features = [
  [KeyRound, "Key-based Auth", "Issue encrypted keys per user. Revoke or pause access instantly."],
  [Lock, "HWID Locking", "Bind each key to a hardware fingerprint so sharing gets shut down."],
  [Shield, "Tamper Detection", "Track suspicious validation attempts and deny access in real time."],
  [Zap, "Fast Validation", "Designed for quick checks before your secured Lua script continues."],
  [Globe2, "LootLabs Monetization", "Create LootLabs key flows that return users to a signed AegisLua claim page."],
  [Code2, "Protected Loader", "Upload a Lua file, store it encrypted, and distribute a key-gated loadstring."],
];

const stats = [
  ["2.4M+", "Authentications / day"],
  ["99.99%", "Uptime target"],
  ["<80ms", "Median validation"],
  ["14K+", "Scripts protected"],
];

export default function Home() {
  return (
    <InteractiveShell className="relative min-h-screen overflow-hidden">
      <div className="liquid-grid pointer-events-none absolute inset-0" />
      <Nav />

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:pt-28">
        <Reveal className="max-w-3xl">
          <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-950/30 px-4 py-2 font-mono text-xs text-rose-300">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-rose-500" />
            Now supporting HWID v2 locking
          </p>
          <h1 className="text-glow-red text-6xl font-black leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
            Secure your
            <span className="block text-rose-600">Lua scripts.</span>
            Seriously.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400">
            Key-based authentication for Lua scripts. HWID locking, protected loaders, LootLabs monetization, and real-time monitoring from one dashboard.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link className="rounded-xl bg-rose-600 px-7 py-4 font-black text-white shadow-xl shadow-rose-950/40 transition hover:-translate-y-0.5 hover:bg-rose-500" href="/login?mode=signup">
              Start for free
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white" href="/pricing">
              <Code2 size={16} />
              View pricing
            </Link>
          </div>
        </Reveal>

        <Reveal className="glass-card float-panel mt-16 max-w-2xl rounded-2xl" delay={130}>
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="ml-3 font-mono text-xs text-zinc-500">main.lua</span>
          </div>
          <pre className="overflow-auto p-6 font-mono text-sm leading-7 text-zinc-400">
            <code>{`-- 1. Load the module
local LuaAuth = require("aegislua")

-- 2. Authenticate, then run
local ok, err = LuaAuth.check("YOUR_PROJECT_ID")
if not ok then error(err) end`}</code>
          </pre>
        </Reveal>
      </section>

      <section className="relative border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-9 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([value, label], index) => (
            <Reveal delay={index * 80} key={label}>
              <strong className="block text-2xl font-black text-rose-500">{formatStat(value)}</strong>
              <span className="mt-2 block text-sm text-zinc-500">{label}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-rose-500">Features</p>
          <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight text-white sm:text-5xl">
            Everything you need. Nothing you do not.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map(([Icon, title, text], index) => (
            <Reveal className="glass-card rounded-2xl p-7 transition hover:-translate-y-1 hover:border-rose-500/40" delay={index * 75} key={title as string}>
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-rose-500/40 bg-rose-950/40 text-rose-400">
                <Icon size={18} />
              </div>
              <h3 className="mt-7 font-black text-white">{title as string}</h3>
              <p className="mt-4 leading-7 text-zinc-500">{text as string}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </InteractiveShell>
  );
}

function formatStat(value: string) {
  if (value === "2.4M+") return <><AnimatedNumber value={2.4} decimals={1} suffix="M+" /></>;
  if (value === "99.99%") return <AnimatedNumber value={99.99} decimals={2} suffix="%" />;
  if (value === "<80ms") return <><span>&lt;</span><AnimatedNumber value={80} suffix="ms" /></>;
  return <AnimatedNumber value={14} suffix="K+" />;
}

function Nav() {
  return (
    <nav className="relative mx-4 mt-4 rounded-2xl glass-shell">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link className="flex items-center gap-3" href="/">
          <Shield className="text-rose-500" size={18} />
          <span className="brand-word text-sm text-white">AEGISLUA</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-zinc-500 md:flex">
          <a className="transition hover:text-white" href="#features">Features</a>
          <Link className="transition hover:text-white" href="/pricing">Pricing</Link>
          <Link className="transition hover:text-white" href="/dashboard">Docs</Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link className="hidden px-3 py-2 font-semibold text-zinc-500 transition hover:text-white sm:inline-flex" href="/login">Sign in</Link>
          <Link className="magnetic-button rounded-xl bg-rose-600 px-5 py-3 font-black text-white transition hover:bg-rose-500" href="/login?mode=signup">Get started</Link>
        </div>
      </div>
    </nav>
  );
}
