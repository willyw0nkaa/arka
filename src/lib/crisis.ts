// Deteksi sinyal krisis (FR-007). DRAF ATURAN — WAJIB ditinjau & disetujui psikolog mitra (D1)
// sebelum closed beta, dan diuji dengan 50 skenario (target ≥95% memicu layar bantuan).
// Prinsip: lebih baik salah-positif (siswa bisa menutup layar setelah 3 detik) daripada terlewat.

const PATTERNS: RegExp[] = [
  /bunuh\s*diri/, /akhiri\s*hidup/, /mengakhiri\s*hidup/, /ingin\s*mati/, /pengen\s*mati/, /pingin\s*mati/,
  /pengin\s*mati/, /mau\s*mati\s*aja/, /mending\s*mati/, /lebih\s*baik\s*(aku|saya|gue|gw)?\s*mati/,
  /(gak|ga|nggak|ngga|tidak|tak)\s*(mau|ingin|pengen|kuat)\s*hidup/, /capek\s*hidup/, /cape\s*hidup/, /lelah\s*hidup/,
  /hidup\s*(ini\s*)?(gak|ga|tidak|nggak)\s*(ada\s*)?(arti|guna)/, /menyakiti\s*diri/, /nyakitin\s*diri/,
  /melukai\s*diri/, /lukai\s*diri/, /self[\s-]?harm/, /gantung\s*diri/, /minum\s*racun/, /overdosis/,
  /sayat\s*(tangan|nadi)/, /silet\s*(tangan|nadi)/, /potong\s*nadi/, /lompat\s*dari/, /hilang\s*selamanya/,
  /kill\s*myself/, /suicid/, /want\s*to\s*die/, /end\s*my\s*life/,
  // kekerasan/ancaman yang dialami siswa
  /dilecehkan/, /pelecehan\s*seksual/, /diperkosa/, /dipukuli/, /disiksa/, /diancam\s*(dibunuh|dipukul)/,
];

export function detectCrisis(text: string): boolean {
  const t = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ");
  return PATTERNS.some((p) => p.test(t));
}

export const CRISIS_REPLY =
  "Terima kasih sudah mau bercerita. Yang kamu rasakan itu penting, dan kamu tidak harus menghadapinya sendirian. " +
  "Aku tidak bisa membantu untuk hal ini, tapi ada orang terlatih yang bisa. Hubungi Healing119 di 119 ekstensi 8 " +
  "(gratis, 24 jam) atau buka healing119.id untuk chat. Kalau kamu dalam bahaya sekarang, telepon 119 atau 112. " +
  "Kamu juga bisa menemui guru BK atau orang dewasa yang kamu percaya hari ini.";
