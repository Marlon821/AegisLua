"use client";

import React from "react";
import { AnimatedNumber } from "@/components/motion";

export const dashboardTheme = {
  page: "min-h-screen bg-transparent text-slate-100",
  sidebar: "border-b border-white/10 bg-black/70 p-5 backdrop-blur-2xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r",
  panel: "glass-card rounded-2xl p-5",
  panelSoft: "rounded-2xl border border-white/10 bg-black/35 p-4 shadow-inner shadow-white/[0.02]",
  input:
    "w-full rounded-xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-rose-400",
  button:
    "rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-950/30 transition hover:-translate-y-0.5 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50",
  ghostButton:
    "rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-slate-200 transition hover:-translate-y-0.5 hover:border-rose-500/40 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50",
  dangerButton:
    "rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-400/20",
  label: "grid gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500",
};

export function Panel({
  title,
  meta,
  children,
  id,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className={dashboardTheme.panel} id={id}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="text-xl font-black text-white">{title}</h2>
        {meta ? <span className="text-sm text-slate-400">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <article className="animate-rise glass-card rounded-2xl p-5 transition hover:-translate-y-1">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <strong className="mt-4 block text-4xl font-black text-white">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </strong>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={dashboardTheme.label}>
      {label}
      {children}
    </label>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "good" | "bad" | "warn"; children: React.ReactNode }) {
  const tones = {
    neutral: "border-white/10 bg-white/10 text-slate-200",
    good: "border-rose-400/30 bg-rose-500/15 text-rose-100",
    bad: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
    warn: "border-amber-300/20 bg-amber-400/15 text-amber-100",
  };
  return <span className={`h-fit rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; icon?: React.ComponentType<{ size?: string | number; className?: string }> }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid gap-2 text-sm text-slate-300">
      {tabs.map((tab) => (
        <button
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left font-semibold capitalize transition ${
            active === tab.id ? "border border-rose-500/50 bg-rose-950/45 text-rose-100" : "hover:bg-white/10 hover:text-white"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.icon ? <tab.icon className={active === tab.id ? "text-rose-400" : "text-zinc-600"} size={16} /> : null}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function MiniBarChart({ points, label }: { points: Array<{ label: string; value: number }>; label: string }) {
  const max = Math.max(1, ...points.map((point) => point.value));
  return (
    <div className={dashboardTheme.panelSoft}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-black text-white">{label}</h3>
        <span className="text-xs text-slate-500">last 7 days</span>
      </div>
      <div className="flex h-36 items-end gap-2">
        {points.map((point) => (
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.label}>
            <div className="flex h-28 w-full items-end rounded-lg bg-black/55 p-1">
              <div
                className="w-full rounded-md bg-gradient-to-t from-rose-950 via-rose-700 to-rose-500 transition-all"
                style={{ height: `${Math.max(5, (point.value / max) * 100)}%` }}
                title={`${point.label}: ${point.value}`}
              />
            </div>
            <span className="w-full truncate text-center text-[11px] text-slate-500">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-5 text-sm text-slate-500">{text}</div>;
}
