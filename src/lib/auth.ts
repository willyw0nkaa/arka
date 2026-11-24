import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export async function getCurrent(): Promise<{ userId: string; profile: Profile } | null> {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await createAdminClient().from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data) return null;
  return { userId: user.id, profile: data as Profile };
}

export const homeFor = (role: Role) =>
  role === "counselor" ? "/guru" : role === "principal" ? "/laporan" : role === "admin" ? "/admin" : "/beranda";

/** Untuk halaman (Server Component). */
export async function requirePage(opts: { roles?: Role[]; active?: boolean } = {}) {
  const cur = await getCurrent();
  if (!cur) redirect("/masuk");
  const { profile } = cur;
  if (profile.status === "deactivated" || profile.deletion_requested_at) redirect("/keluar?alasan=nonaktif");
  if (opts.roles && !opts.roles.includes(profile.role)) redirect(homeFor(profile.role));
  if (profile.role !== "student" && profile.role !== "admin" && !profile.verified) redirect("/menunggu-verifikasi");
  if (opts.active && profile.status !== "active") redirect("/beranda?terkunci=1");
  return cur;
}

type ApiOk = { ok: true; userId: string; profile: Profile };
type ApiErr = { ok: false; res: NextResponse };

/** Untuk route handler (API). Memeriksa ulang peran & status di setiap permintaan (FR-009: akses hilang seketika). */
export async function requireApi(opts: { roles?: Role[]; active?: boolean } = {}): Promise<ApiOk | ApiErr> {
  const cur = await getCurrent();
  if (!cur) return { ok: false, res: NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 }) };
  const { profile } = cur;
  const deny = (msg: string, status = 403) => ({ ok: false as const, res: NextResponse.json({ error: msg }, { status }) });
  if (profile.status === "deactivated" || profile.deletion_requested_at) return deny("Akun tidak aktif.");
  if (opts.roles && !opts.roles.includes(profile.role)) return deny("Akses ditolak.");
  if (profile.role !== "student" && profile.role !== "admin" && !profile.verified) return deny("Akun belum diverifikasi admin.");
  if (opts.active && profile.status !== "active") return deny("Fitur terkunci sampai persetujuan orang tua tercatat.");
  return { ok: true, ...cur };
}

export function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}
