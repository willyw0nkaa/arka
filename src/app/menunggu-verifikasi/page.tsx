import { Clock } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Alert } from "@/components/ui";

export const metadata = { title: "Menunggu Verifikasi" };

export default function Page() {
  return (
    <AuthShell title="Akun menunggu verifikasi">
      <Alert tone="amber" icon={<Clock className="size-5" />}>
        Demi keamanan data siswa, akun guru BK dan kepala sekolah harus diverifikasi admin ARKA sebelum dapat membuka dashboard. Kami akan memprosesnya secepatnya.
      </Alert>
      <a href="/keluar" className="btn btn-secondary mt-5 w-full">Keluar</a>
    </AuthShell>
  );
}
