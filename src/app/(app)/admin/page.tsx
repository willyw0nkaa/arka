import { ShieldCheck } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { AdminPanel } from "./AdminPanel";
import { ageFrom } from "@/lib/utils";

export const metadata = { title: "Admin" };

export default async function Page() {
  await requirePage({ roles: ["admin"] });
  const db = createAdminClient();
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [staff, schools, flagged, events, students, consents] = await Promise.all([
    db.from("profiles").select("id, full_name, email, role, verified, status, school_id, created_at").in("role", ["counselor", "principal"]).order("created_at", { ascending: false }),
    db.from("schools").select("id, name, city, type, invite_code, created_at").order("name"),
    db.from("chat_messages").select("id, content, model, provider, created_at, student_id").eq("feedback", "inaccurate").eq("reviewed", false).order("created_at", { ascending: false }).limit(50),
    db.from("events").select("event_type").gte("created_at", since).limit(50000),
    db.from("profiles").select("id, birth_date, status").eq("role", "student"),
    db.from("consents").select("student_id").eq("status", "granted"),
  ]);

  // Pertanyaan yang mendahului tiap jawaban bermasalah (tanpa identitas siswa)
  const review = await Promise.all((flagged.data ?? []).map(async (m) => {
    const { data: q } = await db.from("chat_messages").select("content").eq("student_id", m.student_id).eq("role", "user").lt("created_at", m.created_at).order("created_at", { ascending: false }).limit(1).maybeSingle();
    return { id: m.id, answer: m.content, question: q?.content ?? "—", model: `${m.provider ?? "-"} / ${m.model ?? "-"}`, created_at: m.created_at };
  }));

  const counts: Record<string, number> = {};
  for (const e of events.data ?? []) counts[e.event_type] = (counts[e.event_type] ?? 0) + 1;

  // GR2: akun < 18 tahun yang sudah punya hasil asesmen tapi tanpa persetujuan tercatat (harus 0)
  const granted = new Set((consents.data ?? []).map((c) => c.student_id));
  const minors = (students.data ?? []).filter((s) => s.birth_date && ageFrom(s.birth_date) < 18);
  const { data: withResults } = await db.from("assessment_results").select("student_id").in("student_id", minors.map((m) => m.id).slice(0, 300));
  const gr2Violations = new Set((withResults ?? []).map((r) => r.student_id).filter((id) => !granted.has(id))).size;

  return (
    <>
      <PageHeader title="Admin ARKA" icon={<ShieldCheck className="size-5" />} subtitle="Verifikasi akun, kelola sekolah, tinjau jawaban AI, dan pantau metrik." />
      <AdminPanel
        staff={(staff.data ?? []) as never}
        schools={(schools.data ?? []) as never}
        review={review}
        counts={counts}
        guard={{ minors: minors.length, gr2Violations, activeStudents: (students.data ?? []).filter((s) => s.status === "active").length, pending: (students.data ?? []).filter((s) => s.status === "pending_consent").length }}
      />
    </>
  );
}
