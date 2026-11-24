import Link from "next/link";
import { ShieldCheck, TriangleExclamationPoint } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Alert } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/server";
import { fmtDate, PRIVACY_POLICY_VERSION } from "@/lib/utils";
import { ConsentForm } from "./ConsentForm";

export const metadata = { title: "Persetujuan Orang Tua", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createAdminClient();
  const { data: c } = await db.from("consents").select("id, student_id, status, expires_at, parent_name, policy_version").eq("token", token).maybeSingle();

  if (!c || c.status === "superseded") {
    return (
      <AuthShell title="Tautan tidak berlaku">
        <Alert tone="amber" icon={<TriangleExclamationPoint className="size-5" />}>Tautan ini sudah tidak berlaku atau telah diganti dengan tautan baru. Periksa email terbaru dari ARKA.</Alert>
      </AuthShell>
    );
  }
  if (c.status !== "pending") {
    return (
      <AuthShell title="Keputusan sudah tercatat">
        <Alert tone={c.status === "granted" ? "green" : "slate"}>
          Anda telah {c.status === "granted" ? "memberikan" : "menolak"} persetujuan. Untuk mengubah keputusan atau menghapus data, hubungi sekolah atau gunakan menu Pengaturan di akun anak.
        </Alert>
      </AuthShell>
    );
  }
  if (new Date(c.expires_at) < new Date()) {
    return (
      <AuthShell title="Tautan kedaluwarsa">
        <Alert tone="amber" icon={<TriangleExclamationPoint className="size-5" />}>Tautan berlaku 7 hari dan sudah kedaluwarsa. Minta anak Anda menekan “Kirim ulang tautan” di beranda ARKA.</Alert>
      </AuthShell>
    );
  }

  const { data: s } = await db.from("profiles").select("full_name, birth_date, class_level, class_name, school_id, email").eq("id", c.student_id).single();
  let school = "Sekolah belum terdaftar";
  if (s?.school_id) {
    const { data: sc } = await db.from("schools").select("name, city").eq("id", s.school_id).maybeSingle();
    if (sc) school = `${sc.name}, ${sc.city}`;
  }

  return (
    <AuthShell wide title="Persetujuan pemrosesan data anak" subtitle={<>Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (Pasal 25). Versi kebijakan: {c.policy_version ?? PRIVACY_POLICY_VERSION}</>}>
      <div className="space-y-4 text-sm text-slate-700">
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
          <p className="font-semibold text-slate-900">{s?.full_name}</p>
          <p className="text-slate-600">Kelas {s?.class_level}{s?.class_name ? ` (${s.class_name})` : ""} · {school}{s?.birth_date ? ` · lahir ${fmtDate(s.birth_date)}` : ""}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/80 bg-white/60 p-4">
            <p className="font-semibold text-slate-900">Data yang diproses</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Nama, tanggal lahir, kelas, sekolah, email</li>
              <li>Jawaban & hasil asesmen minat, kepribadian, bakat, nilai karier</li>
              <li>Riwayat percakapan dengan AI Companion</li>
              <li>Career Roadmap & progres</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/60 p-4">
            <p className="font-semibold text-slate-900">Siapa yang melihat</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Guru BK sekolahnya: profil, status asesmen, roadmap</li>
              <li><b>Bukan</b> isi percakapan Companion</li>
              <li>Kepala sekolah: hanya angka agregat tanpa nama</li>
              <li>Tidak dijual, tidak untuk iklan</li>
            </ul>
          </div>
        </div>
        <Alert tone="brand" icon={<ShieldCheck className="size-5" />}>
          Hasil asesmen adalah indikasi, bukan diagnosis. Pertanyaan ke AI dikirim ke penyedia AI untuk diproses. Anda dapat menarik persetujuan dan meminta penghapusan data kapan saja.{" "}
          <Link href="/privasi" target="_blank" className="font-semibold underline">Baca kebijakan lengkap</Link>
        </Alert>
        <ConsentForm token={token} defaultName={c.parent_name ?? ""} />
      </div>
    </AuthShell>
  );
}
