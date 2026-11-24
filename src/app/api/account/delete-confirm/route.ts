import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { hashCode, safeEqual } from "@/lib/crypto";
import { track, audit } from "@/lib/events";

export async function POST(req: Request) {
  const a = await requireApi();
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  const code = String(b.code ?? "").replace(/\D/g, "");
  const db = createAdminClient();
  const { data: v } = await db.from("verification_codes").select("*").eq("user_id", a.userId).eq("purpose", "delete").eq("used", false)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!v || new Date(v.expires_at) < new Date()) return bad("Kode kedaluwarsa. Minta kode baru.");
  if (!safeEqual(hashCode(code), v.code_hash)) return bad("Kode salah.");
  await db.from("verification_codes").update({ used: true }).eq("id", v.id);
  const now = new Date().toISOString();
  // Nonaktif seketika; data dihapus permanen oleh /api/cron/purge setelah 30 hari
  await db.from("profiles").update({ status: "deactivated", deletion_requested_at: now }).eq("id", a.userId);
  await db.auth.admin.updateUserById(a.userId, { ban_duration: "876000h" }); // blokir login
  await track(a.userId, "account_deletion_requested");
  await audit(a.userId, "account_deletion_requested", a.userId);
  return NextResponse.json({ ok: true });
}
