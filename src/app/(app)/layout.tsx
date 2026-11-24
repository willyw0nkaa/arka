import { Sidebar } from "@/components/Sidebar";
import { requirePage } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requirePage();
  let schoolName: string | null = null;
  if (profile.school_id) {
    const { data } = await createAdminClient().from("schools").select("name").eq("id", profile.school_id).maybeSingle();
    schoolName = data?.name ?? null;
  }
  return (
    <div className="min-h-dvh">
      <Sidebar role={profile.role} name={profile.full_name} schoolName={schoolName} locked={profile.role === "student" && profile.status !== "active"} />
      <main className="px-4 py-6 sm:px-6 lg:ml-76 lg:px-8 lg:py-8">
        <div className="print-full mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
