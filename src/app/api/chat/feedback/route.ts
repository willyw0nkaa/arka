import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { track } from "@/lib/events";

/** FR-020: jawaban bertanda "Tidak akurat" masuk antrean tinjauan mingguan (halaman Admin). */
export async function POST(req: Request) {
  const a = await requireApi({ roles: ["student"], active: true });
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  const value = b.value === "helpful" ? "helpful" : b.value === "inaccurate" ? "inaccurate" : null;
  if (!value || !b.id) return bad("Data tidak valid.");
  const { data, error } = await createAdminClient().from("chat_messages").update({ feedback: value, reviewed: false })
    .eq("id", String(b.id)).eq("student_id", a.userId).eq("role", "assistant").select("id");
  if (error || !data?.length) return bad("Pesan tidak ditemukan.", 404);
  await track(a.userId, "ai_feedback_given");
  return NextResponse.json({ ok: true });
}
