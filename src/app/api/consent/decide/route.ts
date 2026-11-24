import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hashCode, safeEqual } from "@/lib/crypto";
import { track, audit } from "@/lib/events";
import { bad } from "@/lib/auth";

/** Orang tua menyetujui/menolak (FR-002). Tidak butuh login: diverifikasi dengan token tautan + kode 6 digit. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const token = String(b.token ?? "");
  const code = String(b.code ?? "").replace(/\D/g, "");
  const decision = b.decision === "granted" ? "granted" : b.decision === "rejected" ? "rejected" : null;
  const parentName = String(b.parent_name ?? "").trim().slice(0, 120);
  if (!token || !decision) return bad("Permintaan tidak valid.");
  if (code.length !== 6) return bad("Masukkan kode verifikasi 6 digit.");
  if (!parentName) return bad("Nama orang tua/wali wajib diisi.");

  const db = createAdminClient();
  const { data: c } = await db.from("consents").select("*").eq("token", token).maybeSingle();
  if (!c || c.status !== "pending") return bad("Tautan tidak berlaku lagi.", 410);
  if (new Date(c.expires_at) < new Date()) return bad("Tautan sudah kedaluwarsa. Minta anak Anda mengirim tautan baru dari aplikasi.", 410);

  // batasi tebakan kode: 5 percobaan salah → tautan dibatalkan
  const { count } = await db.from("audit_logs").select("id", { count: "exact", head: true }).eq("action", "consent_code_failed").eq("target_id", c.id);
  if ((count ?? 0) >= 5) {
    await db.from("consents").update({ status: "superseded" }).eq("id", c.id);
    return bad("Terlalu banyak percobaan. Minta tautan baru.", 429);
  }
  if (!safeEqual(hashCode(code), c.code_hash)) {
    await audit(null, "consent_code_failed", c.id);
    return bad("Kode verifikasi salah.");
  }

  const now = new Date().toISOString();
  await db.from("consents").update({ status: decision, decided_at: now, parent_name: parentName }).eq("id", c.id);
  if (decision === "granted") {
    await db.from("profiles").update({ status: "active", parent_name: parentName }).eq("id", c.student_id);
    await track(c.student_id, "consent_recorded");
  } else {
    // Ditolak: akun tidak aktif, data terhapus dalam 30 hari (oleh cron purge)
    await db.from("profiles").update({ status: "rejected", deletion_requested_at: now }).eq("id", c.student_id);
  }
  await audit(null, `consent_${decision}`, c.student_id, { consent_id: c.id, policy_version: c.policy_version });
  return NextResponse.json({ ok: true, decision });
}
