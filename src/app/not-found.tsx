import { Compass } from "lucide-react";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="glass-strong max-w-md p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Compass className="size-7" /></div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
        <p className="mt-1 text-slate-600">Jalan ini belum ada di peta ARKA.</p>
        <LinkButton href="/" className="mt-6">Kembali ke beranda</LinkButton>
      </div>
    </div>
  );
}
