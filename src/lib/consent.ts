import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { hashCode, randomToken, sixDigit } from "@/lib/crypto";
import { DEMO_MODE, emailLayout, sendEmail } from "@/lib/email";
import { PRIVACY_POLICY_VERSION, appUrl } from "@/lib/utils";

export const CONSENT_TTL_DAYS = 7;

/** Membuat tautan persetujuan baru (menggantikan yang lama) dan mengirimnya ke orang tua. */
export async function issueConsent(student: { id: string; full_name: string }, parentName: string, parentContact: string) {
  const admin = createAdminClient();
  await admin.from("consents").update({ status: "superseded" }).eq("student_id", student.id).eq("status", "pending");
  const token = randomToken();
  const code = sixDigit();
  const expires = new Date(Date.now() + CONSENT_TTL_DAYS * 86400_000);
  const { error } = await admin.from("consents").insert({
    student_id: student.id,
    token,
    code_hash: hashCode(code),
    parent_name: parentName,
    parent_contact: parentContact,
    policy_version: PRIVACY_POLICY_VERSION,
    expires_at: expires.toISOString(),
  });
  if (error) throw error;
  const link = `${appUrl()}/persetujuan/${token}`;
  const sent = await sendEmail(
    parentContact,
    `Persetujuan data untuk ${student.full_name} di ARKA`,
    emailLayout(
      "Mohon persetujuan Anda",
      `<p>Yth. ${parentName || "Orang tua/wali"},</p>
       <p><b>${student.full_name}</b> mendaftar di ARKA, platform asesmen dan perencanaan karier sekolah. Karena usianya di bawah 18 tahun, kami memerlukan persetujuan Anda sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.</p>
       <p>Kode verifikasi Anda: <b style="font-size:22px;letter-spacing:4px">${code}</b></p>
       <p><a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">Buka halaman persetujuan</a></p>
       <p style="color:#64748b">Tautan berlaku ${CONSENT_TTL_DAYS} hari.</p>`
    )
  );
  return { link, sent, demo: DEMO_MODE ? { link, code } : null, expires_at: expires.toISOString() };
}
