import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { ASSESSMENTS, cleanAnswers, isAssessmentKey } from "@/lib/assessments";
import { track } from "@/lib/events";

export async function POST(req: Request) {
  const a = await requireApi({ roles: ["student"], active: true });
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  if (!isAssessmentKey(String(b.key))) return bad("Asesmen tidak dikenal.");
  const key = b.key as keyof typeof ASSESSMENTS;
  const answers = cleanAnswers(key, b.answers);
  const db = createAdminClient();
  const { data: existing } = await db.from("assessment_progress").select("student_id").eq("student_id", a.userId).eq("assessment_key", key).maybeSingle();
  const { error } = await db.from("assessment_progress").upsert({ student_id: a.userId, assessment_key: key, answers, updated_at: new Date().toISOString() });
  if (error) return bad(error.message, 500);
  if (!existing) await track(a.userId, "assessment_started");
  return NextResponse.json({ ok: true, count: Object.keys(answers).length });
}
