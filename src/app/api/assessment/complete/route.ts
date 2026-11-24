import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { ASSESSMENTS, cleanAnswers, isAssessmentKey, scoreAssessment } from "@/lib/assessments";
import { track } from "@/lib/events";

export async function POST(req: Request) {
  const a = await requireApi({ roles: ["student"], active: true });
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  if (!isAssessmentKey(String(b.key))) return bad("Asesmen tidak dikenal.");
  const key = b.key as keyof typeof ASSESSMENTS;
  const answers = cleanAnswers(key, b.answers);
  const missing = ASSESSMENTS[key].items.filter((i) => !answers[i.id]).length;
  if (missing) return bad(`Masih ada ${missing} item kosong.`);

  const db = createAdminClient();
  const { data: before } = await db.from("assessment_results").select("assessment_key").eq("student_id", a.userId);
  const distinctBefore = new Set((before ?? []).map((r) => r.assessment_key));

  const scores = scoreAssessment(key, answers);
  const { error } = await db.from("assessment_results").insert({ student_id: a.userId, assessment_key: key, scores });
  if (error) return bad(error.message, 500);
  await db.from("assessment_progress").delete().eq("student_id", a.userId).eq("assessment_key", key);
  await track(a.userId, "assessment_completed");

  const distinctAfter = new Set([...distinctBefore, key]);
  if (distinctAfter.size >= 2 && distinctAfter.size !== distinctBefore.size) await track(a.userId, "profile_generated");
  return NextResponse.json({ ok: true, scores, doneCount: distinctAfter.size });
}
