"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const LABELS = ["Sangat tidak jelas", "Tidak jelas", "Cukup", "Jelas", "Sangat jelas"];

export function ClaritySurvey({ phase }: { phase: "pre" | "post" }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function answer(score: number) {
    setBusy(true);
    const res = await fetch("/api/survey", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase, score }) });
    setBusy(false);
    if (res.ok) { setSent(true); setTimeout(() => router.refresh(), 1200); }
  }
  if (sent) return <Card className="text-sm text-emerald-800">Terima kasih! Jawabanmu membantu kami mengukur manfaat ARKA.</Card>;
  return (
    <Card strong>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{phase === "pre" ? "Sebelum mulai" : "4 minggu setelah profilmu terbentuk"}</p>
      <p className="mt-1 font-semibold text-slate-900">Seberapa jelas arah kariermu sekarang?</p>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {LABELS.map((l, i) => (
          <button key={l} disabled={busy} onClick={() => answer(i + 1)}
            className={cn("rounded-2xl border border-white/80 bg-white/80 px-1 py-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/20 disabled:opacity-50")}>
            <span className="block text-xl font-bold text-brand-700">{i + 1}</span>
            <span className="block text-[11px] leading-tight text-slate-600">{l}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
