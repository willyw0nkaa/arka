"use client";
import { useEffect, useState } from "react";
import { Phone, MessageCircle, Siren, Users, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui";

/** Layar bantuan (FR-007): tampil sebelum jawaban apa pun, tidak dapat ditutup selama 3 detik pertama. */
export function CrisisModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [left, setLeft] = useState(3);
  useEffect(() => {
    if (!open) return;
    setLeft(3);
    const t = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="crisis-title">
      <div className="glass-strong w-full max-w-lg p-6 sm:p-8">
        <div className="grid size-14 place-items-center rounded-2xl bg-rose-100 text-rose-600"><HeartHandshake className="size-7" /></div>
        <h2 id="crisis-title" className="mt-4 text-2xl font-bold text-slate-900">Kamu tidak sendirian</h2>
        <p className="mt-2 text-slate-600">Sepertinya kamu sedang mengalami sesuatu yang berat. Orang terlatih siap mendengarkan — sekarang juga, gratis.</p>
        <div className="mt-5 space-y-2.5">
          <a href="tel:119" className="flex items-center gap-3 rounded-2xl bg-linear-to-br from-rose-500 to-rose-700 p-4 text-white shadow-lg shadow-rose-500/30">
            <Phone className="size-5 shrink-0" /><span><b>Healing119:</b> telepon 119, tekan ekstensi 8 (24 jam)</span>
          </a>
          <a href="https://healing119.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl bg-white/85 p-4 shadow-md">
            <MessageCircle className="size-5 shrink-0 text-brand-600" /><span className="text-slate-800"><b>healing119.id</b> — call atau chat WhatsApp</span>
          </a>
          <a href="tel:112" className="flex items-center gap-3 rounded-2xl bg-white/85 p-4 shadow-md">
            <Siren className="size-5 shrink-0 text-amber-600" /><span className="text-slate-800">Dalam bahaya sekarang? <b>119</b> atau <b>112</b></span>
          </a>
          <div className="flex items-center gap-3 rounded-2xl bg-white/60 p-4">
            <Users className="size-5 shrink-0 text-emerald-600" /><span className="text-slate-700">Temui guru BK atau orang dewasa yang kamu percaya hari ini.</span>
          </div>
        </div>
        <Button className="mt-6 w-full" variant="secondary" size="lg" disabled={left > 0} onClick={onClose}>
          {left > 0 ? `Bisa ditutup dalam ${left} detik` : "Tutup"}
        </Button>
      </div>
    </div>
  );
}
