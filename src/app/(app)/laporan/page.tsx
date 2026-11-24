import Link from "next/link";
import { FileChartColumn, EyeOff, Info } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { schoolOverview, type StudentRow } from "@/lib/school";
import { ASSESSMENTS } from "@/lib/assessments";
import { Alert, Card, PageHeader, Progress } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { cn, fmtDate } from "@/lib/utils";

export const metadata = { title: "Laporan Sekolah" };
const MIN_GROUP = 10; // FR-018: kelompok < 10 siswa disembunyikan
const PERIODS = { semua: "Semua waktu", "30": "30 hari terakhir", "90": "3 bulan terakhir", "180": "6 bulan terakhir" } as const;
const RIASEC = ["R", "I", "A", "S", "E", "C"];

type Agg = { label: string; n: number; pctAssess: number; pctProfile: number; pctRoadmap: number; avgScore: number; riasec: Record<string, number> };

function aggregate(label: string, rows: StudentRow[]): Agg {
  const n = rows.length;
  const riasec: Record<string, number> = Object.fromEntries(RIASEC.map((k) => [k, 0]));
  rows.forEach((r) => { if (r.top_interest && riasec[r.top_interest] !== undefined) riasec[r.top_interest]++; });
  return {
    label, n,
    pctAssess: n ? Math.round((rows.reduce((a, r) => a + r.assessments_done, 0) / (n * 4)) * 100) : 0,
    pctProfile: n ? Math.round((rows.filter((r) => r.assessments_done >= 2).length / n) * 100) : 0,
    pctRoadmap: n ? Math.round((rows.filter((r) => r.has_roadmap).length / n) * 100) : 0,
    avgScore: n ? Math.round(rows.reduce((a, r) => a + r.score, 0) / n) : 0,
    riasec,
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ periode?: string; kelas?: string; sekolah?: string }> }) {
  const { profile } = await requirePage({ roles: ["principal", "admin"] });
  const sp = await searchParams;
  const db = createAdminClient();
  const { data: schools } = profile.role === "admin" ? await db.from("schools").select("id, name").order("name") : { data: null };
  const schoolId = profile.role === "admin" ? sp.sekolah || schools?.[0]?.id : profile.school_id;
  if (!schoolId) return <Alert tone="amber">Belum ada sekolah.</Alert>;
  const { data: school } = await db.from("schools").select("name, city").eq("id", schoolId).single();

  const periode = (sp.periode && sp.periode in PERIODS ? sp.periode : "semua") as keyof typeof PERIODS;
  const since = periode === "semua" ? undefined : new Date(Date.now() - Number(periode) * 86400_000);
  const kelas = ["10", "11", "12"].includes(sp.kelas ?? "") ? Number(sp.kelas) : null;
  let rows = await schoolOverview(schoolId, since);
  if (kelas) rows = rows.filter((r) => r.class_level === kelas);

  const total = aggregate(kelas ? `Kelas ${kelas}` : "Seluruh siswa", rows);
  const groupsMap = new Map<string, StudentRow[]>();
  for (const r of rows) {
    const k = `Kelas ${r.class_level}${r.class_name ? ` · ${r.class_name}` : ""}`;
    groupsMap.set(k, [...(groupsMap.get(k) ?? []), r]);
  }
  const groups = [...groupsMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => aggregate(k, v));
  const levelGroups = [10, 11, 12].map((lv) => aggregate(`Kelas ${lv}`, rows.filter((r) => r.class_level === lv))).filter((g) => g.n > 0);
  const qs = (o: Record<string, string | undefined>) => "?" + new URLSearchParams(Object.entries({ periode, kelas: kelas ? String(kelas) : undefined, sekolah: profile.role === "admin" ? schoolId : undefined, ...o }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageHeader title="Laporan Kesiapan Karier" icon={<FileChartColumn className="size-5" />}
        subtitle={`${school?.name}, ${school?.city} · ${PERIODS[periode]}${kelas ? ` · Kelas ${kelas}` : ""} · dicetak ${fmtDate(new Date())}`}
        action={<PrintButton />} />

      <Card className="no-print mb-6 space-y-3">
        {schools && (
          <div className="flex flex-wrap items-center gap-2 text-sm"><span className="w-16 font-semibold text-slate-700">Sekolah</span>
            {schools.map((s) => <Link key={s.id} href={qs({ sekolah: s.id })} className={cn("btn px-3 py-1.5 text-xs", s.id === schoolId ? "btn-primary" : "btn-secondary")}>{s.name}</Link>)}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-sm"><span className="w-16 font-semibold text-slate-700">Periode</span>
          {Object.entries(PERIODS).map(([k, l]) => <Link key={k} href={qs({ periode: k })} className={cn("btn px-3 py-1.5 text-xs", periode === k ? "btn-primary" : "btn-secondary")}>{l}</Link>)}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm"><span className="w-16 font-semibold text-slate-700">Kelas</span>
          {[["", "Semua"], ["10", "10"], ["11", "11"], ["12", "12"]].map(([k, l]) => <Link key={l} href={qs({ kelas: k || undefined })} className={cn("btn px-3 py-1.5 text-xs", (kelas ? String(kelas) : "") === k ? "btn-primary" : "btn-secondary")}>{l}</Link>)}
        </div>
      </Card>

      <div className="mb-6"><Alert tone="brand" icon={<Info className="size-5" />}>Laporan ini hanya berisi angka agregat tanpa nama siswa. Kelompok dengan kurang dari {MIN_GROUP} siswa disembunyikan agar siswa tidak dapat dikenali. Persentase asesmen = total asesmen selesai ÷ (jumlah siswa × 4) pada periode terpilih.</Alert></div>

      <AggCard g={total} big />
      {levelGroups.length > 1 && <div className="mt-6 grid gap-6 lg:grid-cols-3">{levelGroups.map((g) => <AggCard key={g.label} g={g} />)}</div>}

      <Card className="mt-6 overflow-x-auto">
        <h2 className="font-semibold text-slate-900">Rincian per rombel</h2>
        <table className="mt-3 w-full min-w-[640px] text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2">Kelompok</th><th>Siswa</th><th>Asesmen selesai</th><th>Punya profil</th><th>Punya roadmap</th><th>Rata-rata kesiapan</th></tr></thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.label} className="border-t border-slate-200/70">
                <td className="py-2.5 font-medium">{g.label}</td>
                {g.n < MIN_GROUP ? (
                  <td colSpan={5} className="text-slate-400"><span className="inline-flex items-center gap-1"><EyeOff className="size-3.5" />Disembunyikan (&lt; {MIN_GROUP} siswa)</span></td>
                ) : (<><td>{g.n}</td><td>{g.pctAssess}%</td><td>{g.pctProfile}%</td><td>{g.pctRoadmap}%</td><td>{g.avgScore}</td></>)}
              </tr>
            ))}
            {groups.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-slate-500">Belum ada data siswa aktif.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function AggCard({ g, big }: { g: Agg; big?: boolean }) {
  const hidden = g.n < MIN_GROUP;
  const maxR = Math.max(1, ...Object.values(g.riasec));
  const withInterest = Object.values(g.riasec).reduce((a, b) => a + b, 0);
  return (
    <Card strong={big}>
      <div className="flex items-baseline justify-between"><h2 className={cn("font-semibold text-slate-900", big && "text-lg")}>{g.label}</h2><span className="text-sm text-slate-500">{hidden ? `< ${MIN_GROUP}` : g.n} siswa</span></div>
      {hidden ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><EyeOff className="size-4" />Angka disembunyikan karena kelompok kurang dari {MIN_GROUP} siswa.</p>
      ) : (
        <div className={cn("mt-4 grid gap-6", big && "md:grid-cols-2")}>
          <div className="space-y-3 text-sm">
            {[["Asesmen selesai", g.pctAssess], ["Siswa dengan profil (≥2 asesmen)", g.pctProfile], ["Siswa dengan roadmap", g.pctRoadmap], ["Rata-rata skor kesiapan", g.avgScore]].map(([l, v]) => (
              <div key={l as string}><div className="mb-1 flex justify-between"><span>{l}</span><b className="tabular-nums">{v}{l === "Rata-rata skor kesiapan" ? "" : "%"}</b></div><Progress value={v as number} /></div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Sebaran minat dominan (RIASEC)</p>
            {withInterest < MIN_GROUP ? <p className="text-sm text-slate-500">Disembunyikan (data minat &lt; {MIN_GROUP} siswa).</p> : (
              <div className="flex h-36 items-end gap-2">
                {RIASEC.map((k) => (
                  <div key={k} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs tabular-nums text-slate-600">{Math.round((g.riasec[k] / withInterest) * 100)}%</span>
                    <div className="w-full rounded-t-lg bg-linear-to-t from-brand-500 to-cyan-400" style={{ height: `${(g.riasec[k] / maxR) * 90}px` }} />
                    <span className="text-xs font-semibold" title={ASSESSMENTS.minat.dims.find((d) => d.key === k)?.label}>{k}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
