import { TrendingUp, ClipboardList, Route, Gauge } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { loadStudent } from "@/lib/data";
import { ASSESSMENTS, ASSESSMENT_KEYS } from "@/lib/assessments";
import { readinessScore, WEIGHTS } from "@/lib/readiness";
import { Badge, Card, LinkButton, PageHeader, Progress } from "@/components/ui";

export const metadata = { title: "Progres" };

export default async function Page() {
  const { profile } = await requirePage({ roles: ["student"], active: true });
  const d = await loadStudent(profile.id);
  const steps = d.roadmap?.data.steps ?? [];
  const stepsDone = steps.filter((s) => s.done).length;
  const clarity = d.surveys[0]?.score ?? null;
  const score = readinessScore({ assessmentsDone: d.profile.done.length, hasRoadmap: !!d.roadmap, stepsDone, stepsTotal: steps.length, clarity, daysSinceActive: 0 });
  const parts = [
    { label: "Asesmen selesai", got: Math.round((d.profile.done.length / 4) * WEIGHTS.assessments), max: WEIGHTS.assessments },
    { label: "Roadmap tersimpan", got: d.roadmap ? WEIGHTS.roadmap : 0, max: WEIGHTS.roadmap },
    { label: "Langkah roadmap selesai", got: steps.length ? Math.round((stepsDone / steps.length) * WEIGHTS.steps) : 0, max: WEIGHTS.steps },
    { label: "Kejelasan arah (survei)", got: clarity ? Math.round(((clarity - 1) / 4) * WEIGHTS.clarity) : 0, max: WEIGHTS.clarity },
  ];
  return (
    <>
      <PageHeader title="Progres Kesiapan Karier" icon={<TrendingUp className="size-5" />} subtitle="Lihat seberapa jauh kamu sudah melangkah." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card strong className="flex flex-col items-center justify-center text-center">
          <Gauge className="size-8 text-brand-600" />
          <p className="mt-2 text-sm text-slate-600">Skor kesiapan</p>
          <p className="bg-linear-to-br from-brand-600 to-cyan-500 bg-clip-text text-7xl font-extrabold text-transparent">{score}</p>
          <p className="text-sm text-slate-500">dari 100</p>
          <p className="mt-3 text-xs text-slate-500">Rumus skor masih draf dan menunggu persetujuan psikolog mitra.</p>
        </Card>
        <Card>
          <h2 className="font-semibold text-slate-900">Komponen skor</h2>
          <ul className="mt-4 space-y-4">
            {parts.map((p) => (
              <li key={p.label}>
                <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{p.label}</span><span className="tabular-nums text-slate-600">{p.got}/{p.max}</span></div>
                <Progress value={(p.got / p.max) * 100} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><ClipboardList className="size-5 text-brand-600" />Asesmen ({d.profile.done.length} dari 4)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {ASSESSMENT_KEYS.map((k) => (
              <li key={k} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">
                {ASSESSMENTS[k].title}{d.latest[k] ? <Badge tone="green">Selesai</Badge> : <Badge>Belum</Badge>}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Route className="size-5 text-brand-600" />Langkah roadmap</h2>
          {steps.length === 0 ? (
            <div className="mt-3 text-sm text-slate-600">Belum ada roadmap tersimpan.<div className="mt-3"><LinkButton href="/roadmap" size="sm">Buka Career Roadmap</LinkButton></div></div>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-600">{stepsDone} selesai · {steps.length - stepsDone} belum</p>
              <ul className="mt-3 space-y-2 text-sm">
                {steps.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2">
                    <span className={s.done ? "text-slate-500 line-through" : ""}>{s.title}</span>
                    {s.done ? <Badge tone="green">Selesai</Badge> : <Badge>Belum</Badge>}
                  </li>
                ))}
              </ul>
              <LinkButton href="/roadmap" size="sm" variant="secondary" className="mt-4">Kelola langkah</LinkButton>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
