import Link from "next/link";
import { Code2, KeyRound, Shield, Upload } from "lucide-react";
import { InteractiveShell, Reveal } from "@/components/motion";

const steps = [
  ["Upload", "Upload a .lua or .luau file from the Scripts tab."],
  ["Protect", "AegisLua stores the source encrypted and generates a hosted loader."],
  ["Key", "Create a long-term key or rotating public key for that script."],
  ["Run", "Users run the loadstring, enter the key, and receive the protected script only after validation."],
];

export default function DocsPage() {
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
            <Link className="hidden px-3 py-2 font-semibold text-zinc-500 transition hover:text-white sm:inline-flex" href="/pricing">Pricing</Link>
            <Link className="rounded-xl bg-rose-600 px-5 py-3 font-black text-white transition hover:bg-rose-500" href="/dashboard">Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-7xl px-6 py-20">
        <Reveal className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-rose-500">Docs</p>
          <h1 className="mt-5 text-5xl font-black leading-tight text-white sm:text-6xl">Protect Lua scripts without making users think.</h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            AegisLua gives creators a hosted loader, key validation, HWID checks, and monetized claim flows from one dashboard.
          </p>
        </Reveal>

        <section className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(([title, text], index) => (
            <Reveal className="glass-card rounded-2xl p-5" delay={index * 70} key={title}>
              <span className="grid size-10 place-items-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300">{index + 1}</span>
              <h2 className="mt-5 font-black text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-500">{text}</p>
            </Reveal>
          ))}
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Upload className="text-rose-500" />
              <h2 className="text-2xl font-black text-white">Loader Flow</h2>
            </div>
            <pre className="mt-5 overflow-auto rounded-2xl border border-white/10 bg-black/45 p-4 text-sm leading-7 text-zinc-300">
              <code>{`loadstring(game:HttpGet("https://your-domain.vercel.app/api/loader/your-script"))()`}</code>
            </pre>
            <p className="mt-4 text-sm leading-6 text-zinc-500">
              The loader opens the AegisLua key prompt and requests the protected source only after the server validates the key.
            </p>
          </Reveal>

          <Reveal className="glass-card rounded-2xl p-6" delay={100}>
            <div className="flex items-center gap-3">
              <KeyRound className="text-rose-500" />
              <h2 className="text-2xl font-black text-white">Keys</h2>
            </div>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-zinc-400">
              <p><strong className="text-white">Long-term keys</strong> are for customers, testers, or private access.</p>
              <p><strong className="text-white">Auto keys</strong> rotate on a schedule and are useful for public or monetized flows.</p>
              <p><strong className="text-white">Ad systems</strong> attach an existing key to a LootLabs claim link.</p>
            </div>
          </Reveal>
        </section>

        <Reveal className="glass-card mt-12 rounded-2xl p-6" delay={150}>
          <div className="flex items-center gap-3">
            <Code2 className="text-rose-500" />
            <h2 className="text-2xl font-black text-white">Security Model</h2>
          </div>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-400">
            The protected source is encrypted at rest and is not included in the public loader. Client-side Lua can always be inspected once it runs, so AegisLua focuses on server-side access control, key limits, HWID binding, and execution logs.
          </p>
        </Reveal>
      </main>
    </InteractiveShell>
  );
}
