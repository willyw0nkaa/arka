// Bank item asesmen ARKA — DRAF ORISINAL, wajib ditinjau psikolog mitra bersurat SIPP (D1, OQ-4, OQ-5).
// Sengaja TIDAK memakai item/instrumen MBTI (merek dagang berlisensi, R6).
// Skala jawaban: Likert 1–5 (Sangat tidak sesuai → Sangat sesuai).

export type AssessmentKey = "minat" | "kepribadian" | "bakat" | "nilai";
export const ASSESSMENT_KEYS: AssessmentKey[] = ["minat", "kepribadian", "bakat", "nilai"];

export type Item = { id: string; text: string; dim: string; reverse?: boolean };
export type Dimension = { key: string; label: string; desc: string };
export type Assessment = {
  key: AssessmentKey;
  title: string;
  subtitle: string;
  minutes: string;
  dims: Dimension[];
  items: Item[];
};

export const LIKERT = [
  { v: 1, label: "Sangat tidak sesuai" },
  { v: 2, label: "Tidak sesuai" },
  { v: 3, label: "Netral" },
  { v: 4, label: "Sesuai" },
  { v: 5, label: "Sangat sesuai" },
];

function build(prefix: string, groups: Record<string, (string | [string, true])[]>): Item[] {
  // Item disusun berselang-seling antar dimensi agar tidak monoton.
  const keys = Object.keys(groups);
  const max = Math.max(...keys.map((k) => groups[k].length));
  const out: Item[] = [];
  for (let i = 0; i < max; i++) {
    for (const k of keys) {
      const raw = groups[k][i];
      if (!raw) continue;
      const [text, reverse] = typeof raw === "string" ? [raw, false] : raw;
      out.push({ id: `${prefix}${out.length + 1}`, text, dim: k, reverse: reverse || undefined });
    }
  }
  return out;
}

