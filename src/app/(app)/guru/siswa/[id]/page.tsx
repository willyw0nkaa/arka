import { notFound } from "next/navigation";
import { ShieldX, UserRound, GraduationCap, Briefcase, Route, ClipboardList, MessageSquareOff } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { studentForCounselor } from "@/lib/access";
import { loadStudent } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/server";
import { readinessScore, readinessTags } from "@/lib/readiness";
import { ASSESSMENTS, ASSESSMENT_KEYS } from "@/lib/assessments";
import { track, audit } from "@/lib/events";
import { Alert, Badge, Card, Empty, LinkButton, PageHeader, ScoreBars } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { Notes } from "./Notes";
import { Summary } from "./Summary";

export const metadata = { title: "Detail Siswa" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile: me } = await requirePage({ roles: ["counselor"] });
  const acc = await studentForCounselor(me, id);
  if (!acc.ok && acc.status === 403) {
    return <Empty icon={<ShieldX className="size-6" />} title="Akses ditolak (403)" action={<LinkButton href="/guru" variant="secondary">Kembali ke dashboard</LinkButton>}>Siswa ini bukan bagian dari sekolah Anda. Percobaan akses telah dicatat di audit log.</Empty>;
  }
  if (!acc.ok) notFound();
  const s = acc.student;
  await track(me.id, "student_detail_opened");
  await audit(me.id, "student_detail_viewed", s.id);

  const d = await loadStudent(s.id);
  const steps = d.roadmap?.data.steps ?? [];
  const input = { assessmentsDone: d.profile.done.length, hasRoadmap: !!d.roadmap, stepsDone: steps.filter((x) => x.done).length, stepsTotal: steps.length, clarity: d.surveys[0]?.score ?? null, daysSinceActive: Math.floor((Date.now() - +new Date(s.created_at)) / 86400_000) };
  const score = readinessScore(input);
  const tags = readinessTags(input, score);
  const { data: notes } = await createAdminClient().from("counseling_notes").select("id, content, created_at").eq("student_id", s.id).eq("counselor_id", me.id).order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title={s.full_name} icon={<UserRound className="size-5" />}
        subtitle={`Kelas ${s.class_level}${s.class_name ? ` · ${s.class_name}` : ""} · terdaftar ${fmtDate(s.created_at)}`}
        action={<LinkButton href="/guru" variant="secondary">Kembali</LinkButton>} />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone="brand" className="px-3 py-1 text-sm">Skor kesiapan {score}</Badge>
        <Badge className="px-3 py-1 text-sm">Asesmen {d.profile.done.length} dari 4</Badge>
        {d.profile.riasecCode && <Badge tone="blue" className="px-3 py-1 text-sm">Kode minat {d.profile.riasecCode}</Badge>}
        {tags.map((t) => <Badge key={t.key} tone={t.tone} className="px-3 py-1 text-sm">{t.label}</Badge>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <Summary studentId={s.id} />
          <Card>
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><ClipboardList className="size-5 text-brand-600" />Status asesmen & profil</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
              {ASSESSMENT_KEYS.map((k) => (
                <li key={k} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2">{ASSESSMENTS[k].title}
                  {d.latest[k] ? <Badge tone="green">{fmtDate(d.latest[k]!.completed_at)}</Badge> : <Badge>Belum</Badge>}</li>
              ))}
            </ul>
            {d.profile.status !== "belum" ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {d.profile.interests.length > 0 && <div><p className="mb-2 text-sm font-semibold">Minat teratas</p><ScoreBars items={d.profile.interests.slice(0, 3)} /></div>}
                {d.profile.aptitudes.length > 0 && <div><p className="mb-2 text-sm font-semibold">Bakat teratas</p><ScoreBars items={d.profile.aptitudes.slice(0, 3)} /></div>}
                {d.profile.values.length > 0 && <div><p className="mb-2 text-sm font-semibold">Nilai karier teratas</p><ScoreBars items={d.profile.values.slice(0, 3)} /></div>}
                {d.profile.personality.length > 0 && <div><p className="mb-2 text-sm font-semibold">Gaya kerja</p><ScoreBars items={d.profile.personality.slice(0, 3)} /></div>}
              </div>
            ) : <p className="mt-4 text-sm text-slate-600">Profil belum terbentuk (kurang dari 2 asesmen).</p>}
          </Card>
          <Card>
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Route className="size-5 text-brand-600" />Career Roadmap</h2>
            {!d.roadmap ? <p className="mt-3 text-sm text-slate-600">Siswa belum menyimpan roadmap.</p> : (
              <div className="mt-3 space-y-4 text-sm">
                <p className="text-xs text-slate-500">Disimpan {fmtDate(d.roadmap.saved_at)}</p>
                <div><p className="flex items-center gap-1.5 font-semibold"><GraduationCap className="size-4" />Jurusan</p><p className="mt-1 text-slate-700">{d.roadmap.data.majors.slice(0, 5).map((m) => `${m.name} (${m.match}%)`).join(" · ") || "—"}</p></div>
                <div><p className="flex items-center gap-1.5 font-semibold"><Briefcase className="size-4" />Profesi</p><p className="mt-1 text-slate-700">{d.roadmap.data.professions.slice(0, 5).map((m) => `${m.name} (${m.match}%)`).join(" · ") || "—"}</p></div>
                <div><p className="font-semibold">Langkah ({steps.filter((x) => x.done).length}/{steps.length} selesai)</p>
                  <ul className="mt-1 space-y-1">{steps.map((x) => <li key={x.id} className={x.done ? "text-slate-400 line-through" : "text-slate-700"}>• {x.title}</li>)}</ul></div>
              </div>
            )}
          </Card>
          <Alert tone="slate" icon={<MessageSquareOff className="size-5" />}>Isi percakapan siswa dengan AI Companion tidak ditampilkan untuk menjaga privasi siswa (OQ-10).</Alert>
        </div>
        <Notes studentId={s.id} initial={(notes ?? []) as { id: string; content: string; created_at: string }[]} />
      </div>
    </>
  );
}
