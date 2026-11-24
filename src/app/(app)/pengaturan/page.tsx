import { Settings, Eye, UserRound } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, PageHeader, Badge } from "@/components/ui";
import { ageFrom, fmtDate } from "@/lib/utils";
import { DeleteAccount } from "./DeleteAccount";

export const metadata = { title: "Pengaturan" };

export default async function Page() {
  const { profile } = await requirePage();
  let school = "—";
  if (profile.school_id) {
    const { data } = await createAdminClient().from("schools").select("name, city").eq("id", profile.school_id).maybeSingle();
    if (data) school = `${data.name}, ${data.city}`;
  }
  const minor = profile.role === "student" && profile.birth_date ? ageFrom(profile.birth_date) < 18 : false;
  const rows: [string, string][] = [
    ["Nama", profile.full_name], ["Email", profile.email], ["Sekolah", school],
    ...(profile.role === "student" ? ([["Kelas", `${profile.class_level ?? "-"}${profile.class_name ? ` (${profile.class_name})` : ""}`], ["Tanggal lahir", profile.birth_date ? fmtDate(profile.birth_date) : "-"], ["Orang tua/wali", profile.parent_contact ?? "—"]] as [string, string][]) : []),
    ["Terdaftar sejak", fmtDate(profile.created_at)],
  ];
  return (
    <>
      <PageHeader title="Pengaturan" icon={<Settings className="size-5" />} subtitle="Data akun dan kendali atas datamu." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><UserRound className="size-5 text-brand-600" />Data akun</h2>
          <dl className="mt-4 divide-y divide-slate-200/70 text-sm">
            {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-800">{v}</dd></div>)}
          </dl>
          <p className="mt-3 text-xs text-slate-500">Untuk mengubah data, hubungi guru BK atau admin sekolahmu.</p>
        </Card>
        {profile.role === "student" && (
          <Card>
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Eye className="size-5 text-brand-600" />Siapa melihat apa</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start justify-between gap-3"><span>Guru BK sekolahmu</span><span className="text-right text-slate-600">Profil, status asesmen, skor kesiapan, roadmap</span></li>
              <li className="flex items-start justify-between gap-3"><span>Isi percakapan Companion</span><Badge tone="green">Hanya kamu</Badge></li>
              <li className="flex items-start justify-between gap-3"><span>Kepala sekolah</span><span className="text-right text-slate-600">Angka gabungan tanpa nama</span></li>
              <li className="flex items-start justify-between gap-3"><span>Sekolah lain</span><Badge tone="red">Tidak ada akses</Badge></li>
            </ul>
          </Card>
        )}
      </div>
      <div className="mt-6"><DeleteAccount minor={minor} parentContact={profile.parent_contact} email={profile.email} /></div>
    </>
  );
}