// ---------------- 1. MINAT (RIASEC) — 60 item ----------------
const minatDims: Dimension[] = [
  { key: "R", label: "Realistis", desc: "Suka bekerja dengan tangan, alat, mesin, atau di lapangan." },
  { key: "I", label: "Investigatif", desc: "Suka meneliti, menganalisis, dan memecahkan masalah ilmiah." },
  { key: "A", label: "Artistik", desc: "Suka berkarya, berekspresi, dan mencipta hal baru." },
  { key: "S", label: "Sosial", desc: "Suka membantu, mengajar, dan bekerja dengan orang." },
  { key: "E", label: "Enterprising", desc: "Suka memimpin, membujuk, dan mengelola usaha." },
  { key: "C", label: "Konvensional", desc: "Suka keteraturan, data, dan prosedur yang jelas." },
];
const minatItems = build("mi", {
  R: [
    "Saya senang memperbaiki barang yang rusak, seperti sepeda atau alat elektronik.",
    "Saya tertarik merakit sesuatu dari komponen-komponennya.",
    "Saya lebih suka kegiatan praktik daripada membaca teori panjang.",
    "Saya senang berkegiatan di luar ruangan, seperti berkebun atau berkemah.",
    "Saya tertarik mengoperasikan mesin atau peralatan teknis.",
    "Saya suka pelajaran praktikum bengkel atau laboratorium terapan.",
    "Saya senang membuat atau membangun sesuatu yang bisa langsung dipakai.",
    "Saya tertarik pada cara kerja kendaraan atau mesin.",
    "Saya suka pekerjaan yang membutuhkan ketahanan fisik.",
    "Saya senang memasang, menyusun, atau menata peralatan.",
  ],
  I: [
    "Saya senang mencari tahu mengapa sesuatu bisa terjadi.",
    "Saya menikmati mengerjakan soal matematika atau sains yang menantang.",
    "Saya tertarik membaca artikel tentang penemuan ilmiah.",
    "Saya suka melakukan eksperimen untuk menguji dugaan saya.",
    "Saya senang menganalisis data atau grafik.",
    "Saya tertarik mempelajari tubuh manusia, hewan, atau tumbuhan.",
    "Saya suka memecahkan teka-teki logika.",
    "Saya penasaran dengan cara kerja teknologi seperti komputer atau AI.",
    "Saya betah berlama-lama memikirkan satu masalah sampai tuntas.",
    "Saya suka membandingkan beberapa sumber sebelum mengambil kesimpulan.",
  ],
  A: [
    "Saya senang menggambar, melukis, atau mendesain.",
    "Saya suka menulis cerita, puisi, atau konten kreatif.",
    "Saya tertarik bermain musik, bernyanyi, atau menari.",
    "Saya senang membuat video, foto, atau konten visual.",
    "Saya suka mengekspresikan ide dengan cara yang tidak biasa.",
    "Saya tertarik pada dunia film, teater, atau pertunjukan.",
    "Saya senang mendekorasi atau menata ruangan agar terlihat indah.",
    "Saya lebih suka tugas yang memberi kebebasan berkreasi.",
    "Saya sering punya ide-ide baru yang orisinal.",
    "Saya menikmati mengunjungi pameran seni atau melihat karya desain.",
  ],
  S: [
    "Saya senang membantu teman yang kesulitan memahami pelajaran.",
    "Saya suka mendengarkan cerita dan masalah orang lain.",
    "Saya tertarik mengikuti kegiatan sosial atau relawan.",
    "Saya senang mengajar atau menjelaskan sesuatu kepada orang lain.",
    "Saya peduli pada kesehatan dan kesejahteraan orang di sekitar saya.",
    "Saya suka bekerja dalam kelompok.",
    "Saya senang menjadi penengah ketika ada teman yang berselisih.",
    "Saya tertarik pada pekerjaan yang melayani masyarakat.",
    "Saya mudah merasakan apa yang dirasakan orang lain.",
    "Saya senang merawat atau mendampingi orang lain.",
  ],
  E: [
    "Saya senang memimpin kelompok atau organisasi.",
    "Saya suka meyakinkan orang lain agar setuju dengan ide saya.",
    "Saya tertarik memulai usaha atau berjualan sendiri.",
    "Saya senang berbicara di depan banyak orang.",
    "Saya suka mengambil keputusan dan bertanggung jawab atas hasilnya.",
    "Saya tertarik pada dunia bisnis, pemasaran, atau negosiasi.",
    "Saya senang mengatur acara atau kepanitiaan.",
    "Saya suka bersaing untuk mencapai target.",
    "Saya berani mengambil risiko untuk peluang yang menarik.",
    "Saya senang membangun jaringan pertemanan yang luas.",
  ],
  C: [
    "Saya senang membuat catatan dan jadwal yang rapi.",
    "Saya suka bekerja dengan angka, tabel, atau laporan.",
    "Saya teliti saat memeriksa kesalahan dalam tulisan atau hitungan.",
    "Saya nyaman mengikuti aturan dan prosedur yang jelas.",
    "Saya senang mengelompokkan dan mengarsipkan dokumen.",
    "Saya tertarik pada pekerjaan administrasi atau keuangan.",
    "Saya suka menyelesaikan tugas langkah demi langkah sesuai urutan.",
    "Saya senang mengelola uang kas atau anggaran kegiatan.",
    "Saya lebih nyaman dengan tugas yang instruksinya jelas.",
    "Saya suka memastikan semua data lengkap dan akurat.",
  ],
});

