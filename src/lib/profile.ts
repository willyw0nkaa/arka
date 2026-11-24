import { ASSESSMENTS, ASSESSMENT_KEYS, type AssessmentKey, topDims } from "@/lib/assessments";
import type { CareerItem, ResultRow, RoadmapData, RoadmapRec, RoadmapStep } from "@/lib/types";

export type Latest = Partial<Record<AssessmentKey, { scores: Record<string, number>; completed_at: string }>>;

/** Hasil terbaru per asesmen (FR-004: bila diulang, profil memakai hasil terbaru; riwayat tetap tersimpan). */
export function latestResults(rows: ResultRow[]): Latest {
  const out: Latest = {};
  const sorted = [...rows].sort((a, b) => +new Date(b.completed_at) - +new Date(a.completed_at));
  for (const r of sorted) {
    const k = r.assessment_key as AssessmentKey;
    if (!out[k]) out[k] = { scores: r.scores, completed_at: r.completed_at };
  }
  return out;
}

export type ProfileSummary = {
  status: "belum" | "sementara" | "lengkap";
  done: AssessmentKey[];
  missing: AssessmentKey[];
  riasecCode: string | null;
  interests: { dim: string; score: number; label: string }[];
  personality: { dim: string; score: number; label: string }[];
  aptitudes: { dim: string; score: number; label: string }[];
  values: { dim: string; score: number; label: string }[];
  headline: string;
};

export function buildProfile(latest: Latest): ProfileSummary {
  const done = ASSESSMENT_KEYS.filter((k) => latest[k]);
  const missing = ASSESSMENT_KEYS.filter((k) => !latest[k]);
  const status = done.length >= 4 ? "lengkap" : done.length >= 2 ? "sementara" : "belum";
  const interests = latest.minat ? topDims("minat", latest.minat.scores, 6) : [];
  const personality = latest.kepribadian ? topDims("kepribadian", latest.kepribadian.scores, 5) : [];
  const aptitudes = latest.bakat ? topDims("bakat", latest.bakat.scores, 8) : [];
  const values = latest.nilai ? topDims("nilai", latest.nilai.scores, 9) : [];
  const riasecCode = interests.length ? interests.slice(0, 3).map((d) => d.dim).join("") : null;

  const parts: string[] = [];
  if (interests.length) parts.push(`minat ${interests[0].label.toLowerCase()} dan ${interests[1].label.toLowerCase()}`);
  if (aptitudes.length) parts.push(`kekuatan ${aptitudes[0].label}`);
  if (values.length) parts.push(`menghargai ${values[0].label.toLowerCase()}`);
  const headline = parts.length ? `Kamu menunjukkan ${parts.join(", ")}.` : "Selesaikan asesmen untuk melihat gambaran dirimu.";

  return { status, done, missing, riasecCode, interests, personality, aptitudes, values, headline };
}

// ---------------- Pencocokan karier ----------------
const RIASEC_W = [1, 0.7, 0.45];

function matchItem(item: CareerItem, latest: Latest) {
  const parts: { w: number; v: number }[] = [];
  if (latest.minat && item.riasec) {
    const letters = item.riasec.split("");
    let s = 0, w = 0;
    letters.forEach((L, i) => {
      const wt = RIASEC_W[i] ?? 0.3;
      s += wt * ((latest.minat!.scores[L] ?? 0) / 100);
      w += wt;
    });
    parts.push({ w: 0.55, v: w ? s / w : 0 });
  }
  if (latest.bakat && item.aptitudes.length) {
    const v = item.aptitudes.reduce((a, k) => a + (latest.bakat!.scores[k] ?? 0), 0) / item.aptitudes.length / 100;
    parts.push({ w: 0.25, v });
  }
  if (latest.nilai && item.work_values.length) {
    const v = item.work_values.reduce((a, k) => a + (latest.nilai!.scores[k] ?? 0), 0) / item.work_values.length / 100;
    parts.push({ w: 0.2, v });
  }
  if (!parts.length) return 0;
  const tw = parts.reduce((a, p) => a + p.w, 0);
  return Math.round((parts.reduce((a, p) => a + p.w * p.v, 0) / tw) * 100);
}

function reasonFor(item: CareerItem, latest: Latest) {
  const bits: string[] = [];
  if (latest.minat && item.riasec) {
    const ls = item.riasec.split("").slice(0, 2);
    bits.push(
      "minat " +
        ls.map((L) => `${ASSESSMENTS.minat.dims.find((d) => d.key === L)?.label} (${latest.minat!.scores[L] ?? 0})`).join(" & ")
    );
  }
  if (latest.bakat && item.aptitudes.length) {
    const best = [...item.aptitudes].sort((a, b) => (latest.bakat!.scores[b] ?? 0) - (latest.bakat!.scores[a] ?? 0))[0];
    bits.push(`bakat ${ASSESSMENTS.bakat.dims.find((d) => d.key === best)?.label} (${latest.bakat.scores[best] ?? 0})`);
  }
  if (latest.nilai && item.work_values.length) {
    const best = [...item.work_values].sort((a, b) => (latest.nilai!.scores[b] ?? 0) - (latest.nilai!.scores[a] ?? 0))[0];
    bits.push(`nilai ${ASSESSMENTS.nilai.dims.find((d) => d.key === best)?.label} (${latest.nilai.scores[best] ?? 0})`);
  }
  return `Sesuai dengan ${bits.join(", ")} kamu. ${item.description}`;
}

