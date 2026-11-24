"use client";
import { useMemo, useState } from "react";
import { Search, GraduationCap, Briefcase, Award, SearchX } from "lucide-react";
import type { CareerItem } from "@/lib/types";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const KINDS = [
  { k: "major", label: "Program studi", icon: GraduationCap },
  { k: "profession", label: "Profesi", icon: Briefcase },
  { k: "scholarship", label: "Beasiswa", icon: Award },
] as const;

export function Directory({ items, matches }: { items: CareerItem[]; matches: Record<string, number> }) {
  const [kind, setKind] = useState<CareerItem["kind"]>("major");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const hasProfile = Object.keys(matches).length > 0;

  const cats = useMemo(() => [...new Set(items.filter((i) => i.kind === kind).map((i) => i.category))].sort(), [items, kind]);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = items.filter((i) => i.kind === kind && (!cat || i.category === cat) &&
      (!s || `${i.name} ${i.description} ${i.skills.join(" ")} ${i.related.join(" ")} ${i.category}`.toLowerCase().includes(s)));
    return hasProfile && kind !== "scholarship" ? list.sort((a, b) => (matches[b.id] ?? 0) - (matches[a.id] ?? 0)) : list;
  }, [items, kind, cat, q, matches, hasProfile]);

  return (
    <>
      <Card strong className="mb-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {KINDS.map(({ k, label, icon: Icon }) => (
            <button key={k} onClick={() => { setKind(k); setCat(""); }}
              className={cn("btn", kind === k ? "btn-primary" : "btn-secondary")}><Icon className="size-4" />{label}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Cari kata kunci, mis. data, desain, kesehatan…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Kata kunci" />
          </div>
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Kategori">
            <option value="">Semua kategori</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <p className="text-xs text-slate-500">{results.length} hasil{hasProfile && kind !== "scholarship" ? " · diurutkan menurut kecocokan dengan profilmu" : ""}</p>
      </Card>

      {results.length === 0 ? (
        <div className="glass flex flex-col items-center p-10 text-center">
          <SearchX className="size-8 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-900">Tidak ditemukan</p>
          <p className="mt-1 text-sm text-slate-600">Coba kata kunci lain, misalnya “teknologi”, “bisnis”, “kesehatan”, atau hapus filter kategori.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((i) => (
            <button key={i.id} onClick={() => setOpen(open === i.id ? null : i.id)} className="glass p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold text-slate-900">{i.name}</p><p className="text-xs text-slate-500">{i.category}</p></div>
                {matches[i.id] !== undefined && <Badge tone={matches[i.id] >= 70 ? "green" : "brand"}>{matches[i.id]}% cocok</Badge>}
              </div>
              <p className={cn("mt-2 text-sm text-slate-600", open !== i.id && "line-clamp-2")}>{i.description}</p>
              {open === i.id && (
                <div className="mt-3 space-y-2 text-sm">
                  {i.skills.length > 0 && <p><b className="text-slate-800">{i.kind === "scholarship" ? "Yang biasanya diperlukan" : "Keterampilan"}:</b> {i.skills.join(", ")}</p>}
                  {i.related.length > 0 && <p><b className="text-slate-800">Terkait:</b> {i.related.join(", ")}</p>}
                  {i.kind === "scholarship" && <p className="text-amber-700">Syarat & jadwal berubah tiap tahun — selalu cek situs resmi penyelenggara.</p>}
                  <p className="text-xs text-slate-400">Sumber: {i.source}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
