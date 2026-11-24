import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { audit } from "@/lib/events";

/**
 * Dijalankan harian oleh Vercel Cron (vercel.json). Vercel otomatis mengirim
 * header "Authorization: Bearer <CRON_SECRET>".
 * - FR-010 / FR-002: hapus permanen akun yang diminta dihapus / ditolak ortu > 30 hari lalu.
 * - Audit log disimpan minimal 12 bulan; yang > 13 bulan dibersihkan.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = createAdminClient();
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data: due } = await db.from("profiles").select("id").not("deletion_requested_at", "is", null).lt("deletion_requested_at", cutoff).limit(500);
  let deleted = 0;
  for (const p of due ?? []) {
    // menghapus auth user → profiles & seluruh data terkait ikut terhapus (ON DELETE CASCADE)
    const { error } = await db.auth.admin.deleteUser(p.id);
    if (!error) deleted++;
    else await db.from("profiles").delete().eq("id", p.id);
  }
  const auditCutoff = new Date(Date.now() - 400 * 86400_000).toISOString();
  await db.from("audit_logs").delete().lt("created_at", auditCutoff);
  await db.from("verification_codes").delete().lt("expires_at", cutoff);
  await audit(null, "purge_run", null, { deleted });
  return NextResponse.json({ ok: true, deleted });
}