export function rankCareers(items: CareerItem[], latest: Latest, kind: "major" | "profession") {
  return items
    .filter((i) => i.kind === kind)
    .map((i) => ({ item: i, match: matchItem(i, latest) }))
    .sort((a, b) => b.match - a.match);
}

const MIN_MATCH = 45;

function timeline(classLevel: number | null, majors: RoadmapRec[], professions: RoadmapRec[]): RoadmapStep[] {
  const m = majors.slice(0, 3).map((x) => x.name).join(", ") || "jurusan rekomendasi";
  const p = professions[0]?.name || "profesi pilihan";
  const all: (Omit<RoadmapStep, "id" | "done"> & { level: number })[] = [
    { level: 10, when: "Kelas 10", title: "Kenali pilihanmu", detail: `Baca profil ${m} di Career Directory dan catat yang paling menarik.` },
    { level: 10, when: "Kelas 10", title: "Pilih ekstrakurikuler pendukung", detail: `Ikuti kegiatan yang melatih keterampilan untuk ${p}.` },
    { level: 11, when: "Kelas 11 · Semester 1", title: "Eksplorasi mendalam", detail: `Tanyakan ke Companion tentang mata kuliah, prospek, dan tantangan ${m}.` },
    { level: 11, when: "Kelas 11 · Semester 1", title: "Jaga nilai rapor pendukung", detail: "Fokus pada mata pelajaran yang relevan dengan jurusan pilihan; rapor dipakai untuk seleksi jalur prestasi." },
    { level: 11, when: "Kelas 11 · Semester 2", title: "Bangun portofolio kecil", detail: `Ikuti lomba, proyek, atau kursus singkat yang terkait ${p}.` },
    { level: 11, when: "Kelas 11 · Semester 2", title: "Bicara dengan praktisi", detail: `Wawancarai satu orang yang bekerja sebagai ${p} atau mahasiswa ${majors[0]?.name ?? "jurusan pilihan"}.` },
    { level: 12, when: "Kelas 12 · Semester 1", title: "Diskusikan dengan guru BK & orang tua", detail: "Tetapkan 2–3 pilihan program studi dan perguruan tinggi beserta cadangannya." },
    { level: 12, when: "Kelas 12 · Semester 1", title: "Siapkan seleksi jalur prestasi (SNBP)", detail: "Cek kelayakan dan jadwal resmi; pastikan data rapor di sekolah benar." },
    { level: 12, when: "Kelas 12 · Semester 2", title: "Persiapan tes (SNBT) & jalur mandiri", detail: "Latihan soal rutin dan pantau jadwal resmi pendaftaran." },
    { level: 12, when: "Kelas 12 · Semester 2", title: "Daftar beasiswa", detail: "Cek KIP Kuliah dan beasiswa lain di Career Directory; siapkan dokumen lebih awal." },
  ];
  const start = classLevel ?? 11;
  return all.filter((s) => s.level >= start).map((s, i) => ({ id: `s${i + 1}`, when: s.when, title: s.title, detail: s.detail, done: false }));
}

export function generateRoadmap(items: CareerItem[], latest: Latest, classLevel: number | null): RoadmapData {
  const prof = buildProfile(latest);
  const toRec = (x: { item: CareerItem; match: number }): RoadmapRec => ({
    name: x.item.name,
    match: x.match,
    reason: reasonFor(x.item, latest),
    category: x.item.category,
  });
  const majors = rankCareers(items, latest, "major").filter((x) => x.match >= MIN_MATCH).slice(0, 5).map(toRec);
  const professions = rankCareers(items, latest, "profession").filter((x) => x.match >= MIN_MATCH).slice(0, 5).map(toRec);

  const skillCount = new Map<string, number>();
  for (const n of [...professions.slice(0, 3), ...majors.slice(0, 3)]) {
    const it = items.find((i) => i.name === n.name);
    it?.skills.forEach((s) => skillCount.set(s, (skillCount.get(s) ?? 0) + 1));
  }
  const skills = [...skillCount.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s).slice(0, 5);
  // Keterampilan pengembangan diri berdasarkan kepribadian (bukan label/diagnosis)
  if (latest.kepribadian) {
    const k = latest.kepribadian.scores;
    if ((k.K ?? 100) < 50) skills.push("Manajemen waktu");
    if ((k.X ?? 100) < 45) skills.push("Percaya diri berbicara di depan umum");
    if ((k.T ?? 100) < 45) skills.push("Mengelola stres saat ujian");
  }
  while (skills.length < 3) skills.push(["Komunikasi", "Berpikir kritis", "Literasi digital"][skills.length]);

  const short = majors.length < 3 || professions.length < 3;
  return {
    generated_at: new Date().toISOString(),
    basis: prof.done,
    profile_status: prof.status === "lengkap" ? "lengkap" : "sementara",
    majors,
    professions,
    skills: [...new Set(skills)].slice(0, 6),
    steps: timeline(classLevel, majors, professions),
    limitation: short
      ? "Database karier ARKA masih terbatas, sehingga kecocokan yang ditemukan kurang dari 3. Selesaikan asesmen lain atau jelajahi Career Directory."
      : undefined,
  };
}
