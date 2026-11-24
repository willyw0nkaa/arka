"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Map, Save, RefreshCw, GraduationCap, Briefcase, Wrench, Route, LoaderCircle, Info, MessagesSquare, Check } from "lucide-react";
import type { RoadmapData } from "@/lib/types";
import { Alert, Badge, Button, Card, LinkButton, PageHeader, Progress } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";

export function RoadmapView({ saved, savedAt, fresh, outdated }: { saved: RoadmapData | null; savedAt: string | null; fresh: RoadmapData; outdated: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<RoadmapData>(saved ?? fresh);
  const [isSaved, setIsSaved] = useState(!!saved);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/roadmap/save", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setData(j.data);
      setIsSaved(true);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, done: boolean) {
    setToggling(id);
    setData((d) => ({ ...d, steps: d.steps.map((s) => (s.id === id ? { ...s, done } : s)) }));
    const res = await fetch("/api/roadmap/step", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, done }) });
    if (!res.ok) setData((d) => ({ ...d, steps: d.steps.map((s) => (s.id === id ? { ...s, done: !done } : s)) }));
    setToggling(null);
  }

  const doneSteps = data.steps.filter((s) => s.done).length;

  return (
    <>
      <PageHeader title="Career Roadmap" icon={<Map className="size-5" />}
        subtitle={isSaved && savedAt ? `Disimpan ${fmtDate(savedAt)} · berdasarkan profil ${data.profile_status}` : `Pratinjau berdasarkan profil ${data.profile_status} — simpan agar bisa dipantau`}
        action={
          <>
            {isSaved && outdated && <Button variant="secondary" onClick={save} disabled={busy}><RefreshCw className="size-4" />Perbarui dari hasil terbaru</Button>}
            {!isSaved && <Button onClick={save} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Simpan roadmap</Button>}
            <LinkButton href="/companion" variant="secondary"><MessagesSquare className="size-4" />Tanya Companion</LinkButton>
          </>
        } />
      {err && <div className="mb-4"><Alert tone="red">{err}</Alert></div>}
      {isSaved && outdated && <div className="mb-4"><Alert tone="amber">Ada hasil asesmen yang lebih baru dari roadmap ini. Perbarui agar rekomendasi memakai hasil terbaru (langkah yang sudah selesai tetap ditandai).</Alert></div>}
      {data.limitation && <div className="mb-4"><Alert tone="amber" icon={<Info className="size-5" />}>{data.limitation}</Alert></div>}
      <div className="mb-6"><Alert tone="brand" icon={<Info className="size-5" />}>Rekomendasi adalah indikasi kecocokan dari asesmen, bukan penentu atau jaminan diterima. Persentase = seberapa dekat profilmu dengan profil jurusan/profesi di database karier ARKA.</Alert></div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecList title="Rekomendasi jurusan" icon={<GraduationCap className="size-5" />} items={data.majors} />
        <RecList title="Rekomendasi profesi" icon={<Briefcase className="size-5" />} items={data.professions} />
      </div>

      <Card className="mt-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Wrench className="size-5 text-brand-600" />Keterampilan yang perlu dikembangkan</h2>
        <div className="mt-3 flex flex-wrap gap-2">{data.skills.map((s) => <span key={s} className="rounded-xl bg-white/90 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">{s}</span>)}</div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Route className="size-5 text-brand-600" />Timeline langkah</h2>
          {isSaved && <span className="text-sm text-slate-600">{doneSteps}/{data.steps.length} selesai</span>}
        </div>
        {isSaved && <Progress value={(doneSteps / Math.max(1, data.steps.length)) * 100} tone="green" className="mt-3" />}
        <ol className="relative mt-5 space-y-4 border-l-2 border-brand-200 pl-6">
          {data.steps.map((s) => (
            <li key={s.id} className="relative">
              <span className={cn("absolute -left-[33px] top-1 grid size-5 place-items-center rounded-full border-2", s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-brand-300 bg-white")}>
                {s.done && <Check className="size-3" />}
              </span>
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white/70 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{s.when}</p>
                  <p className={cn("font-semibold text-slate-900", s.done && "text-slate-500 line-through")}>{s.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{s.detail}</p>
                </div>
                {isSaved && (
                  <Button size="sm" variant={s.done ? "secondary" : "success"} disabled={toggling === s.id} onClick={() => toggle(s.id, !s.done)}>
                    {s.done ? "Batalkan" : <><Check className="size-3.5" />Tandai selesai</>}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}

function RecList({ title, icon, items }: { title: string; icon: React.ReactNode; items: RoadmapData["majors"] }) {
  return (
    <Card>
      <h2 className="flex items-center gap-2 font-semibold text-slate-900"><span className="text-brand-600">{icon}</span>{title}</h2>
      {items.length === 0 && <p className="mt-3 text-sm text-slate-600">Belum ada kecocokan yang cukup kuat di database.</p>}
      <ul className="mt-4 space-y-3">
        {items.map((m, i) => (
          <li key={m.name} className="rounded-2xl bg-white/75 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900"><span className="mr-1.5 text-slate-400">#{i + 1}</span>{m.name}</p>
              <Badge tone={m.match >= 75 ? "green" : m.match >= 60 ? "brand" : "slate"}>{m.match}% cocok</Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{m.category}</p>
            <p className="mt-2 text-sm text-slate-600"><b className="text-slate-700">Alasan:</b> {m.reason}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
