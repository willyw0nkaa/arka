import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { hashCode, sixDigit } from "@/lib/crypto";
import { DEMO_MODE, emailLayout, sendEmail } from "@/lib/email";
import { ageFrom } from "@/lib/utils";

export async function POST() {
  const a = await requireApi();
  if (!a.ok) return a.res;
  const p = a.profile;
  // FR-010 edge case: akun anak diverifikasi lewat kontak persetujuan awal
  const minor = p.role === "student" && p.birth_date && ageFrom(p.birth_date) < 18;
  const to = minor && p.parent_contact ? p.parent_contact : p.email;
  const db = createAdminClient();
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("verification_codes").select("id", { count: "exact", head: true }).eq("user_id", p.id).eq("purpose", "delete").gte("created_at", since);
  if ((count ?? 0) >= 5) return bad("Terlalu banyak permintaan. Coba lagi nanti.", 429);
  const code = sixDigit();
  await db.from("verification_codes").update({ used: true }).eq("user_id", p.id).eq("purpose", "delete").eq("used", false);
  await db.from("verification_codes").insert({ user_id: p.id, purpose: "delete", code_hash: hashCode(code), expires_at: new Date(Date.now() + 15 * 60_000).toISOString() });
  const sent = await sendEmail(to, "Konfirmasi penghapusan akun ARKA",
    emailLayout("Konfirmasi penghapusan akun", `<p>Ada permintaan menghapus akun ARKA milik <b>${p.full_name}</b>.</p><p>Kode konfirmasi: <b style="font-size:22px;letter-spacing:4px">${code}</b> (berlaku 15 menit)</p><p>Abaikan email ini bila Anda tidak memintanya.</p>`));
  return NextResponse.json({ ok: true, sent, to, demoCode: DEMO_MODE ? code : null });
}
