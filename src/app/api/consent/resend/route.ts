import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { issueConsent } from "@/lib/consent";
import { createAdminClient } from "@/lib/supabase/server";
import { isEmail } from "@/lib/utils";

/** Siswa meminta tautan persetujuan baru (FR-002: tautan > 7 hari kedaluwarsa). Bisa juga memperbaiki email ortu. */
export async function POST(req: Request) {
  const a = await requireApi({ roles: ["student"] });
  if (!a.ok) return a.res;
  const p = a.profile;
  if (p.status !== "pending_consent" && p.status !== "rejected") return bad("Akun tidak memerlukan persetujuan.");
  const b = await req.json().catch(() => ({}));
  const contact = (String(b.parent_contact ?? "").trim().toLowerCase() || p.parent_contact) ?? "";
  const name = String(b.parent_name ?? "").trim() || p.parent_name || "";
  if (!isEmail(contact)) return bad("Email orang tua tidak valid.");
  if (contact === p.email.toLowerCase()) return bad("Email orang tua harus berbeda dari email siswa.");

  // Ambil ulang batas: maksimal 5 tautan per 24 jam
  const db = createAdminClient();
  const since = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await db.from("consents").select("id", { count: "exact", head: true }).eq("student_id", p.id).gte("created_at", since);
  if ((count ?? 0) >= 5) return bad("Terlalu banyak permintaan. Coba lagi besok.", 429);

  await db.from("profiles").update({ parent_contact: contact, parent_name: name, status: "pending_consent", deletion_requested_at: null }).eq("id", p.id);
  const c = await issueConsent({ id: p.id, full_name: p.full_name }, name, contact);
  return NextResponse.json({ ok: true, demo: c.demo, sent: c.sent });
}
