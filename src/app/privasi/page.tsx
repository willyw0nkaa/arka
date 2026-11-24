import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui";
import { PRIVACY_POLICY_VERSION } from "@/lib/utils";

export const metadata = { title: "Kebijakan Privasi" };
export const dynamic = "force-static";

// Draf kebijakan berbahasa sederhana. WAJIB ditinjau konsultan hukum UU PDP sebelum closed beta (D2, Bab 10)
// dan diuji keterbacaannya dengan 5 siswa usia 15–16 tahun.
const sections: [string, string[]][] = [
  ["Siapa kami", ["ARKA adalah platform asesmen dan perencanaan karier untuk siswa SMA/SMK, guru BK, dan sekolah, dikembangkan oleh tim mahasiswa Universitas Brawijaya."]],
  ["Data apa yang kami ambil", ["Nama, tanggal lahir, kelas, sekolah, dan email.", "Jawaban dan hasil empat asesmen (minat, kepribadian, bakat, nilai karier).", "Riwayat percakapanmu dengan AI Companion.", "Career Roadmap dan progresmu.", "Untuk siswa di bawah 18 tahun: nama dan email orang tua/wali yang memberi persetujuan."]],
  ["Kenapa kami butuh data itu", ["Supaya kamu dapat profil diri, rekomendasi jurusan, dan jawaban Companion yang sesuai denganmu.", "Supaya guru BK sekolahmu tahu siapa yang perlu didampingi lebih dulu."]],
  ["Persetujuan orang tua", ["Kalau umurmu di bawah 18 tahun, asesmen dan Companion baru terbuka setelah orang tua/wali menyetujui lewat tautan dan kode verifikasi (UU No. 27 Tahun 2022, Pasal 25)."]],
  ["Siapa yang bisa melihat datamu", ["Kamu sendiri: semuanya.", "Guru BK di sekolahmu: profil, status asesmen, skor kesiapan, dan roadmap. Guru BK TIDAK bisa membaca isi percakapanmu dengan Companion.", "Kepala sekolah: hanya angka gabungan per kelas tanpa nama. Kelompok di bawah 10 siswa disembunyikan.", "Guru dari sekolah lain tidak bisa melihat datamu sama sekali."]],
  ["AI dan pihak lain", ["Pertanyaanmu ke Companion dan ringkasan profilmu dikirim ke penyedia model AI (mis. OpenAI atau Google) untuk dibuatkan jawaban. Dasar hukum pengiriman ke luar negeri sedang ditinjau konsultan hukum.", "Kami tidak menjual datamu dan tidak memasang iklan. Data analitik hanya berisi kode acak, jenis kegiatan, dan waktu."]],
  ["Hasil asesmen", ["Hasil asesmen adalah indikasi, bukan diagnosis dan bukan jaminan diterima di suatu jurusan. ARKA tidak menggantikan guru BK atau psikolog."]],
  ["Hakmu", ["Melihat dan memperbarui datamu.", "Berhenti memakai ARKA kapan saja.", "Menghapus akun dan seluruh data dari menu Pengaturan. Akun langsung nonaktif dan data terhapus dari server dalam 30 hari."]],
  ["Keamanan", ["Data dienkripsi saat dikirim (HTTPS) dan saat disimpan. Akses dibatasi per peran dan per sekolah, dan setiap akses data sensitif dicatat."]],
];

export default function Privasi() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between"><Link href="/"><Logo /></Link><Link href="/" className="btn btn-ghost"><ArrowLeft className="size-4" />Kembali</Link></div>
      <article className="glass-strong p-6 sm:p-10">
        <h1 className="text-3xl font-bold text-slate-900">Kebijakan Privasi ARKA</h1>
        <p className="mt-1 text-sm text-slate-500">Versi {PRIVACY_POLICY_VERSION}</p>
        <div className="mt-8 space-y-7">
          {sections.map(([h, items]) => (
            <section key={h}>
              <h2 className="text-lg font-semibold text-slate-900">{h}</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate-700">{items.map((t) => <li key={t}>{t}</li>)}</ul>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
