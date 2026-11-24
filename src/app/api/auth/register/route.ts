import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { issueConsent } from "@/lib/consent";
import { track, audit } from "@/lib/events";
import { ageFrom, isEmail } from "@/lib/utils";
import { bad } from "@/lib/auth";

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return bad("Data tidak valid.");
  }
  const str = (k: string, max = 120) => String(b[k] ?? "").trim().slice(0, max);
  const role = str("role") as "student" | "counselor" | "principal";
  const full_name = str("full_name");
  const email = str("email", 200).toLowerCase();
  const password = String(b.password ?? "");
  const school_id = b.school_id ? str("school_id", 64) : null;

  if (!["student", "counselor", "principal"].includes(role)) return bad("Peran tidak valid.");
  if (full_name.length < 2) return bad("Nama wajib diisi.");
  if (!isEmail(email)) return bad("Email tidak valid.");
  if (password.length < 8) return bad("Kata sandi minimal 8 karakter.");

  const db = createAdminClient();
  if (school_id) {
    const { data: s } = await db.from("schools").select("id").eq("id", school_id).maybeSingle();
    if (!s) return bad("Sekolah tidak ditemukan.");
  } else if (role !== "student") return bad("Sekolah wajib dipilih.");

  let birth_date: string | null = null, class_level: number | null = null, class_name: string | null = null;
  let parent_name: string | null = null, parent_contact: string | null = null, minor = false;
  if (role === "student") {
    birth_date = str("birth_date", 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth_date)) return bad("Tanggal lahir tidak valid.");
    const age = ageFrom(birth_date);
    if (age < 10 || age > 25) return bad("Tanggal lahir tidak valid.");
    class_level = Number(b.class_level);
    if (![10, 11, 12].includes(class_level)) return bad("Kelas tidak valid.");
    class_name = str("class_name", 40) || null;
    minor = age < 18;
    if (minor) {
      parent_name = str("parent_name") || null;
      parent_contact = str("parent_contact", 200).toLowerCase();
      if (!isEmail(parent_contact)) return bad("Email orang tua/wali wajib diisi.");
      if (parent_contact === email) return bad("Email orang tua harus berbeda dari email siswa.");
    }
  }

  const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });

  const { data: created, error: cErr } = await db.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name },
  });
  if (cErr || !created.user) {
    const msg = cErr?.message ?? "";
    if (/already|registered|exists/i.test(msg)) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    return bad("Gagal membuat akun: " + msg, 500);
  }
  const id = created.user.id;
  const status = minor ? "pending_consent" : "active";
  const { error: pErr } = await db.from("profiles").insert({
    id, role, full_name, email, birth_date, class_level, class_name, school_id, status,
    verified: false, parent_name, parent_contact,
  });
  if (pErr) {
    await db.auth.admin.deleteUser(id);
    return bad("Gagal menyimpan profil: " + pErr.message, 500);
  }

  await track(id, "account_registered");
  await audit(id, "account_registered", id, { role });

  let demo = null, sent = false;
  if (minor && parent_contact) {
    const c = await issueConsent({ id, full_name }, parent_name ?? "", parent_contact);
    demo = c.demo;
    sent = c.sent;
  }
  return NextResponse.json({ ok: true, status, demo, sent });
}
