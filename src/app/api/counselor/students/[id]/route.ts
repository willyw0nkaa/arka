import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { studentForCounselor } from "@/lib/access";
import { loadStudent } from "@/lib/data";
import { audit } from "@/lib/events";

/** API detail siswa (FR-009): lintas sekolah → 403 + audit log. Hanya profil, status asesmen, roadmap. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const a = await requireApi({ roles: ["counselor"] });
  if (!a.ok) return a.res;
  const acc = await studentForCounselor(a.profile, id);
  if (!acc.ok) return bad(acc.status === 403 ? "Forbidden" : "Not found", acc.status);
  const s = acc.student;
  await audit(a.userId, "student_detail_viewed_api", s.id);
  const d = await loadStudent(s.id);
  return NextResponse.json({
    id: s.id, full_name: s.full_name, class_level: s.class_level, class_name: s.class_name,
    profile: d.profile,
    assessments: Object.fromEntries(Object.entries(d.latest).map(([k, v]) => [k, v?.completed_at])),
    roadmap: d.roadmap?.data ?? null,
  });
}
