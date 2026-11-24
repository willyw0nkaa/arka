import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Variabel lingkungan ${name} belum diisi. Lihat .env.example`);
  return v;
}

/** Klien dengan sesi pengguna (tunduk pada RLS). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // dipanggil dari Server Component: abaikan, proxy yang memperbarui sesi
        }
      },
    },
  });
}

/** Klien service role — HANYA di server, setelah pemeriksaan otorisasi eksplisit. */
export function createAdminClient() {
  return createSupabaseClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
