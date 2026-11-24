import { UserRound, Info, Map, History } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { loadStudent } from "@/lib/data";
import { ASSESSMENTS, topDims, type AssessmentKey } from "@/lib/assessments";
import { Alert, Badge, Card, Empty, LinkButton, PageHeader, ScoreBars } from "@/components/ui";
import { Radar } from "@/components/Radar";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Profil Diri" };

export default async function Page() {
  const { profile } = await requirePage({ roles: ["student"], active: true });
  const d = await loadStudent(profile.id);
  const p = d.profile;

  if (p.status === "belum") {
    return (
      <>
        <PageHeader title="Profil Potensi Diri" icon={<UserRound className="size-5" />} />
        <Empty icon={<UserRound className="size-6" />} title="Profil belum bisa dibuat" action={<LinkButton href="/asesmen">Ke halaman asesmen</LinkButton>}>
          Selesaikan minimal 2 asesmen. Yang perlu diselesaikan: {p.missing.map((k) => ASSESSMENTS[k].title).join(", ")}.
        </Empty>
      </>
    );
  }

  const desc = (k: AssessmentKey, dim: string) => ASSESSMENTS[k].dims.find((x) => x.key === dim)?.desc;
  const history = d.results.slice(0, 12);

  return (
    <>
      <PageHeader title="Profil Potensi Diri" subtitle={p.headline} icon={<UserRound className="size-5" />}
        action={<LinkButton href="/roadmap"><Map className="size-4" />Career Roadmap</LinkButton>} />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone={p.status === "lengkap" ? "green" : "amber"} className="px-3 py-1 text-sm">Profil {p.status}</Badge>
        {p.riasecCode && <Badge tone="brand" className="px-3 py-1 text-sm">Kode minat: {p.riasecCode.split("").join(" · ")}</Badge>}
      </div>
      {p.status === "sementara" && (
        <div className="mb-4"><Alert tone="amber" title="Profil ini masih sementara">Asesmen yang belum diambil: {p.missing.map((k) => ASSESSMENTS[k].title).join(", ")}. Selesaikan agar profil dan rekomendasi lebih lengkap.</Alert></div>
      )}
      <div className="mb-6"><Alert tone="brand" icon={<Info className="size-5" />}>Semua hasil di halaman ini adalah <b>indikasi</b> berdasarkan jawabanmu — bukan diagnosis, label, atau penentu jurusan. Diskusikan dengan guru BK dan orang tuamu.</Alert></div>

      <div className="grid gap-6 lg:grid-cols-2">
        {d.latest.minat && (
          <Card>
            <h2 className="font-semibold text-slate-900">Minat (RIASEC)</h2>
            <p className="text-xs text-slate-500">Diperbarui {fmtDate(d.latest.minat.completed_at)}</p>
            <Radar data={ASSESSMENTS.minat.dims.map((dm) => ({ label: dm.label, value: d.latest.minat!.scores[dm.key] ?? 0 }))} />
            <ul className="mt-2 space-y-2 text-sm">
              {p.interests.slice(0, 3).map((i) => <li key={i.dim}><b>{i.label} ({i.score})</b> — <span className="text-slate-600">{desc("minat", i.dim)}</span></li>)}
            </ul>
          </Card>
        )}
        {d.latest.kepribadian && (
          <Card>
            <h2 className="font-semibold text-slate-900">Gaya bekerja & berinteraksi</h2>
            <p className="mb-4 text-xs text-slate-500">Diperbarui {fmtDate(d.latest.kepribadian.completed_at)}</p>
            <ScoreBars items={ASSESSMENTS.kepribadian.dims.map((dm) => ({ label: dm.label, score: d.latest.kepribadian!.scores[dm.key] ?? 0, desc: dm.desc }))} />
          </Card>
        )}
        {d.latest.bakat && (
          <Card>
            <h2 className="font-semibold text-slate-900">Kecenderungan bakat</h2>
            <p className="mb-4 text-xs text-slate-500">Diperbarui {fmtDate(d.latest.bakat.completed_at)}</p>
            <ScoreBars items={topDims("bakat", d.latest.bakat.scores, 8).map((t) => ({ label: t.label, score: t.score }))} />
          </Card>
        )}
        {d.latest.nilai && (
          <Card>
            <h2 className="font-semibold text-slate-900">Nilai karier yang kamu pegang</h2>
            <p className="mb-4 text-xs text-slate-500">Diperbarui {fmtDate(d.latest.nilai.completed_at)}</p>
            <ScoreBars items={topDims("nilai", d.latest.nilai.scores, 9).map((t) => ({ label: t.label, score: t.score }))} />
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900"><History className="size-4" />Riwayat asesmen</h2>
        <ul className="mt-3 divide-y divide-slate-200/70 text-sm">
          {history.map((r, i) => {
            const k = r.assessment_key as AssessmentKey;
            const isLatest = d.latest[k]?.completed_at === r.completed_at;
            const t = topDims(k, r.scores, 2);
            return (
              <li key={r.id ?? i} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="font-medium text-slate-800">{ASSESSMENTS[k].title}</span>
                <span className="text-slate-600">{t.map((x) => `${x.label} ${x.score}`).join(", ")}</span>
                <span className="flex items-center gap-2 text-slate-500">{fmtDate(r.completed_at)}{isLatest ? <Badge tone="green">Dipakai</Badge> : <Badge>Riwayat</Badge>}</span>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
