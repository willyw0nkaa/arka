import "server-only";
import type { CareerItem, RoadmapData } from "@/lib/types";
import type { ProfileSummary } from "@/lib/profile";

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type Source = { name: string; kind: string; source: string };
export type AiResult = { content: string; provider: string; model: string };

const TIMEOUT_MS = 10_000; // FR-006 & Bab 10: pindah ke cadangan bila utama tidak merespons dalam 10 detik

const CAREER_WORDS = [
  "jurusan", "kuliah", "kampus", "karier", "karir", "kerja", "pekerjaan", "profesi", "cita", "masa depan", "minat", "bakat",
  "sekolah", "kelas", "snbp", "snbt", "utbk", "beasiswa", "universitas", "ptn", "pts", "politeknik", "prodi", "program studi",
  "skill", "keterampilan", "magang", "gaji", "penghasilan", "belajar", "nilai", "rapor", "ipa", "ips", "smk", "teknik",
  "kedokteran", "dokter", "desain", "bisnis", "usaha", "wirausaha", "guru", "roadmap", "asesmen", "hasil", "profil",
  "cocok", "pilih", "bingung", "lomba", "organisasi", "portofolio", "orang tua", "s1", "d3", "d4", "lulus", "mahasiswa",
];

export function looksCareerRelated(text: string, history: ChatTurn[]) {
  const t = text.toLowerCase();
  if (CAREER_WORDS.some((w) => t.includes(w))) return true;
  // pertanyaan lanjutan singkat ("kenapa?", "terus?") dianggap bagian dari topik sebelumnya
  return t.split(/\s+/).length <= 4 && history.length > 0;
}

export const OFF_TOPIC_REPLY =
  "Maaf, aku hanya bisa membantu soal jurusan, kuliah, karier, dan rencana belajar. " +
  "Mau coba tanya misalnya: \"Jurusan apa yang cocok dengan hasil asesmenku?\" atau \"Apa bedanya Sistem Informasi dan Teknik Informatika?\"";

/** Retrieval sederhana (RAG) atas database karier terkurasi: kecocokan kata kunci + relevansi profil. */
export function retrieve(items: CareerItem[], query: string, prof: ProfileSummary, k = 4): CareerItem[] {
  const q = query.toLowerCase();
  const words = q.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
  const scored = items.map((it) => {
    const hay = `${it.name} ${it.category} ${it.description} ${it.skills.join(" ")} ${it.related.join(" ")}`.toLowerCase();
    let s = 0;
    if (q.includes(it.name.toLowerCase())) s += 10;
    for (const w of words) if (hay.includes(w)) s += 1;
    if (prof.riasecCode && it.riasec && prof.riasecCode.includes(it.riasec[0])) s += 0.5;
    return { it, s };
  });
  return scored.filter((x) => x.s >= 1.5).sort((a, b) => b.s - a.s).slice(0, k).map((x) => x.it);
}

export function systemPrompt(name: string, classInfo: string, prof: ProfileSummary, roadmap: RoadmapData | null, ctx: CareerItem[]) {
  const fmt = (arr: { label: string; score: number }[]) => arr.slice(0, 4).map((d) => `${d.label} ${d.score}`).join(", ") || "-";
  return `Kamu adalah ARKA Career Companion, asisten karier untuk siswa SMA/SMK di Indonesia (usia 15–18 tahun).
ATURAN WAJIB:
1. Hanya bahas jurusan kuliah, program studi, karier, beasiswa, persiapan seleksi masuk perguruan tinggi, dan rencana belajar. Jika di luar topik itu, tolak dengan sopan dan tawarkan topik karier.
2. Jangan pernah mendiagnosis kondisi psikologis, memberi label kepribadian, atau menjamin siswa diterima di suatu jurusan/kampus. Sebut hasil asesmen sebagai "indikasi".
3. Selalu rujuk minimal satu data profil siswa di bawah. Jika menyebut program studi atau profesi, gunakan informasi dari KONTEKS DATABASE dan sebutkan "(sumber: Database karier ARKA)". Jangan mengarang data statistik, gaji, atau syarat resmi; sarankan cek situs resmi.
4. Jangan menggiring berdasarkan jenis kelamin atau latar ekonomi.
5. Jika siswa menyinggung keinginan menyakiti diri, kekerasan, atau krisis, jangan beri saran karier; arahkan ke Healing119 (119 ekstensi 8, healing119.id), 119/112 bila darurat, dan guru BK.
6. Bahasa Indonesia yang hangat, ringkas (maks. ~180 kata), gunakan "kamu". Akhiri dengan satu pertanyaan atau langkah kecil berikutnya.

PROFIL SISWA (${prof.status}): ${name}, ${classInfo}
- Kode minat (RIASEC): ${prof.riasecCode ?? "belum ada"}; minat teratas: ${fmt(prof.interests)}
- Kepribadian: ${fmt(prof.personality)}
- Bakat teratas: ${fmt(prof.aptitudes)}
- Nilai karier teratas: ${fmt(prof.values)}
- Asesmen belum diambil: ${prof.missing.join(", ") || "tidak ada"}
${roadmap ? `- Roadmap tersimpan: jurusan ${roadmap.majors.slice(0, 3).map((m) => m.name).join(", ")}; profesi ${roadmap.professions.slice(0, 3).map((m) => m.name).join(", ")}` : "- Belum menyimpan roadmap"}

KONTEKS DATABASE KARIER ARKA:
${ctx.length ? ctx.map((c) => `• [${c.kind}] ${c.name} (${c.category}): ${c.description} Keterampilan: ${c.skills.join(", ")}. Terkait: ${c.related.join(", ")}`).join("\n") : "(tidak ada item yang relevan)"}`;
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fn(ctl.signal);
  } finally {
    clearTimeout(t);
  }
}

