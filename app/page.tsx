import Link from "next/link";
import { ArrowRight, Check, Code2, Globe2, KeyRound, LockKeyhole, ShieldCheck, Zap } from "lucide-react";
import { AnimatedNumber, InteractiveShell, Reveal } from "@/components/motion";
import { Link000, Link003 } from "@/components/ui/skiper-ui/skiper40";
import { ProgressiveBlur } from "@/components/ui/skiper-ui/skiper41";

const features = [
  [KeyRound, "License controls", "Issue, revoke, and rotate access from one place."],
  [LockKeyhole, "Device binding", "Keep keys personal with configurable HWID limits."],
  [Globe2, "Claim flows", "Turn LootLabs completions into controlled access."],
  [Zap, "Fast checks", "Validate before the protected script gets to work."],
];

export default function Home() {
  return <InteractiveShell className="site-shell min-h-screen overflow-hidden">
    <div className="site-noise pointer-events-none fixed inset-0" />
    <Nav />
    <main>
      <section className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-6 pb-20 pt-24 lg:grid-cols-[1.1fr_.9fr] lg:pt-32">
        <Reveal className="relative z-10">
          <p className="eyebrow"><span /> Script security, without the ceremony</p>
          <h1 className="hero-title mt-6 max-w-3xl">Protection that <em>ships</em> with your Lua.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-400">AegisLua gives script creators a clean control plane for licensing, device binding, protected loaders, and monetized claim flows.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link className="action-button action-button-primary" href="/login?mode=signup">Start building <ArrowRight size={16} /></Link>
            <Link003 className="action-button action-button-quiet" href="/pricing">See plans</Link003>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-500">
            {["Free starter plan", "No credit card", "Deploy in minutes"].map((item) => <span className="inline-flex items-center gap-2" key={item}><Check size={15} className="text-lime-300" />{item}</span>)}
          </div>
        </Reveal>
        <Reveal className="relative" delay={120}>
          <div className="orbital-ring absolute -inset-10" />
          <div className="terminal-card relative overflow-hidden rounded-[1.75rem] p-1">
            <div className="rounded-[1.5rem] border border-white/[.08] bg-[#0c0d12] p-5 sm:p-7">
              <div className="mb-10 flex items-center justify-between"><div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-violet-300" /><i className="h-2.5 w-2.5 rounded-full bg-amber-300" /><i className="h-2.5 w-2.5 rounded-full bg-lime-300" /></div><span className="font-mono text-[11px] text-white/30">aegis / protected-loader</span></div>
              <div className="font-mono text-[13px] leading-7 text-zinc-400"><p><span className="text-violet-300">local</span> Aegis = require(<span className="text-lime-300">&quot;aegislua&quot;</span>)</p><p><span className="text-violet-300">local</span> access = Aegis.check(<span className="text-lime-300">&quot;project_alpha&quot;</span>)</p><p className="mt-3 text-white/30">if access then</p><p className="pl-5 text-white/75">loadstring(protected_source)()</p><p className="text-white/30">end</p></div>
              <div className="mt-10 grid grid-cols-3 gap-2 border-t border-white/[.07] pt-5 text-center"><Metric value="99.99%" label="uptime" /><Metric value="&lt;80ms" label="validation" /><Metric value="24/7" label="visibility" /></div>
            </div>
          </div>
        </Reveal>
      </section>
      <section className="relative border-y border-white/[.07] bg-white/[.018]">
        <div className="mx-auto grid max-w-7xl gap-7 px-6 py-8 sm:grid-cols-3"><Stat value={<><AnimatedNumber value={2.4} decimals={1} suffix="M+" /></>} label="authentications protected" /><Stat value={<AnimatedNumber value={14} suffix="K+" />} label="scripts in the field" /><Stat value="One API" label="for your whole stack" /></div>
      </section>
      <section className="relative mx-auto max-w-7xl px-6 py-28">
        <Reveal><p className="eyebrow"><span /> Built for real releases</p><h2 className="section-title mt-5 max-w-2xl">A focused toolset for keeping control.</h2></Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[1.5rem] border border-white/[.08] bg-white/[.08] md:grid-cols-2">
          {features.map(([Icon, title, copy], index) => <Reveal delay={index * 70} key={title as string} className="feature-tile bg-[#0a0b10] p-7 sm:p-9"><div className="grid h-11 w-11 place-items-center rounded-xl border border-lime-300/20 bg-lime-300/10 text-lime-200"><Icon size={19} /></div><h3 className="mt-12 text-xl font-semibold text-white">{title as string}</h3><p className="mt-3 max-w-sm leading-7 text-zinc-500">{copy as string}</p></Reveal>)}
        </div>
      </section>
      <section className="relative mx-auto max-w-7xl px-6 pb-28"><Reveal className="cta-slab overflow-hidden rounded-[1.75rem] px-7 py-12 sm:px-12 sm:py-16"><ProgressiveBlur position="bottom" backgroundColor="#12151c" height="90px" blurAmount="3px" /><div className="relative z-20 flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="eyebrow text-lime-200"><span /> Secure the next release</p><h2 className="section-title mt-5 max-w-xl">Give your scripts a proper perimeter.</h2></div><Link className="action-button action-button-primary shrink-0" href="/login?mode=signup">Create an account <ArrowRight size={16} /></Link></div></Reveal></section>
    </main>
    <footer className="border-t border-white/[.07] px-6 py-7"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 text-sm text-zinc-600"><span>© 2026 AegisLua</span><div className="flex gap-6"><Link000 href="/docs">Documentation</Link000><Link000 href="/pricing">Pricing</Link000><Link000 href="/login">Sign in</Link000></div><a className="text-zinc-700 transition hover:text-lime-200" href="https://skiper-ui.com" rel="noreferrer" target="_blank">Interactions by Skiper UI</a></div></footer>
  </InteractiveShell>;
}

function Nav() { return <nav className="relative z-30 mx-auto max-w-7xl px-6 pt-5"><div className="flex items-center justify-between rounded-2xl border border-white/[.08] bg-[#0c0d12]/75 px-4 py-3 backdrop-blur-xl"><Link className="flex items-center gap-2.5" href="/"><ShieldCheck className="text-lime-300" size={19} /><span className="brand-word text-sm text-white">AEGISLUA</span></Link><div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex"><Link000 href="/pricing">Pricing</Link000><Link000 href="/docs">Docs</Link000><Link000 href="/dashboard">Dashboard</Link000></div><Link className="action-button action-button-small action-button-primary" href="/login?mode=signup">Get started</Link></div></nav>; }
function Metric({ value, label }: { value: string; label: string }) { return <div><strong className="block font-mono text-xs text-lime-200">{value}</strong><span className="mt-1 block text-[10px] uppercase tracking-wider text-white/30">{label}</span></div>; }
function Stat({ value, label }: { value: React.ReactNode; label: string }) { return <div><strong className="font-display text-2xl font-semibold text-white">{value}</strong><span className="ml-3 text-sm text-zinc-500">{label}</span></div>; }
