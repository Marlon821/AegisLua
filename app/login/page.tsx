"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, Shield } from "lucide-react";
import { InteractiveShell, Reveal } from "@/components/motion";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center text-slate-300">Loading AegisLua...</main>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "reset" | "new-password">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") setAuthMode("signup");
    const reset = searchParams.get("reset");
    if (reset) {
      setResetToken(reset);
      setAuthMode("new-password");
    }
  }, [searchParams]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (authMode === "reset") {
      const response = await fetch("/api/account/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setLoading(false);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Could not create reset link.");
        return;
      }
      setResetUrl(payload.resetUrl || "");
      setMessage(payload.sent ? "Check your email for a reset link." : "If that account exists, a reset link has been created.");
      return;
    }

    if (authMode === "new-password") {
      const response = await fetch("/api/account/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: resetToken, password }),
      });
      setLoading(false);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Could not reset password.");
        return;
      }
      setPassword("");
      setAuthMode("login");
      setMessage("Password updated. You can sign in now.");
      return;
    }

    const response = await fetch(authMode === "login" ? "/api/account/login" : "/api/account/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Could not sign in.");
      return;
    }

    router.push("/dashboard");
  }

  const title = authMode === "login" ? "Welcome back" : authMode === "signup" ? "Create your account" : authMode === "reset" ? "Reset password" : "Choose a new password";
  const subtitle =
    authMode === "login"
      ? "Sign in to manage scripts and keys."
      : authMode === "signup"
        ? "Create an account to start protecting scripts."
        : authMode === "reset"
          ? "Enter your email and we will send a reset link."
          : "Enter a new password for your account.";
  const submitLabel = authMode === "login" ? "Login" : authMode === "signup" ? "Create account" : authMode === "reset" ? "Send reset link" : "Update password";

  return (
    <InteractiveShell className="relative grid min-h-screen place-items-center px-6 py-10">
      <div className="liquid-grid pointer-events-none absolute inset-0" />
      <Link className="absolute left-8 top-8 inline-flex items-center gap-2 text-sm text-zinc-600 transition hover:text-white" href="/">
        <ArrowLeft size={16} />
        Back
      </Link>
      <section className="relative grid w-full max-w-md gap-10">
        <Reveal className="text-center">
          <Link className="mb-10 inline-flex items-center gap-3" href="/">
            <Shield className="text-rose-500" size={18} />
            <span className="brand-word text-sm text-white">AEGISLUA</span>
          </Link>
        </Reveal>

        <Reveal>
        <form className="glass-card rounded-2xl p-8" onSubmit={submit}>
          <div className="mb-7 grid grid-cols-2 rounded-xl border border-white/10 bg-black/40 p-1">
            <button className={`rounded-lg px-4 py-2 text-sm font-black transition ${authMode === "login" ? "bg-rose-600 text-white" : "text-zinc-500 hover:bg-white/10 hover:text-white"}`} onClick={() => setAuthMode("login")} type="button">
              Login
            </button>
            <button className={`rounded-lg px-4 py-2 text-sm font-black transition ${authMode === "signup" ? "bg-rose-600 text-white" : "text-zinc-500 hover:bg-white/10 hover:text-white"}`} onClick={() => setAuthMode("signup")} type="button">
              Sign up
            </button>
          </div>

          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>

          {error ? <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
          {message ? <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">{message}</div> : null}
          {resetUrl ? (
            <a className="mt-3 block break-all rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-500/15" href={resetUrl}>
              Local reset link: {resetUrl}
            </a>
          ) : null}

          <div className="mt-6 grid gap-4">
            {authMode === "signup" ? (
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Name
                <input className="rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-rose-400" value={name} onChange={(event) => setName(event.target.value)} />
              </label>
            ) : null}
            {authMode !== "new-password" ? (
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Email
                <input className="rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-white outline-none transition focus:border-rose-400" value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
              </label>
            ) : null}
            {authMode !== "reset" ? (
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Password
                <span className="relative">
                  <input className="w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 pr-11 text-white outline-none transition focus:border-rose-400" value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
                  <Eye className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                </span>
              </label>
            ) : null}
          </div>

          <button className="magnetic-button mt-6 w-full rounded-xl bg-rose-600 px-5 py-3 font-black text-white shadow-lg shadow-rose-950/30 transition hover:-translate-y-0.5 hover:bg-rose-500 disabled:opacity-60" disabled={loading} type="submit">
            {loading ? "Working..." : submitLabel}
          </button>

          {authMode === "login" ? (
            <button className="mt-4 w-full text-center text-sm font-semibold text-zinc-500 transition hover:text-rose-400" onClick={() => setAuthMode("reset")} type="button">
              Forgot password?
            </button>
          ) : null}

          <p className="mt-8 text-center text-sm text-zinc-500">
            {authMode === "login" || authMode === "reset" ? "Do not have an account? " : "Already have an account? "}
            <button className="font-semibold text-rose-500 hover:text-rose-400" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} type="button">
              {authMode === "login" || authMode === "reset" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
        </Reveal>
      </section>
    </InteractiveShell>
  );
}
