import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { readinessScore, readinessTags, type Tag } from "@/lib/readiness";

export type OverviewRow = {
  id: string; full_name: string; class_level: number | null; class_name: string | null; created_at: string;
  assessments_done: number; has_roadmap: boolean; steps_total: number; steps_done: number;
  last_clarity: number | null; top_interest: string | null; last_activity: string;
};
export type StudentRow = OverviewRow & { score: number; tags: Tag[] };

export async function schoolOverview(schoolId: string, since?: Date): Promise<StudentRow[]> {
  const { data, error } = await createAdminClient().rpc("school_student_overview", {
    p_school: schoolId,
    p_since: (since ?? new Date(0)).toISOString(),
  });
  if (error) throw new Error("Gagal memuat data sekolah: " + error.message + ". Pastikan schema.sql terbaru sudah dijalankan.");
  return ((data ?? []) as OverviewRow[]).map((r) => {
    const input = {
      assessmentsDone: r.assessments_done, hasRoadmap: r.has_roadmap, stepsDone: r.steps_done, stepsTotal: r.steps_total,
      clarity: r.last_clarity, daysSinceActive: Math.floor((Date.now() - +new Date(r.created_at)) / 86400_000),
    };
    const score = readinessScore(input);
    return { ...r, score, tags: readinessTags(input, score) };
  });
}
