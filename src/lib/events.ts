import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { pseudoId } from "@/lib/crypto";

// Daftar event sesuai rencana instrumentasi (Bab 7). Hanya ID pseudonim, jenis, waktu.
export type EventType =
  | "account_registered" | "consent_recorded" | "assessment_started" | "assessment_completed"
  | "profile_generated" | "roadmap_saved" | "roadmap_step_completed" | "chat_session_started"
  | "ai_feedback_given" | "crisis_screen_shown" | "dashboard_opened" | "student_detail_opened"
  | "counseling_note_saved" | "clarity_survey_answered" | "account_deletion_requested";

export async function track(userId: string, type: EventType) {
  try {
    await createAdminClient().from("events").insert({ pseudo_id: pseudoId(userId), event_type: type });
  } catch {
    /* analitik tidak boleh mematahkan alur utama */
  }
}

export async function audit(actorId: string | null, action: string, targetId?: string | null, detail: Record<string, unknown> = {}) {
  try {
    await createAdminClient().from("audit_logs").insert({ actor_id: actorId, action, target_id: targetId ?? null, detail });
  } catch {
    /* noop */
  }
}
