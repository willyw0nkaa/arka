"use client";
import { TriangleExclamationPoint } from "lucide-react";
import { Button } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4">
      <div className="glass-strong max-w-md p-8 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-600"><TriangleExclamationPoint className="size-7" /></div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Terjadi kesalahan</h1>
        <p className="mt-1 text-sm text-slate-600">{error.message?.includes("Variabel lingkungan") ? error.message : "Coba muat ulang halaman. Bila berulang, hubungi admin."}</p>
        <Button className="mt-6" onClick={reset}>Coba lagi</Button>
      </div>
    </div>
  );
}
