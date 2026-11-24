import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { track } from "@/lib/events";

export async function POST(req: Request) {
  const a = await requireApi({ roles: ["student"], active: true });
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  const score = Number(b.score);
  const phase = b.phase === "post" ? "post" : "pre";
  if (!Number.isInteger(score) || score < 1 || score > 5) return bad("Skor tidak valid.");
  const db = createAdminClient();
  const { count } = await db.from("clarity_surveys").select("id", { count: "exact", head: true }).eq("student_id", a.userId).eq("phase", phase);
  if ((count ?? 0) > 0) return bad("Survei ini sudah dijawab.");
  await db.from("clarity_surveys").insert({ student_id: a.userId, phase, score });
  await track(a.userId, "clarity_survey_answered");
  return NextResponse.json({ ok: true });
}
