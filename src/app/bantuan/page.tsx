import Link from "next/link";
import { Phone, MessageCircle, Siren, Users, ArrowLeft, HeartHandshake } from "lucide-react";
import { Logo } from "@/components/ui";

export const metadata = { title: "Bantuan Segera" };
export const dynamic = "force-static";

// Teks bantuan WAJIB ditinjau psikolog mitra sebelum rilis (R2, FR-007).
export default function Bantuan() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/"><Logo /></Link>
        <Link href="/beranda" className="btn btn-ghost"><ArrowLeft className="size-4" />Kembali</Link>
      </div>
      <div className="glass-strong p-6 sm:p-8">
        <div className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-600"><HeartHandshake className="size-7" /></div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Kamu tidak sendirian</h1>
        <p className="mt-2 text-slate-600">
          Kalau kamu sedang merasa sangat berat, ingin menyakiti diri, atau sedang tidak aman, segera hubungi salah satu layanan di bawah.
          Bicara dengan orang terlatih bisa membantu.
        </p>
        <div className="mt-6 space-y-3">
          <a href="tel:119" className="flex items-center gap-4 rounded-2xl bg-linear-to-br from-rose-500 to-rose-700 p-4 text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5">
            <Phone className="size-6 shrink-0" />
            <div><p className="font-bold">Healing119 — telepon 119, lalu tekan ekstensi 8</p><p className="text-sm text-rose-100">Layanan dukungan kesehatan jiwa Kementerian Kesehatan. Gratis, 24 jam.</p></div>
          </a>
          <a href="https://healing119.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-md transition hover:-translate-y-0.5">
            <MessageCircle className="size-6 shrink-0 text-brand-600" />
            <div><p className="font-bold text-slate-900">healing119.id</p><p className="text-sm text-slate-600">Pilih menu call atau chat WhatsApp dari situs resminya.</p></div>
          </a>
          <a href="tel:112" className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-md transition hover:-translate-y-0.5">
            <Siren className="size-6 shrink-0 text-amber-600" />
            <div><p className="font-bold text-slate-900">Darurat: 119 (gawat darurat medis) atau 112</p><p className="text-sm text-slate-600">Bila kamu atau orang lain dalam bahaya sekarang.</p></div>
          </a>
          <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/60 p-4">
            <Users className="size-6 shrink-0 text-emerald-600" />
            <div><p className="font-bold text-slate-900">Orang yang kamu percaya</p><p className="text-sm text-slate-600">Guru BK, wali kelas, orang tua, atau orang dewasa lain yang kamu percaya — sampaikan hari ini.</p></div>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-500">ARKA bukan layanan konseling krisis dan tidak mendiagnosis kondisi psikologis. Halaman ini tetap dapat dibuka tanpa koneksi internet setelah pernah dibuka sekali.</p>
      </div>
    </div>
  );
}
