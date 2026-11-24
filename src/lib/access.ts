import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { audit } from "@/lib/events";
import type { Profile } from "@/lib/types";

/** FR-009: guru BK hanya boleh membuka siswa di sekolahnya sendiri yang persetujuannya aktif. */
export async function studentForCounselor(counselor: Profile, studentId: string):
  Promise<{ ok: true; student: Profile } | { ok: false; status: 403 | 404 }> {
  if (!/^[0-9a-f-]{36}$/i.test(studentId)) return { ok: false, status: 404 };
  const { data } = await createAdminClient().from("profiles").select("*").eq("id", studentId).eq("role", "student").maybeSingle();
  const s = data as Profile | null;
  if (!s) return { ok: false, status: 404 };
  if (!counselor.school_id || s.school_id !== counselor.school_id) {
    await audit(counselor.id, "cross_school_access_denied", studentId, { counselor_school: counselor.school_id });
    return { ok: false, status: 403 };
  }
  if (s.status !== "active" || s.deletion_requested_at) return { ok: false, status: 404 };
  return { ok: true, student: s };
}
