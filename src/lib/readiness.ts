// Skor kesiapan & tag prioritas (FR-008, FR-011).
// DRAF ATURAN — menunggu persetujuan psikolog mitra (OQ-6). Ubah bobot & ambang di satu tempat ini.

export type ReadinessInput = {
  assessmentsDone: number; // 0–4
  hasRoadmap: boolean;
  stepsDone: number;
  stepsTotal: number;
  clarity: number | null; // 1–5 terakhir
  daysSinceActive: number;
};

export const WEIGHTS = { assessments: 40, roadmap: 25, steps: 20, clarity: 15 };

export function readinessScore(i: ReadinessInput) {
  const a = (i.assessmentsDone / 4) * WEIGHTS.assessments;
  const r = i.hasRoadmap ? WEIGHTS.roadmap : 0;
  const s = i.stepsTotal ? (i.stepsDone / i.stepsTotal) * WEIGHTS.steps : 0;
  const c = i.clarity ? ((i.clarity - 1) / 4) * WEIGHTS.clarity : 0;
  return Math.round(a + r + s + c);
}

export type Tag = { key: string; label: string; tone: "red" | "amber" | "blue" | "green"; priority: number };

export const TAGS: Record<string, Tag> = {
  belum_mulai: { key: "belum_mulai", label: "Belum mulai asesmen", tone: "red", priority: 1 },
  arah_belum_jelas: { key: "arah_belum_jelas", label: "Arah belum jelas", tone: "red", priority: 1 },
  kesiapan_rendah: { key: "kesiapan_rendah", label: "Kesiapan rendah", tone: "amber", priority: 2 },
  belum_roadmap: { key: "belum_roadmap", label: "Belum punya roadmap", tone: "blue", priority: 3 },
  siap: { key: "siap", label: "Siap", tone: "green", priority: 4 },
};

export function readinessTags(i: ReadinessInput, score: number): Tag[] {
  const tags: Tag[] = [];
  if (i.assessmentsDone === 0 && i.daysSinceActive >= 7) tags.push(TAGS.belum_mulai);
  if (i.clarity !== null && i.clarity <= 2) tags.push(TAGS.arah_belum_jelas);
  if (score < 40 && i.assessmentsDone > 0) tags.push(TAGS.kesiapan_rendah);
  if (i.assessmentsDone >= 2 && !i.hasRoadmap) tags.push(TAGS.belum_roadmap);
  if (score >= 75) tags.push(TAGS.siap);
  return tags.sort((a, b) => a.priority - b.priority);
}
