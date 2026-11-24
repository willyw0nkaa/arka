import Link from "next/link";
import { ClipboardList, Clock, ListChecks, ArrowRight, Info } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { loadStudent } from "@/lib/data";
import { ASSESSMENTS, ASSESSMENT_KEYS } from "@/lib/assessments";
import { Alert, Badge, PageHeader, Progress } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Asesmen" };

export default async function Page() {
  const { profile } = await requirePage({ roles: ["student"], active: true });
  const d = await loadStudent(profile.id);
  return (
    <>
      <PageHeader title="Asesmen" icon={<ClipboardList className="size-5" />}
        subtitle="Empat asesmen, total sekitar 90–120 menit. Kerjakan bertahap — jawabanmu tersimpan otomatis." />
      <div className="mb-6"><Alert tone="brand" icon={<Info className="size-5" />}>Tidak ada jawaban benar atau salah. Pilih yang paling menggambarkan dirimu. Profil sementara terbentuk setelah <b>2 asesmen</b> selesai.</Alert></div>
      <div className="grid gap-5 sm:grid-cols-2">
        {ASSESSMENT_KEYS.map((k) => {
          const a = ASSESSMENTS[k];
          const last = d.latest[k];
          const prog = d.progress.find((p) => p.assessment_key === k);
          const n = prog ? Object.keys(prog.answers).length : 0;
          return (
            <Link key={k} href={`/asesmen/${k}`} className="glass group block p-6 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-brand-500 to-cyan-500 text-white shadow-lg shadow-brand-500/30"><ListChecks className="size-6" /></div>
                {last ? <Badge tone="green">Selesai · {fmtDate(last.completed_at)}</Badge> : n > 0 ? <Badge tone="amber">Sedang dikerjakan</Badge> : <Badge>Belum dimulai</Badge>}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{a.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{a.subtitle}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><ListChecks className="size-3.5" />{a.items.length} pernyataan</span>
                <span className="flex items-center gap-1"><Clock className="size-3.5" />{a.minutes}</span>
              </div>
              {n > 0 && !last && <div className="mt-4"><Progress value={(n / a.items.length) * 100} /><p className="mt-1 text-xs text-slate-500">{n} dari {a.items.length} terjawab</p></div>}
              <p className="mt-5 flex items-center gap-1 text-sm font-semibold text-brand-700">
                {last ? "Lihat hasil / ulangi" : n > 0 ? "Lanjutkan" : "Mulai"} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
