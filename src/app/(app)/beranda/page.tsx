import Link from "next/link";
import { ClipboardList, Map, MessagesSquare, Compass, Lock, ArrowRight, Sparkles, TrendingUp, UserRound } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { loadStudent, profileFormedAt } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/server";
import { ASSESSMENTS, ASSESSMENT_KEYS } from "@/lib/assessments";
import { readinessScore } from "@/lib/readiness";
import { Alert, Card, LinkButton, PageHeader, Progress, Stat, Badge } from "@/components/ui";
import { ConsentPending } from "./ConsentPending";
import { ClaritySurvey } from "./ClaritySurvey";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Beranda" };

export default async function Beranda({ searchParams }: { searchParams: Promise<{ terkunci?: string }> }) {
  const { profile } = await requirePage({ roles: ["student"] });
  const sp = await searchParams;
  const first = profile.full_name.split(" ")[0];

  if (profile.status !== "active") {
    const { data: c } = await createAdminClient().from("consents").select("expires_at, created_at, status").eq("student_id", profile.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const expired = c ? new Date(c.expires_at) < new Date() : true;
    return (
      <>
        <PageHeader title={`Halo, ${first}!`} subtitle="Satu langkah lagi sebelum kamu mulai." icon={<Sparkles className="size-5" />} />
        {sp.terkunci && <div className="mb-4"><Alert tone="amber" icon={<Lock className="size-5" />}>Fitur itu terkunci sampai persetujuan orang tua tercatat.</Alert></div>}
        <ConsentPending parentContact={profile.parent_contact ?? ""} parentName={profile.parent_name ?? ""} sentAt={c?.created_at ?? null} expired={expired} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card><p className="font-semibold text-slate-900">Sambil menunggu…</p><p className="mt-1 text-sm text-slate-600">Kamu bisa menjelajah profesi, program studi, dan beasiswa di Career Directory.</p><LinkButton href="/direktori" variant="secondary" className="mt-4"><Compass className="size-4" />Buka Career Directory</LinkButton></Card>
          <Card><p className="font-semibold text-slate-900">Apa saja yang terkunci?</p><p className="mt-1 text-sm text-slate-600">Asesmen, profil, roadmap, dan AI Companion. Semuanya terbuka otomatis setelah orang tua/wali menekan “Setuju”.</p></Card>
        </div>
      </>
    );
  }

  const d = await loadStudent(profile.id);
  const doneCount = d.profile.done.length;
  const steps = d.roadmap?.data.steps ?? [];
  const stepsDone = steps.filter((s) => s.done).length;
  const lastClarity = d.surveys[0]?.score ?? null;
  const score = readinessScore({ assessmentsDone: doneCount, hasRoadmap: !!d.roadmap, stepsDone, stepsTotal: steps.length, clarity: lastClarity, daysSinceActive: 0 });

  const hasPre = d.surveys.some((s) => s.phase === "pre");
  const hasPost = d.surveys.some((s) => s.phase === "post");
  const formed = profileFormedAt(d.results);
  const postDue = formed && !hasPost && Date.now() - +new Date(formed) >= 28 * 86400_000;
  const surveyPhase: "pre" | "post" | null = !hasPre && doneCount === 0 ? "pre" : postDue ? "post" : null;

  const started = d.progress.filter((p) => !d.profile.done.includes(p.assessment_key as never) && Object.keys(p.answers).length > 0);
  const next =
    started[0] ? { href: `/asesmen/${started[0].assessment_key}`, label: `Lanjutkan ${ASSESSMENTS[started[0].assessment_key as keyof typeof ASSESSMENTS].title}`, icon: ClipboardList }
    : doneCount < 2 ? { href: "/asesmen", label: "Mulai asesmen", icon: ClipboardList }
    : !d.roadmap ? { href: "/roadmap", label: "Lihat & simpan Career Roadmap", icon: Map }
    : doneCount < 4 ? { href: "/asesmen", label: "Lengkapi asesmen lainnya", icon: ClipboardList }
    : { href: "/companion", label: "Diskusikan dengan Companion", icon: MessagesSquare };

  return (
    <>
      <PageHeader title={`Halo, ${first}! 👋`} subtitle={d.profile.headline} icon={<Sparkles className="size-5" />}
        action={<LinkButton href={next.href}><next.icon className="size-4" />{next.label}<ArrowRight className="size-4" /></LinkButton>} />
      {sp.terkunci && <div className="mb-4"><Alert tone="amber" icon={<Lock className="size-5" />}>Halaman itu belum bisa dibuka.</Alert></div>}
      {surveyPhase && <div className="mb-6"><ClaritySurvey phase={surveyPhase} /></div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Asesmen selesai" value={`${doneCount} / 4`} icon={<ClipboardList className="size-5" />} hint={doneCount >= 2 ? "Profil sudah terbentuk" : "Minimal 2 untuk profil"} />
        <Stat label="Status profil" value={<span className="capitalize">{d.profile.status === "belum" ? "Belum ada" : d.profile.status}</span>} icon={<UserRound className="size-5" />} hint={d.profile.riasecCode ? `Kode minat ${d.profile.riasecCode}` : undefined} />
        <Stat label="Skor kesiapan" value={score} icon={<TrendingUp className="size-5" />} hint="dari 100" />
        <Stat label="Langkah roadmap" value={`${stepsDone} / ${steps.length || 0}`} icon={<Map className="size-5" />} hint={d.roadmap ? `Disimpan ${fmtDate(d.roadmap.saved_at)}` : "Belum disimpan"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Asesmenmu</h2><Link href="/asesmen" className="text-sm font-semibold text-brand-700 hover:underline">Lihat semua</Link></div>
          <ul className="mt-4 space-y-3">
            {ASSESSMENT_KEYS.map((k) => {
              const a = ASSESSMENTS[k];
              const done = d.profile.done.includes(k);
              const prog = d.progress.find((p) => p.assessment_key === k);
              const n = prog ? Object.keys(prog.answers).length : 0;
              const pct = done ? 100 : Math.round((n / a.items.length) * 100);
              return (
                <li key={k}>
                  <Link href={`/asesmen/${k}`} className="block rounded-2xl bg-white/70 p-3.5 transition hover:bg-white hover:shadow-md">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800">{a.title}</span>
                      {done ? <Badge tone="green">Selesai</Badge> : n > 0 ? <Badge tone="amber">{n}/{a.items.length}</Badge> : <Badge>Belum</Badge>}
                    </div>
                    <Progress value={pct} tone={done ? "green" : "brand"} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
        <div className="space-y-4">
          <Card className="bg-linear-to-br from-brand-600/90 to-violet-700/90 text-white">
            <MessagesSquare className="size-7" />
            <p className="mt-3 text-lg font-semibold">Punya pertanyaan soal jurusan?</p>
            <p className="mt-1 text-sm text-brand-100">Companion mengingat percakapanmu dan merujuk hasil asesmenmu.</p>
            <LinkButton href="/companion" variant="secondary" className="mt-4">Mulai ngobrol</LinkButton>
          </Card>
          <Card>
            <Compass className="size-6 text-brand-600" />
            <p className="mt-2 font-semibold text-slate-900">Career Directory</p>
            <p className="mt-1 text-sm text-slate-600">Jelajahi profesi, program studi, dan beasiswa.</p>
            <LinkButton href="/direktori" variant="secondary" className="mt-4">Jelajahi</LinkButton>
          </Card>
        </div>
      </div>
    </>
  );
}
