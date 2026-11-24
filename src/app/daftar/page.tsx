import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { createAdminClient } from "@/lib/supabase/server";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Daftar" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ sekolah?: string }> }) {
  const sp = await searchParams;
  const { data } = await createAdminClient().from("schools").select("id, name, city, invite_code").order("name");
  const schools = (data ?? []).map((s) => ({ id: s.id as string, name: s.name as string, city: s.city as string }));
  const pre = sp.sekolah ? (data ?? []).find((s) => s.invite_code === sp.sekolah?.toUpperCase())?.id ?? "" : "";
  return (
    <AuthShell wide title="Buat akun ARKA" subtitle="Isi data dasar. Siswa di bawah 18 tahun perlu persetujuan orang tua sebelum asesmen dibuka.">
      <Suspense><RegisterForm schools={schools} prefillSchool={pre} /></Suspense>
    </AuthShell>
  );
}
