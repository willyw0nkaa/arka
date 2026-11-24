import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { loadCareers, loadStudent } from "@/lib/data";
import { generateRoadmap } from "@/lib/profile";
import { track } from "@/lib/events";

/** Roadmap selalu dibuat ulang di server dari hasil asesmen terbaru (tidak mempercayai data klien). */
export async function POST() {
  const a = await requireApi({ roles: ["student"], active: true });
  if (!a.ok) return a.res;
  const d = await loadStudent(a.userId);
  if (d.profile.status === "belum") return bad("Selesaikan minimal 2 asesmen terlebih dahulu.");
  const data = generateRoadmap(await loadCareers(), d.latest, a.profile.class_level);
  // pertahankan langkah yang sudah selesai (dicocokkan berdasarkan judul)
  const doneTitles = new Set((d.roadmap?.data.steps ?? []).filter((s) => s.done).map((s) => s.title));
  data.steps = data.steps.map((s) => ({ ...s, done: doneTitles.has(s.title) }));
  const { error } = await createAdminClient().from("roadmaps").insert({ student_id: a.userId, data });
  if (error) return bad(error.message, 500);
  await track(a.userId, "roadmap_saved");
  return NextResponse.json({ ok: true, data });
}
