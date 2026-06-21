"use client";

import React from "react";
import { Crown } from "lucide-react";
import { AnimatedNumber } from "@/components/motion";

export const dashboardTheme = {
  page: "min-h-screen bg-transparent text-[#f0ecea]",
  sidebar: "border-b border-white/[0.08] bg-[#050508]/90 p-3 backdrop-blur-2xl xl:sticky xl:top-0 xl:h-screen xl:border-b-0 xl:border-r",
  panel: "glass-card rounded-xl p-4 sm:p-5",
  panelSoft: "rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 shadow-inner shadow-white/[0.02]",
  input:
    "w-full rounded-lg border border-white/[0.09] bg-white/[0.035] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10",
  button:
    "rounded-lg bg-[#e5183a] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/20 transition hover:-translate-y-0.5 hover:shadow-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50",
  ghostButton:
    "rounded-lg border border-white/[0.09] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:-translate-y-0.5 hover:border-rose-500/35 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
  dangerButton:
    "rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-100 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50",
  label: "grid gap-1.5 text-xs font-medium uppercase tracking-[0.22em] text-[#7a6a6e]",
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
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>{title}</h2>
        {meta ? <span className="font-mono text-xs text-white/25">{meta}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <article className="animate-rise glass-card rounded-xl p-4 transition hover:-translate-y-0.5">
      <span className="font-mono text-xs uppercase tracking-[0.16em] text-white/25">{label}</span>
      <strong className="mt-2 block text-2xl font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </strong>
      {hint ? <p className="mt-1 text-xs text-white/30">{hint}</p> : null}
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
    neutral: "border-white/10 bg-white/[0.05] text-white/60",
    good: "border-rose-500/30 bg-rose-500/15 text-rose-200",
    bad: "border-white/10 bg-white/[0.035] text-white/30",
    warn: "border-amber-300/20 bg-amber-400/15 text-amber-100",
  };
  return <span className={`h-fit rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; locked?: boolean; icon?: React.ComponentType<{ size?: string | number; className?: string }> }>;
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 text-sm text-white/35 xl:grid xl:overflow-visible xl:pb-0">
      {tabs.map((tab) => (
        <button
          className={`relative flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium capitalize transition hover:translate-x-0.5 ${
            active === tab.id ? "border border-rose-500/25 bg-rose-500/10 text-[#e5183a]" : "hover:bg-white/[0.05] hover:text-white"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {active === tab.id ? <span className="absolute bottom-1 left-0 top-1 w-0.5 rounded-r bg-[#e5183a]" /> : null}
          {tab.icon ? <tab.icon className={active === tab.id ? "text-[#e5183a]" : "text-white/25"} size={15} /> : null}
          <span className="min-w-0 flex-1 truncate">{tab.label}</span>
          {tab.locked ? <Crown className="shrink-0 text-amber-300" size={14} /> : null}
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
        <h3 className="font-bold text-white" style={{ fontFamily: "Rajdhani, sans-serif" }}>{label}</h3>
        <span className="font-mono text-xs text-white/25">last 7 days</span>
      </div>
      <div className="flex h-32 items-end gap-2">
        {points.map((point, index) => (
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.label}>
            <div className="flex h-24 w-full items-end rounded-lg bg-white/[0.025] p-1">
              <div
                className="chart-bar w-full rounded-md bg-[#e5183a]/65"
                style={{ height: `${Math.max(5, (point.value / max) * 100)}%` }}
                title={`${point.label}: ${point.value}`}
                data-index={index}
              />
            </div>
            <span className="w-full truncate text-center font-mono text-[11px] text-white/25">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-white/[0.09] bg-white/[0.02] p-8 text-center text-sm text-white/30">{text}</div>;
}