// ---------------- 2. KEPRIBADIAN (5 dimensi umum) — 40 item ----------------
const kepDims: Dimension[] = [
  { key: "O", label: "Keterbukaan", desc: "Rasa ingin tahu, imajinasi, dan keterbukaan pada pengalaman baru." },
  { key: "K", label: "Ketekunan", desc: "Keteraturan, disiplin, dan tanggung jawab dalam menyelesaikan tugas." },
  { key: "X", label: "Ekstraversi", desc: "Energi dari interaksi sosial dan keaktifan dalam kelompok." },
  { key: "M", label: "Keramahan", desc: "Kepedulian, kerja sama, dan kepercayaan pada orang lain." },
  { key: "T", label: "Ketenangan", desc: "Kemampuan tetap tenang dan stabil menghadapi tekanan." },
];
const kepItems = build("ke", {
  O: [
    "Saya senang mencoba hal-hal baru yang belum pernah saya lakukan.",
    "Saya suka membayangkan berbagai kemungkinan di masa depan.",
    ["Saya lebih nyaman dengan cara lama daripada mencoba cara baru.", true],
    "Saya tertarik pada ide dan budaya yang berbeda dari saya.",
    "Saya menikmati diskusi tentang topik yang mendalam.",
    ["Saya jarang penasaran dengan hal di luar pelajaran sekolah.", true],
    "Saya senang belajar keterampilan baru di waktu luang.",
    "Saya sering mempertanyakan hal yang dianggap biasa oleh orang lain.",
  ],
  K: [
    "Saya menyelesaikan tugas sebelum tenggat waktunya.",
    "Saya membuat rencana sebelum mengerjakan sesuatu.",
    ["Saya sering menunda pekerjaan sampai mendekati batas waktu.", true],
    "Saya menjaga barang-barang saya tetap rapi.",
    "Saya berusaha menepati janji yang sudah saya buat.",
    ["Saya mudah kehilangan fokus saat mengerjakan tugas panjang.", true],
    "Saya memeriksa ulang pekerjaan saya sebelum dikumpulkan.",
    "Saya tetap berusaha meski tugasnya membosankan.",
  ],
  X: [
    "Saya merasa bersemangat setelah berkumpul dengan banyak orang.",
    "Saya mudah memulai percakapan dengan orang baru.",
    ["Saya lebih suka menghabiskan waktu sendirian.", true],
    "Saya senang menjadi pusat perhatian dalam kelompok.",
    "Saya aktif berbicara saat diskusi kelas.",
    ["Saya merasa lelah jika terlalu lama berada di keramaian.", true],
    "Saya senang mengikuti banyak kegiatan atau organisasi.",
    "Saya suka mengajak teman melakukan kegiatan bersama.",
  ],
  M: [
    "Saya mudah memaafkan kesalahan orang lain.",
    "Saya berusaha membantu meskipun tidak diminta.",
    ["Saya cenderung curiga pada niat orang lain.", true],
    "Saya menghargai pendapat yang berbeda dari pendapat saya.",
    "Saya lebih suka bekerja sama daripada bersaing.",
    ["Saya kadang tidak peduli dengan perasaan orang lain.", true],
    "Saya senang melihat orang lain berhasil.",
    "Saya berusaha bersikap sopan kepada siapa pun.",
  ],
  T: [
    "Saya tetap tenang saat menghadapi ujian penting.",
    "Saya cepat bangkit setelah mengalami kegagalan.",
    ["Saya mudah merasa cemas tentang hal-hal kecil.", true],
    "Saya bisa mengendalikan emosi saat sedang kesal.",
    "Saya jarang merasa gugup ketika mencoba hal baru.",
    ["Suasana hati saya mudah berubah-ubah.", true],
    "Saya bisa berpikir jernih meski sedang dikejar waktu.",
    "Saya menghadapi kritik tanpa merasa terlalu terbebani.",
  ],
});

