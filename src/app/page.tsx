import Link from "next/link";
import {
  ClipboardList, Map, MessagesSquare, LayoutDashboard, FileChartColumn, ShieldCheck, ArrowRight, Sparkles, Lock, Users, LifeBuoy,
} from "lucide-react";
import { LinkButton, Logo } from "@/components/ui";

const features = [
  { icon: ClipboardList, title: "Empat asesmen terstruktur", text: "Minat (RIASEC), kepribadian, bakat, dan nilai karier — bisa dicicil, disimpan, dan dilanjutkan kapan saja." },
  { icon: Map, title: "Career Roadmap personal", text: "Rekomendasi jurusan, profesi, keterampilan, dan timeline langkah — lengkap dengan alasan yang merujuk hasil asesmenmu." },
  { icon: MessagesSquare, title: "AI Career Companion", text: "Teman diskusi karier yang mengingat percakapan sebelumnya dan menjawab dengan sumber dari database karier terkurasi." },
  { icon: LayoutDashboard, title: "Dashboard guru BK", text: "Status asesmen, skor kesiapan, dan tag prioritas seluruh siswa — supaya waktu konseling dipakai untuk yang paling membutuhkan." },
  { icon: FileChartColumn, title: "Laporan agregat sekolah", text: "Kepala sekolah melihat kesiapan karier per kelas tanpa nama siswa, siap diunduh sebagai PDF." },
  { icon: ShieldCheck, title: "Privasi data anak", text: "Persetujuan orang tua sebelum asesmen dibuka, akses dibatasi per sekolah, dan data bisa dihapus kapan saja." },
];

export default function Landing() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/bantuan" className="btn btn-ghost hidden sm:inline-flex"><LifeBuoy className="size-4" />Bantuan</Link>
          <LinkButton href="/masuk" variant="secondary">Masuk</LinkButton>
          <LinkButton href="/daftar">Daftar</LinkButton>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section className="grid items-center gap-10 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div>
            <span className="chip bg-white/80 py-1.5 pl-1.5 pr-3 text-brand-700 shadow-md shadow-brand-500/10">
              <span className="chip bg-brand-600 text-white"><Sparkles className="size-3" />Baru</span>
              Untuk siswa SMA/SMK & guru BK
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Kenali dirimu,{" "}
              <span className="bg-linear-to-r from-brand-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">rancang jalanmu.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              ARKA — <i>AI-powered Road for Knowledge & Advancement</i> — membantu siswa punya gambaran terukur tentang dirinya sebelum memilih jurusan,
              dan membantu guru BK memprioritaskan siswa yang paling membutuhkan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/daftar" size="lg">Mulai sekarang <ArrowRight className="size-4" /></LinkButton>
              <LinkButton href="/daftar?peran=guru" size="lg" variant="secondary"><Users className="size-4" />Saya guru BK</LinkButton>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><Lock className="size-4" />Gratis selama masa pilot. Hasil asesmen adalah indikasi, bukan diagnosis.</p>
          </div>

          <div className="relative">
            <div className="glass-strong relative p-6 sm:pb-28">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Profil potensi diri</p>
                  <p className="text-lg font-bold text-slate-900">Kode minat: I · R · A</p>
                </div>
                <span className="chip bg-emerald-100 text-emerald-800">Lengkap</span>
              </div>
              <div className="mt-5 space-y-3">
                {[["Investigatif", 84], ["Realistis", 71], ["Artistik", 63], ["Sosial", 48]].map(([l, v]) => (
                  <div key={l as string}>
                    <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{l}</span><span className="text-slate-500">{v}</span></div>
                    <div className="h-2.5 rounded-full bg-slate-200/70"><div className="h-full rounded-full bg-linear-to-r from-brand-400 to-cyan-500" style={{ width: `${v}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[["Sains Data", "88%"], ["T. Informatika", "85%"], ["Farmasi", "79%"]].map(([n, m]) => (
                  <div key={n} className="rounded-2xl bg-white/80 p-3 shadow-md shadow-brand-500/10">
                    <p className="text-xs text-slate-500">{n}</p><p className="text-lg font-bold text-brand-700">{m}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass absolute -bottom-6 -left-4 hidden max-w-xs p-4 sm:block">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><MessagesSquare className="size-4 text-brand-600" />Companion</p>
              <p className="mt-1 text-sm text-slate-600">“Minat Investigatif-mu (84) cocok dengan Sains Data. Mau lihat mata kuliahnya?”</p>
            </div>
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Satu alur untuk siswa, guru BK, dan sekolah</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">Satu guru BK bisa memegang hampir 500 siswa. ARKA membuat pendampingan karier lebih terukur tanpa menggantikan peran guru BK.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="glass p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-brand-500 to-cyan-500 text-white shadow-lg shadow-brand-500/30"><Icon className="size-6" /></div>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 flex flex-col items-start justify-between gap-6 rounded-3xl bg-linear-to-br from-brand-700 via-violet-700 to-slate-900 p-8 text-white shadow-2xl shadow-brand-900/30 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Sekolahmu ingin ikut pilot?</h2>
            <p className="mt-1 text-brand-100">Guru BK daftar, admin memverifikasi, lalu bagikan kode sekolah ke siswa.</p>
          </div>
          <LinkButton href="/daftar?peran=guru" size="lg" variant="secondary">Daftarkan sekolah <ArrowRight className="size-4" /></LinkButton>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-10 text-sm text-slate-500 sm:px-6">
        <p>© 2026 ARKA · Kelompok 5, Universitas Brawijaya</p>
        <div className="flex gap-4"><Link href="/privasi" className="hover:text-slate-800">Kebijakan Privasi</Link><Link href="/bantuan" className="hover:text-slate-800">Bantuan krisis</Link></div>
      </footer>
    </div>
  );
}
