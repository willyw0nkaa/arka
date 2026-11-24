import { Compass } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { loadCareers, loadStudent } from "@/lib/data";
import { rankCareers } from "@/lib/profile";
import { PageHeader } from "@/components/ui";
import { Directory } from "./Directory";

export const metadata = { title: "Career Directory" };

export default async function Page() {
  const { profile } = await requirePage({ roles: ["student"] });
  const items = await loadCareers();
  let matches: Record<string, number> = {};
  if (profile.status === "active") {
    const d = await loadStudent(profile.id);
    if (d.profile.status !== "belum") {
      for (const kind of ["major", "profession"] as const) for (const r of rankCareers(items, d.latest, kind)) matches[r.item.id] = r.match;
    }
  } else matches = {};
  return (
    <>
      <PageHeader title="Career Directory" icon={<Compass className="size-5" />} subtitle="Cari dan saring profesi, program studi, dan beasiswa." />
      <Directory items={items} matches={matches} />
    </>
  );
}
