import { LayoutDashboard, Users, ClipboardList, Gauge, TriangleExclamationPoint } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { schoolOverview } from "@/lib/school";
import { track } from "@/lib/events";
import { appUrl } from "@/lib/utils";
import { PageHeader, Stat } from "@/components/ui";
import { StudentTable } from "./StudentTable";
import { InviteEmpty } from "./InviteEmpty";

export const metadata = { title: "Dashboard Guru BK" };

export default async function Page() {
  const { profile } = await requirePage({ roles: ["counselor"] });
  const { data: school } = await createAdminClient().from("schools").select("name, invite_code").eq("id", profile.school_id!).single();
  const rows = await schoolOverview(profile.school_id!);
  await track(profile.id, "dashboard_opened");
  const invite = `${appUrl()}/daftar?sekolah=${school?.invite_code}`;

  const avg = rows.length ? Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length) : 0;
  const priority = rows.filter((r) => r.tags.some((t) => t.priority <= 2)).length;
  const withProfile = rows.filter((r) => r.assessments_done >= 2).length;

  return (
    <>
      <PageHeader title="Dashboard Siswa" icon={<LayoutDashboard className="size-5" />} subtitle={`${school?.name} · siswa dengan persetujuan aktif`} />
      {rows.length === 0 ? (
        <InviteEmpty link={invite} code={school?.invite_code ?? ""} />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Siswa aktif" value={rows.length} icon={<Users className="size-5" />} />
            <Stat label="Sudah punya profil" value={withProfile} hint={`${Math.round((withProfile / rows.length) * 100)}% siswa`} icon={<ClipboardList className="size-5" />} />
            <Stat label="Rata-rata kesiapan" value={avg} hint="dari 100" icon={<Gauge className="size-5" />} />
            <Stat label="Perlu perhatian" value={priority} hint="tag prioritas merah/kuning" icon={<TriangleExclamationPoint className="size-5" />} />
          </div>
          <StudentTable rows={rows} inviteLink={invite} />
        </>
      )}
    </>
  );
}
