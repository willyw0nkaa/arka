import { Map } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { loadCareers, loadStudent } from "@/lib/data";
import { generateRoadmap } from "@/lib/profile";
import { ASSESSMENTS } from "@/lib/assessments";
import { Empty, LinkButton, PageHeader } from "@/components/ui";
import { RoadmapView } from "./RoadmapView";

export const metadata = { title: "Career Roadmap" };

export default async function Page() {
  const { profile } = await requirePage({ roles: ["student"], active: true });
  const d = await loadStudent(profile.id);
  if (d.profile.status === "belum") {
    return (
      <>
        <PageHeader title="Career Roadmap" icon={<Map className="size-5" />} />
        <Empty icon={<Map className="size-6" />} title="Roadmap belum tersedia" action={<LinkButton href="/asesmen">Selesaikan asesmen</LinkButton>}>
          Roadmap dibuat dari profilmu. Selesaikan minimal 2 asesmen dulu — yang belum: {d.profile.missing.map((k) => ASSESSMENTS[k].title).join(", ")}.
        </Empty>
      </>
    );
  }
  const careers = await loadCareers();
  const fresh = generateRoadmap(careers, d.latest, profile.class_level);
  const saved = d.roadmap;
  const outdated = !!saved && saved.data.basis.join() !== fresh.basis.join();
  const newerResults = !!saved && d.results.some((r) => +new Date(r.completed_at) > +new Date(saved.saved_at));
  return <RoadmapView saved={saved?.data ?? null} savedAt={saved?.saved_at ?? null} fresh={fresh} outdated={outdated || newerResults} />;
}
