import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";
const sizeCls: Record<Size, string> = { sm: "px-3 py-1.5 text-xs rounded-lg", md: "", lg: "px-6 py-3 text-base rounded-2xl" };
export const btnCls = (v: Variant = "primary", s: Size = "md", extra?: string) => cn("btn", `btn-${v}`, sizeCls[s], extra);

export function Button({ variant = "primary", size = "md", className, ...p }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button {...p} className={btnCls(variant, size, className)} />;
}

export function LinkButton({ variant = "primary", size = "md", className, ...p }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...p} className={btnCls(variant, size, className)} />;
}

export function Card({ className, strong, ...p }: ComponentProps<"div"> & { strong?: boolean }) {
  return <div {...p} className={cn(strong ? "glass-strong" : "glass", "p-5 sm:p-6", className)} />;
}

const tones = {
  slate: "bg-slate-100 text-slate-700",
  brand: "bg-brand-100 text-brand-800",
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-rose-100 text-rose-800",
  blue: "bg-sky-100 text-sky-800",
};
export type Tone = keyof typeof tones;
export function Badge({ tone = "slate", className, ...p }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span {...p} className={cn("chip", tones[tone], className)} />;
}

export function PageHeader({ title, subtitle, action, icon }: { title: string; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-brand-500 to-cyan-500 text-white shadow-lg shadow-brand-500/30">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600 sm:text-base">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap gap-2 no-print">{action}</div>}
    </div>
  );
}

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "green" | "amber" }) {
  const c = tone === "green" ? "from-emerald-400 to-emerald-600" : tone === "amber" ? "from-amber-400 to-orange-500" : "from-brand-400 to-cyan-500";
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full bg-linear-to-r transition-all duration-500", c)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Alert({ tone = "brand", title, children, icon }: { tone?: Tone; title?: string; children?: ReactNode; icon?: ReactNode }) {
  const map: Record<Tone, string> = {
    slate: "border-slate-200 bg-white/70 text-slate-800",
    brand: "border-brand-200 bg-brand-50/80 text-brand-900",
    green: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
    amber: "border-amber-200 bg-amber-50/80 text-amber-900",
    red: "border-rose-200 bg-rose-50/80 text-rose-900",
    blue: "border-sky-200 bg-sky-50/80 text-sky-900",
  };
  return (
    <div className={cn("flex gap-3 rounded-2xl border p-4 text-sm backdrop-blur", map[tone])} role="status">
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-1", "leading-relaxed")}>{children}</div>}
      </div>
    </div>
  );
}

export function Empty({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center px-6 py-12 text-center">
      {icon && <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-700">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-slate-600">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <Card className="flex items-start gap-4">
      {icon && <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/80 text-brand-600 shadow-md shadow-brand-500/10">{icon}</div>}
      <div className="min-w-0">
        <p className="text-sm text-slate-600">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </Card>
  );
}

export function ScoreBars({ items, max = 100 }: { items: { label: string; score: number; desc?: string }[]; max?: number }) {
  return (
    <ul className="space-y-3">
      {items.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-slate-800">{d.label}</span>
            <span className="tabular-nums text-slate-600">{d.score}</span>
          </div>
          <Progress value={(d.score / max) * 100} />
          {d.desc && <p className="mt-1 text-xs text-slate-500">{d.desc}</p>}
        </li>
      ))}
    </ul>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 64 64" className="size-9 drop-shadow-md" aria-hidden>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6366f1" /><stop offset="1" stopColor="#06b6d4" /></linearGradient></defs>
        <rect width="64" height="64" rx="16" fill="url(#lg)" />
        <path d="M18 46 L32 16 L46 46" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 36 Q32 30 40 36" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="text-xl font-extrabold tracking-tight text-slate-900">ARKA</span>
    </span>
  );
}
