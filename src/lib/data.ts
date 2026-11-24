import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { buildProfile, latestResults } from "@/lib/profile";
import type { CareerItem, ResultRow, RoadmapData } from "@/lib/types";

export async function loadStudent(studentId: string) {
  const db = createAdminClient();
  const [results, roadmap, progress, surveys] = await Promise.all([
    db.from("assessment_results").select("id, assessment_key, scores, completed_at").eq("student_id", studentId).order("completed_at", { ascending: false }),
    db.from("roadmaps").select("id, data, saved_at").eq("student_id", studentId).order("saved_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("assessment_progress").select("assessment_key, answers, updated_at").eq("student_id", studentId),
    db.from("clarity_surveys").select("phase, score, created_at").eq("student_id", studentId).order("created_at", { ascending: false }),
  ]);
  const rows = (results.data ?? []) as ResultRow[];
  const latest = latestResults(rows);
  const profile = buildProfile(latest);
  const rm = roadmap.data as { id: string; data: RoadmapData; saved_at: string } | null;
  return {
    results: rows,
    latest,
    profile,
    roadmap: rm,
    progress: (progress.data ?? []) as { assessment_key: string; answers: Record<string, number>; updated_at: string }[],
    surveys: (surveys.data ?? []) as { phase: "pre" | "post"; score: number; created_at: string }[],
  };
}

export async function loadCareers(): Promise<CareerItem[]> {
  const { data } = await createAdminClient().from("career_items").select("*").order("name");
  return (data ?? []) as CareerItem[];
}

/** Tanggal profil pertama terbentuk = saat asesmen ke-2 (berbeda) selesai. */
export function profileFormedAt(rows: ResultRow[]) {
  const seen = new Set<string>();
  const asc = [...rows].sort((a, b) => +new Date(a.completed_at) - +new Date(b.completed_at));
  for (const r of asc) {
    seen.add(r.assessment_key);
    if (seen.size >= 2) return r.completed_at;
  }
  return null;
}