// ---------------- 3. BAKAT (kecenderungan kemampuan, self-report) — 48 item ----------------
const bakatDims: Dimension[] = [
  { key: "verbal", label: "Verbal-Linguistik", desc: "Kemampuan memakai kata, membaca, menulis, dan berbicara." },
  { key: "logika", label: "Logis-Matematis", desc: "Kemampuan bernalar, berhitung, dan berpikir sistematis." },
  { key: "spasial", label: "Visual-Spasial", desc: "Kemampuan membayangkan bentuk, ruang, dan desain." },
  { key: "kinestetik", label: "Kinestetik", desc: "Kemampuan mengendalikan gerak tubuh dan keterampilan tangan." },
  { key: "musikal", label: "Musikal", desc: "Kepekaan terhadap nada, irama, dan bunyi." },
  { key: "interpersonal", label: "Interpersonal", desc: "Kemampuan memahami dan bekerja dengan orang lain." },
  { key: "intrapersonal", label: "Intrapersonal", desc: "Kemampuan memahami diri, emosi, dan tujuan pribadi." },
  { key: "naturalis", label: "Naturalis", desc: "Kepekaan terhadap alam, makhluk hidup, dan lingkungan." },
];
const bakatItems = build("ba", {
  verbal: [
    "Saya mudah memahami isi bacaan yang panjang.",
    "Saya bisa menjelaskan ide dengan kata-kata yang jelas.",
    "Nilai Bahasa Indonesia atau Bahasa Inggris saya termasuk baik.",
    "Saya mudah mempelajari kosakata baru.",
    "Saya bisa menulis karangan yang runtut dengan cepat.",
    "Teman sering meminta saya memeriksa tulisan mereka.",
  ],
  logika: [
    "Saya cepat menemukan pola dalam deretan angka.",
    "Saya mudah memahami rumus matematika atau fisika.",
    "Saya bisa memecah masalah besar menjadi langkah-langkah kecil.",
    "Saya cepat menemukan kesalahan dalam sebuah argumen.",
    "Saya mudah mempelajari dasar pemrograman atau logika komputer.",
    "Saya bisa menghitung di kepala dengan cukup cepat.",
  ],
  spasial: [
    "Saya mudah membaca peta atau denah.",
    "Saya bisa membayangkan bentuk benda dari berbagai sisi.",
    "Saya peka terhadap warna, tata letak, dan komposisi.",
    "Saya mudah memahami diagram atau gambar teknik.",
    "Saya bisa menggambar sesuatu dengan proporsi yang tepat.",
    "Saya jarang tersesat di tempat baru.",
  ],
  kinestetik: [
    "Saya cepat menguasai gerakan olahraga baru.",
    "Tangan saya terampil untuk pekerjaan yang membutuhkan ketelitian.",
    "Saya lebih mudah belajar dengan mempraktikkan langsung.",
    "Saya punya koordinasi tubuh yang baik.",
    "Saya mudah menggunakan alat atau perkakas.",
    "Saya bisa meniru gerakan orang lain dengan tepat.",
  ],
  musikal: [
    "Saya mudah mengingat melodi lagu.",
    "Saya bisa membedakan nada yang sumbang.",
    "Saya cepat belajar memainkan alat musik.",
    "Saya peka terhadap irama dan tempo.",
    "Saya bisa membuat atau mengaransemen lagu sederhana.",
    "Saya mudah menghafal sesuatu jika dibuat berirama.",
  ],
  interpersonal: [
    "Saya bisa membaca suasana hati orang dari ekspresinya.",
    "Saya mudah bergaul dengan berbagai tipe orang.",
    "Saya bisa membuat orang lain mau bekerja sama.",
    "Teman sering datang kepada saya untuk meminta saran.",
    "Saya bisa menyelesaikan konflik dalam kelompok.",
    "Saya mampu menyesuaikan cara bicara dengan lawan bicara.",
  ],
  intrapersonal: [
    "Saya tahu apa kekuatan dan kelemahan saya.",
    "Saya bisa mengenali emosi yang sedang saya rasakan.",
    "Saya punya tujuan pribadi yang jelas.",
    "Saya bisa belajar sendiri tanpa harus diawasi.",
    "Saya sering merenungkan pengalaman untuk belajar darinya.",
    "Saya bisa mengatur waktu dan energi saya sendiri.",
  ],
  naturalis: [
    "Saya mudah mengenali jenis tumbuhan atau hewan.",
    "Saya peka terhadap perubahan cuaca atau lingkungan.",
    "Saya senang mengamati dan mengklasifikasi benda di alam.",
    "Saya cepat memahami materi biologi atau geografi.",
    "Saya tertarik pada isu lingkungan dan keberlanjutan.",
    "Saya bisa merawat tanaman atau hewan dengan baik.",
  ],
});

