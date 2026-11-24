import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { track } from "@/lib/events";
import type { RoadmapData } from "@/lib/types";

export async function POST(req: Request) {
  const a = await requireApi({ roles: ["student"], active: true });
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  const id = String(b.id ?? "");
  const done = Boolean(b.done);
  const db = createAdminClient();
  const { data: rm } = await db.from("roadmaps").select("id, data").eq("student_id", a.userId).order("saved_at", { ascending: false }).limit(1).maybeSingle();
  if (!rm) return bad("Roadmap belum disimpan.", 404);
  const data = rm.data as RoadmapData;
  if (!data.steps.some((s) => s.id === id)) return bad("Langkah tidak ditemukan.", 404);
  data.steps = data.steps.map((s) => (s.id === id ? { ...s, done } : s));
  await db.from("roadmaps").update({ data }).eq("id", rm.id);
  if (done) await track(a.userId, "roadmap_step_completed");
  const n = data.steps.filter((s) => s.done).length;
  return NextResponse.json({ ok: true, progress: Math.round((n / data.steps.length) * 100) });
}
