import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth";
import { loadStudent } from "@/lib/data";
import { ASSESSMENTS, isAssessmentKey } from "@/lib/assessments";
import { Runner } from "./Runner";

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isAssessmentKey(key)) notFound();
  const { profile } = await requirePage({ roles: ["student"], active: true });
  const d = await loadStudent(profile.id);
  const prog = d.progress.find((p) => p.assessment_key === key);
  return (
    <Runner
      userId={profile.id}
      akey={key}
      initialAnswers={prog?.answers ?? {}}
      serverUpdatedAt={prog?.updated_at ?? null}
      last={d.latest[key] ?? null}
      doneCount={d.profile.done.length}
      title={ASSESSMENTS[key].title}
    />
  );
}