// ---------------- 4. NILAI KARIER — 36 item ----------------
const nilaiDims: Dimension[] = [
  { key: "kreativitas", label: "Kreativitas", desc: "Pekerjaan yang memberi ruang mencipta dan berinovasi." },
  { key: "stabilitas", label: "Stabilitas", desc: "Pekerjaan yang aman, teratur, dan berjangka panjang." },
  { key: "penghasilan", label: "Penghasilan", desc: "Pekerjaan dengan imbalan finansial yang baik." },
  { key: "membantu", label: "Membantu Sesama", desc: "Pekerjaan yang berdampak langsung bagi orang lain." },
  { key: "kemandirian", label: "Kemandirian", desc: "Pekerjaan yang memberi kebebasan mengatur diri." },
  { key: "prestasi", label: "Prestasi", desc: "Pekerjaan yang menantang dan memberi rasa pencapaian." },
  { key: "kepemimpinan", label: "Kepemimpinan", desc: "Pekerjaan yang memberi pengaruh dan tanggung jawab memimpin." },
  { key: "keseimbangan", label: "Keseimbangan Hidup", desc: "Pekerjaan yang menyisakan waktu untuk keluarga dan diri." },
  { key: "pengetahuan", label: "Belajar Terus", desc: "Pekerjaan yang membuat terus belajar hal baru." },
];
const nilaiItems = build("ni", {
  kreativitas: [
    "Penting bagi saya bisa menuangkan ide sendiri dalam pekerjaan.",
    "Saya ingin pekerjaan yang menghasilkan karya baru.",
    "Saya tidak ingin pekerjaan yang isinya itu-itu saja.",
    "Saya ingin bebas mencoba cara baru dalam bekerja.",
  ],
  stabilitas: [
    "Penting bagi saya punya pekerjaan tetap yang aman.",
    "Saya ingin pekerjaan dengan jenjang karier yang jelas.",
    "Saya lebih memilih gaji tetap daripada penghasilan tidak pasti.",
    "Saya ingin bekerja di tempat yang tidak mudah berubah.",
  ],
  penghasilan: [
    "Penghasilan besar adalah pertimbangan utama saya memilih karier.",
    "Saya ingin pekerjaan yang membuat saya mapan secara finansial.",
    "Saya bersedia bekerja keras demi imbalan yang tinggi.",
    "Saya ingin bisa membantu ekonomi keluarga lewat pekerjaan saya.",
  ],
  membantu: [
    "Saya ingin pekerjaan saya membuat hidup orang lain lebih baik.",
    "Saya merasa puas jika bisa menolong orang lain.",
    "Saya ingin berkontribusi bagi masyarakat atau lingkungan.",
    "Saya lebih memilih pekerjaan bermakna daripada sekadar bergaji besar.",
  ],
  kemandirian: [
    "Saya ingin mengatur jadwal kerja saya sendiri.",
    "Saya tidak suka diawasi terlalu ketat saat bekerja.",
    "Saya ingin suatu saat punya usaha atau praktik sendiri.",
    "Saya ingin bebas mengambil keputusan dalam pekerjaan.",
  ],
  prestasi: [
    "Saya ingin pekerjaan yang menantang kemampuan saya.",
    "Saya senang jika hasil kerja saya diakui.",
    "Saya ingin menjadi ahli di bidang yang saya tekuni.",
    "Saya terdorong untuk terus mencapai target yang lebih tinggi.",
  ],
  kepemimpinan: [
    "Saya ingin suatu saat memimpin tim atau organisasi.",
    "Saya ingin pekerjaan yang memberi pengaruh pada keputusan penting.",
    "Saya senang bertanggung jawab atas hasil kerja kelompok.",
    "Saya ingin dikenal sebagai orang yang menggerakkan perubahan.",
  ],
  keseimbangan: [
    "Saya ingin pekerjaan yang menyisakan waktu untuk keluarga.",
    "Saya tidak ingin pekerjaan yang menuntut lembur terus-menerus.",
    "Kesehatan fisik dan mental lebih penting bagi saya daripada jabatan.",
    "Saya ingin tetap punya waktu untuk hobi di luar pekerjaan.",
  ],
  pengetahuan: [
    "Saya ingin pekerjaan yang membuat saya terus belajar.",
    "Saya senang jika pekerjaan menuntut saya membaca dan meneliti.",
    "Saya ingin mengikuti perkembangan ilmu terbaru di bidang saya.",
    "Saya tertarik melanjutkan studi ke jenjang yang lebih tinggi.",
  ],
});

