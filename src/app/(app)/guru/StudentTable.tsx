"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Funnel, Copy, Check, ChevronRight } from "lucide-react";
import type { StudentRow } from "@/lib/school";
import { TAGS } from "@/lib/readiness";
import { Badge, Card, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";

const toneMap = { red: "red", amber: "amber", blue: "blue", green: "green" } as const;

export function StudentTable({ rows, inviteLink }: { rows: StudentRow[]; inviteLink: string }) {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<"priority" | "score" | "name">("priority");
  const [copied, setCopied] = useState(false);

  const classes = useMemo(() => [...new Set(rows.map((r) => (r.class_name ? `${r.class_level}|${r.class_name}` : `${r.class_level}|`)))].sort(), [rows]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (s && !r.full_name.toLowerCase().includes(s)) return false;
      if (cls) { const [lv, nm] = cls.split("|"); if (String(r.class_level) !== lv || (nm && r.class_name !== nm)) return false; }
      if (tag && !r.tags.some((t) => t.key === tag)) return false;
      return true;
    });
    const pr = (r: StudentRow) => (r.tags[0]?.priority ?? 9);
    return out.sort((a, b) => sort === "name" ? a.full_name.localeCompare(b.full_name) : sort === "score" ? a.score - b.score : pr(a) - pr(b) || a.score - b.score);
  }, [rows, q, cls, tag, sort]);

  return (
    <Card className="p-0 sm:p-0">
      <div className="flex flex-col gap-3 border-b border-white/70 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Cari nama siswa" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari nama" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={cls} onChange={(e) => setCls(e.target.value)} aria-label="Filter kelas">
            <option value="">Semua kelas</option>
            {classes.map((c) => { const [lv, nm] = c.split("|"); return <option key={c} value={c}>Kelas {lv}{nm ? ` · ${nm}` : ""}</option>; })}
          </select>
          <select className="input w-auto" value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Filter tag">
            <option value="">Semua tag</option>
            {Object.values(TAGS).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Urutkan">
            <option value="priority">Urut: prioritas</option><option value="score">Urut: kesiapan terendah</option><option value="name">Urut: nama</option>
          </select>
          <button className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}Tautan undangan
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Nama</th><th className="px-4 py-3 font-semibold">Kelas</th>
              <th className="px-4 py-3 font-semibold">Asesmen</th><th className="px-4 py-3 font-semibold">Skor kesiapan</th>
              <th className="px-4 py-3 font-semibold">Tag prioritas</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-t border-white/70 transition hover:bg-white/60">
                <td className="px-4 py-3 font-medium text-slate-900">{r.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{r.class_level}{r.class_name ? ` · ${r.class_name}` : ""}</td>
                <td className="px-4 py-3"><span className={cn("font-semibold", r.assessments_done === 4 ? "text-emerald-700" : "text-slate-700")}>{r.assessments_done}</span><span className="text-slate-400"> dari 4</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Progress value={r.score} className="w-20" tone={r.score >= 75 ? "green" : r.score < 40 ? "amber" : "brand"} /><span className="tabular-nums font-semibold">{r.score}</span></div></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{r.tags.length ? r.tags.map((t) => <Badge key={t.key} tone={toneMap[t.tone]}>{t.label}</Badge>) : <span className="text-slate-400">—</span>}</div></td>
                <td className="px-4 py-3 text-right"><Link href={`/guru/siswa/${r.id}`} className="btn btn-secondary px-3 py-1.5 text-xs">Detail<ChevronRight className="size-3.5" /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500"><Funnel className="size-4" />Tidak ada siswa yang cocok dengan filter.</p>}
      </div>
      <p className="border-t border-white/70 px-4 py-3 text-xs text-slate-500">Skor kesiapan & aturan tag masih draf, menunggu persetujuan psikolog mitra (OQ-6). Siswa tanpa persetujuan orang tua tidak ditampilkan.</p>
    </Card>
  );
}
