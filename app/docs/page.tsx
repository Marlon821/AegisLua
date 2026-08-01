import Link from "next/link";
import { ArrowRight, Check, Code2, KeyRound, LockKeyhole, ShieldCheck, Upload, type LucideIcon } from "lucide-react";
import { InteractiveShell, Reveal } from "@/components/motion";

const steps: Array<[LucideIcon, string, string]> = [
  [Upload, "Upload your source", "Add a .lua or .luau file from Scripts. AegisLua encrypts the stored source and gives the project a stable script ID."],
  [KeyRound, "Issue access", "Create a private license for a customer, or use an auto-key / claim campaign for time-limited public access."],
  [LockKeyhole, "Set the limits", "Choose user, device, and expiry limits. Device binding keeps a leaked key from becoming an open invitation."],
  [Code2, "Ship the loader", "Use your hosted loader URL. It checks the license before the protected source is made available to run."],
];

export default function DocsPage() {
  return (
    <InteractiveShell className="site-shell min-h-screen overflow-hidden">
      <div className="site-noise pointer-events-none fixed inset-0" />
      <Nav />

      <main className="relative mx-auto max-w-7xl px-6 pb-28 pt-20 sm:pt-28">
        <Reveal className="max-w-3xl">
          <p className="eyebrow"><span /> Documentation</p>
          <h1 className="hero-title mt-6">Protection that <em>stays</em> out of your way.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-400">
            Get a protected Lua project from source file to controlled loader in four clear steps. AegisLua handles the access checks; you keep shipping.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link className="action-button action-button-primary" href="/dashboard">Open dashboard <ArrowRight size={16} /></Link>
            <Link className="action-button action-button-quiet" href="/pricing">View plans</Link>
          </div>
        </Reveal>

        <section className="mt-20 grid gap-px overflow-hidden rounded-[1.5rem] border border-white/[.08] bg-white/[.08] md:grid-cols-2">
          {steps.map(([Icon, title, text], index) => (
            <Reveal className="feature-tile bg-[#0a0b10] p-7 sm:p-9" delay={index * 70} key={title}>
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-lime-300/20 bg-lime-300/10 text-lime-200"><Icon size={19} /></div>
              <span className="mt-10 block font-mono text-[11px] uppercase tracking-[.2em] text-lime-300/70">0{index + 1}</span>
              <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
              <p className="mt-3 max-w-md leading-7 text-zinc-500">{text}</p>
            </Reveal>
          ))}
        </section>

        <section className="mt-20 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <Reveal className="terminal-card overflow-hidden rounded-[1.75rem] p-1">
            <div className="h-full rounded-[1.5rem] border border-white/[.08] bg-[#0c0d12] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <p className="eyebrow"><span /> Hosted loader</p>
                <span className="font-mono text-[10px] text-white/30">GET /api/loader/[script]</span>
              </div>
              <h2 className="section-title mt-7 max-w-md text-[clamp(2.5rem,4vw,3.75rem)]">One URL. A controlled entry point.</h2>
              <pre className="scroll-surface mt-8 overflow-auto rounded-xl border border-white/[.08] bg-black/40 p-4 font-mono text-[12px] leading-7 text-zinc-300"><code><span className="text-violet-300">loadstring</span>(game:<span className="text-lime-300">HttpGet</span>(<span className="text-lime-300">&quot;https://your-domain.vercel.app/api/loader/your-script&quot;</span>))()</code></pre>
              <p className="mt-5 text-sm leading-6 text-zinc-500">Replace <code className="text-lime-200">your-script</code> with the project slug generated in Scripts. Keep this loader in the script you distribute.</p>
            </div>
          </Reveal>

          <Reveal className="glass-card rounded-[1.75rem] p-7 sm:p-9" delay={100}>
            <p className="eyebrow"><span /> What AegisLua checks</p>
            <h2 className="section-title mt-6 text-[clamp(2.5rem,4vw,3.75rem)]">Access before execution.</h2>
            <ul className="mt-9 grid gap-5 text-sm leading-6 text-zinc-400">
              {[
                "A valid active key for the requested script.",
                "Configured user and hardware-device limits.",
                "License and claim-link expiration rules.",
                "An execution log for every allow or deny decision.",
              ].map((item) => <li className="flex gap-3" key={item}><Check className="mt-0.5 shrink-0 text-lime-300" size={16} />{item}</li>)}
            </ul>
          </Reveal>
        </section>

        <Reveal className="cta-slab mt-20 overflow-hidden rounded-[1.75rem] px-7 py-12 sm:px-12 sm:py-16" delay={150}>
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div><p className="eyebrow"><span /> A practical security model</p><h2 className="section-title mt-5 max-w-2xl">Control access. Expect clients to be inspectable.</h2></div>
            <p className="max-w-sm text-sm leading-7 text-zinc-400">Protected source stays encrypted at rest and out of the public loader. Once any Lua runs on a client it can be inspected, so use AegisLua for access control, binding, limits, and visibility.</p>
          </div>
        </Reveal>
      </main>
    </InteractiveShell>
  );
}

function Nav() {
  return <nav className="relative z-30 mx-auto max-w-7xl px-6 pt-5"><div className="flex items-center justify-between rounded-2xl border border-white/[.08] bg-[#0c0d12]/75 px-4 py-3 backdrop-blur-xl"><Link className="flex items-center gap-2.5" href="/"><ShieldCheck className="text-lime-300" size={19} /><span className="brand-word text-sm text-white">AEGISLUA</span></Link><div className="hidden items-center gap-7 text-sm text-zinc-400 md:flex"><Link className="transition hover:text-lime-200" href="/pricing">Pricing</Link><Link className="text-lime-200" href="/docs">Docs</Link><Link className="transition hover:text-lime-200" href="/dashboard">Dashboard</Link></div><Link className="action-button action-button-small action-button-primary" href="/login?mode=signup">Get started</Link></div></nav>;
}