export const ASSESSMENTS: Record<AssessmentKey, Assessment> = {
  minat: {
    key: "minat",
    title: "Asesmen Minat",
    subtitle: "Memetakan enam tipe minat kerja (RIASEC).",
    minutes: "20–30 menit",
    dims: minatDims,
    items: minatItems,
  },
  kepribadian: {
    key: "kepribadian",
    title: "Asesmen Kepribadian",
    subtitle: "Lima dimensi gaya bekerja dan berinteraksi.",
    minutes: "15–20 menit",
    dims: kepDims,
    items: kepItems,
  },
  bakat: {
    key: "bakat",
    title: "Asesmen Bakat",
    subtitle: "Kecenderungan kemampuan di delapan ranah.",
    minutes: "20–30 menit",
    dims: bakatDims,
    items: bakatItems,
  },
  nilai: {
    key: "nilai",
    title: "Asesmen Nilai Karier",
    subtitle: "Hal yang paling kamu anggap penting dalam pekerjaan.",
    minutes: "15–20 menit",
    dims: nilaiDims,
    items: nilaiItems,
  },
};

export function isAssessmentKey(k: string): k is AssessmentKey {
  return (ASSESSMENT_KEYS as string[]).includes(k);
}

/** Skor dimensi 0–100 dari rata-rata Likert (item terbalik dibalik). */
export function scoreAssessment(key: AssessmentKey, answers: Record<string, number>) {
  const a = ASSESSMENTS[key];
  const sums: Record<string, { s: number; n: number }> = {};
  for (const d of a.dims) sums[d.key] = { s: 0, n: 0 };
  for (const item of a.items) {
    const raw = answers[item.id];
    if (typeof raw !== "number") continue;
    const v = item.reverse ? 6 - raw : raw;
    sums[item.dim].s += v;
    sums[item.dim].n += 1;
  }
  const scores: Record<string, number> = {};
  for (const d of a.dims) {
    const { s, n } = sums[d.key];
    scores[d.key] = n ? Math.round(((s / n - 1) / 4) * 100) : 0;
  }
  return scores;
}

export function dimLabel(key: AssessmentKey, dim: string) {
  return ASSESSMENTS[key].dims.find((d) => d.key === dim)?.label ?? dim;
}

export function topDims(key: AssessmentKey, scores: Record<string, number>, n = 3) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([dim, score]) => ({ dim, score, label: dimLabel(key, dim) }));
}

/** Bersihkan jawaban: hanya id item valid dengan nilai 1–5. */
export function cleanAnswers(key: AssessmentKey, raw: unknown) {
  const valid = new Set(ASSESSMENTS[key].items.map((i) => i.id));
  const out: Record<string, number> = {};
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const n = Number(v);
      if (valid.has(k) && Number.isInteger(n) && n >= 1 && n <= 5) out[k] = n;
    }
  }
  return out;
}

