import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { studentForCounselor } from "@/lib/access";
import { loadStudent } from "@/lib/data";
import { aiConfigured, generateWithFallback } from "@/lib/ai";
import { ASSESSMENTS } from "@/lib/assessments";
import { audit } from "@/lib/events";
import { fmtDate } from "@/lib/utils";

export const maxDuration = 30;

/** FR-014: ringkasan pra-konseling. TIDAK memakai isi percakapan Companion (OQ-10). */
export async function POST(req: Request) {
  const a = await requireApi({ roles: ["counselor"] });
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  const acc = await studentForCounselor(a.profile, String(b.studentId ?? ""));
  if (!acc.ok) return bad(acc.status === 403 ? "Akses ditolak." : "Siswa tidak ditemukan.", acc.status);
  const s = acc.student;
  const d = await loadStudent(s.id);
  await audit(a.userId, "student_summary_generated", s.id);
  const dates = [...d.results.map((r) => r.completed_at), d.roadmap?.saved_at].filter(Boolean) as string[];
  const lastData = dates.sort().at(-1) ?? null;

  if (d.profile.done.length === 0) {
    return NextResponse.json({ text: `${s.full_name} belum menyelesaikan asesmen apa pun, sehingga data belum cukup untuk ringkasan.\n\nSaran: ajak siswa memulai dari Asesmen Minat (20–30 menit).`, lastData, insufficient: true, provider: "local" });
  }
  const p = d.profile;
  const f = (arr: { label: string; score: number }[], n = 3) => arr.slice(0, n).map((x) => `${x.label} (${x.score})`).join(", ") || "—";
  const steps = d.roadmap?.data.steps ?? [];
  const facts = [
    `Siswa: ${s.full_name}, kelas ${s.class_level}${s.class_name ? ` (${s.class_name})` : ""}.`,
    `Profil ${p.status}; asesmen selesai ${p.done.length}/4${p.missing.length ? `, belum: ${p.missing.map((k) => ASSESSMENTS[k].title).join(", ")}` : ""}.`,
    `Minat teratas: ${f(p.interests)}${p.riasecCode ? ` — kode ${p.riasecCode}` : ""}.`,
    `Bakat teratas: ${f(p.aptitudes)}.`,
    `Nilai karier teratas: ${f(p.values)}.`,
    `Gaya kerja: ${f(p.personality, 5)}.`,
    d.roadmap ? `Roadmap (disimpan ${fmtDate(d.roadmap.saved_at)}): jurusan ${d.roadmap.data.majors.slice(0, 3).map((m) => `${m.name} ${m.match}%`).join(", ")}; profesi ${d.roadmap.data.professions.slice(0, 3).map((m) => m.name).join(", ")}; langkah selesai ${steps.filter((x) => x.done).length}/${steps.length}.` : "Belum menyimpan roadmap.",
    d.surveys[0] ? `Survei kejelasan arah terakhir: ${d.surveys[0].score}/5.` : "Belum mengisi survei kejelasan arah.",
  ];

  if (aiConfigured()) {
    try {
      const r = await generateWithFallback(
        "Kamu membantu guru BK SMA/SMK di Indonesia menyiapkan sesi konseling karier. Tulis ringkasan satu halaman (maks. 220 kata) dalam bahasa Indonesia, dengan bagian: Gambaran singkat, Kekuatan yang terlihat, Hal yang perlu digali dalam sesi (3 pertanyaan pembuka), Saran tindak lanjut. Hasil asesmen adalah indikasi — jangan mendiagnosis, jangan memberi label kepribadian, jangan menjamin jurusan. Hanya gunakan fakta yang diberikan.",
        [{ role: "user", content: facts.join("\n") }]
      );
      return NextResponse.json({ text: r.content, lastData, insufficient: false, provider: r.provider });
    } catch { /* jatuh ke templat */ }
  }
  const text = [
    "GAMBARAN SINGKAT", ...facts.slice(0, 2),
    "", "KEKUATAN YANG TERLIHAT", facts[2], facts[3], facts[4],
    "", "HAL YANG PERLU DIGALI",
    `• Apa yang membuatmu tertarik pada ${p.interests[0]?.label.toLowerCase() ?? "bidang ini"}?`,
    `• Bagaimana pendapatmu tentang rekomendasi ${d.roadmap?.data.majors[0]?.name ?? "jurusan"} di roadmap?`,
    "• Apa yang masih membuatmu ragu, dan siapa yang ikut memengaruhi pilihanmu?",
    "", "SARAN TINDAK LANJUT",
    p.missing.length ? `• Lengkapi asesmen: ${p.missing.map((k) => ASSESSMENTS[k].title).join(", ")}.` : "• Asesmen sudah lengkap.",
    d.roadmap ? "• Pilih 1–2 langkah roadmap untuk dikerjakan sebelum sesi berikutnya." : "• Bantu siswa menyimpan Career Roadmap pertama.",
  ].join("\n");
  return NextResponse.json({ text, lastData, insufficient: false, provider: "local" });
}
