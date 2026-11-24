import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { studentForCounselor } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/server";
import { track, audit } from "@/lib/events";

export async function POST(req: Request) {
  const a = await requireApi({ roles: ["counselor"] });
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  const content = String(b.content ?? "").trim().slice(0, 4000);
  if (!content) return bad("Catatan kosong.");
  const acc = await studentForCounselor(a.profile, String(b.studentId ?? ""));
  if (!acc.ok) return bad(acc.status === 403 ? "Akses ditolak." : "Siswa tidak ditemukan.", acc.status);
  const { data, error } = await createAdminClient().from("counseling_notes")
    .insert({ counselor_id: a.userId, student_id: acc.student.id, content }).select("id, content, created_at").single();
  if (error) return bad(error.message, 500);
  await track(a.userId, "counseling_note_saved");
  await audit(a.userId, "counseling_note_saved", acc.student.id);
  return NextResponse.json({ ok: true, note: data });
}
