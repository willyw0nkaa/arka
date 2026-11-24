"use client";
import { useState } from "react";
import { Sparkles, LoaderCircle, Printer } from "lucide-react";
import { Alert, Button, Card } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";

export function Summary({ studentId }: { studentId: string }) {
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<{ text: string; lastData: string | null; insufficient: boolean; provider: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  async function load() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/counselor/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId }) });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(j.error);
    setData(j);
  }
  return (
    <Card strong>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Sparkles className="size-5 text-brand-600" />Ringkasan pra-konseling</h2>
        <div className="flex gap-2 no-print">
          {data && <Button size="sm" variant="ghost" onClick={() => window.print()}><Printer className="size-3.5" />Cetak</Button>}
          <Button size="sm" onClick={load} disabled={busy}>{busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}{data ? "Buat ulang" : "Buat ringkasan"}</Button>
        </div>
      </div>
      {err && <div className="mt-3"><Alert tone="red">{err}</Alert></div>}
      {!data && !err && <p className="mt-2 text-sm text-slate-600">Ringkasan satu halaman dari profil, hasil asesmen, dan roadmap siswa (tanpa isi percakapan).</p>}
      {data && (
        <div className="mt-3">
          {data.insufficient && <div className="mb-3"><Alert tone="amber">Data belum cukup: siswa belum menyelesaikan asesmen.</Alert></div>}
          <div className="whitespace-pre-wrap rounded-2xl bg-white/80 p-4 text-sm leading-relaxed text-slate-800">{data.text}</div>
          <p className="mt-2 text-xs text-slate-500">Data terakhir: {data.lastData ? fmtDateTime(data.lastData) : "—"} · dibuat oleh {data.provider === "local" ? "templat ARKA" : `AI (${data.provider})`}. Indikasi, bukan diagnosis.</p>
        </div>
      )}
    </Card>
  );
}