async function callOpenAI(system: string, turns: ChatTurn[]): Promise<AiResult> {
  const key = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  return withTimeout(async (signal) => {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.5, max_tokens: 500, messages: [{ role: "system", content: system }, ...turns] }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const j = await res.json();
    const content = j.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("OpenAI kosong");
    return { content, provider: "openai", model: j.model || model };
  });
}

async function callGemini(system: string, turns: ChatTurn[]): Promise<AiResult> {
  const key = process.env.GEMINI_API_KEY!;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return withTimeout(async (signal) => {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
        generationConfig: { temperature: 0.5, maxOutputTokens: 600 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const j = await res.json();
    const content = j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!content) throw new Error("Gemini kosong");
    return { content, provider: "gemini", model };
  });
}

export const aiConfigured = () => Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);

/** Utama → cadangan. Melempar error bila semua penyedia gagal (klien menampilkan "Coba lagi nanti"). */
export async function generateWithFallback(system: string, turns: ChatTurn[]): Promise<AiResult> {
  const providers: (() => Promise<AiResult>)[] = [];
  if (process.env.OPENAI_API_KEY) providers.push(() => callOpenAI(system, turns));
  if (process.env.GEMINI_API_KEY) providers.push(() => callGemini(system, turns));
  let lastErr: unknown;
  for (const p of providers) {
    try {
      return await p();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Tidak ada penyedia AI");
}

/** Mesin lokal berbasis aturan + database (dipakai bila belum ada kunci API, mis. untuk demo). */
export function localAnswer(question: string, prof: ProfileSummary, roadmap: RoadmapData | null, ctx: CareerItem[]): string {
  const q = question.toLowerCase();
  const top = prof.interests.slice(0, 2).map((d) => `${d.label} (${d.score})`).join(" dan ");
  const apt = prof.aptitudes[0] ? `${prof.aptitudes[0].label} (${prof.aptitudes[0].score})` : null;
  const lines: string[] = [];

  if (ctx.length) {
    const main = ctx[0];
    lines.push(`Soal **${main.name}**: ${main.description} (sumber: Database karier ARKA)`);
    lines.push(`Keterampilan yang biasanya dibutuhkan: ${main.skills.join(", ")}.`);
    if (main.related.length) lines.push(`Terkait dengan: ${main.related.join(", ")}.`);
    if (top) lines.push(`Dibandingkan profilmu, minat teratasmu ${top}${apt ? ` dan bakat ${apt}` : ""}. Ini indikasi, bukan kepastian — coba cocokkan dengan pengalamanmu sendiri.`);
    if (ctx[1]) lines.push(`Kamu mungkin juga ingin melihat ${ctx.slice(1, 3).map((c) => c.name).join(" atau ")}.`);
  } else if (/cocok|rekomendasi|pilih|bingung|jurusan apa|kuliah apa/.test(q)) {
    if (roadmap?.majors.length) {
      lines.push(`Berdasarkan hasil asesmenmu (minat ${top || "-"}), jurusan dengan kecocokan tertinggi di roadmapmu: ${roadmap.majors.slice(0, 3).map((m) => `${m.name} (${m.match}%)`).join(", ")}. (sumber: Database karier ARKA)`);
      lines.push("Ingat, ini indikasi. Coba baca profil tiap jurusan di Career Directory, lalu bandingkan mata kuliah yang paling membuatmu penasaran.");
    } else {
      lines.push(`Dari asesmenmu, minat teratasmu ${top || "belum terbaca"}. Simpan Career Roadmap dulu agar aku bisa merujuk rekomendasi jurusan yang lebih spesifik.`);
    }
  } else if (/beasiswa|biaya|mahal/.test(q)) {
    lines.push("Beberapa jalur beasiswa yang umum: KIP Kuliah (bagi keluarga kurang mampu), Beasiswa Unggulan, beasiswa pemerintah daerah, dan beasiswa prestasi kampus. Lihat daftar lengkap di Career Directory → Beasiswa, lalu cek syarat terbaru di situs resminya. (sumber: Database karier ARKA)");
  } else if (/snbp|snbt|utbk|seleksi|daftar kuliah/.test(q)) {
    lines.push("Secara umum ada jalur prestasi (SNBP, berbasis rapor), jalur tes (SNBT), dan jalur mandiri tiap kampus. Jadwal dan syarat berubah tiap tahun, jadi pastikan cek pengumuman resmi panitia seleksi dan diskusikan dengan guru BK-mu.");
  } else {
    lines.push(`Aku belum menemukan informasi spesifik untuk pertanyaan itu di database karier ARKA. Dari profilmu, minat teratasmu ${top || "belum terbaca"}${apt ? ` dan bakat ${apt}` : ""}.`);
    lines.push("Coba sebutkan nama jurusan atau profesi yang ingin kamu ketahui, misalnya \"Ceritakan tentang Sains Data\".");
  }
  lines.push(roadmap ? "Langkah kecil berikutnya: buka roadmap dan tandai satu langkah yang bisa kamu kerjakan minggu ini. Mau aku bantu memilih?" : "Mau aku bantu menyusun langkah berikutnya?");
  return lines.join("\n\n");
}
