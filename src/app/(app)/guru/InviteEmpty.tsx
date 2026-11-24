"use client";
import { useState } from "react";
import { UserPlus, Copy, Check } from "lucide-react";
import { Button, Card } from "@/components/ui";

export function InviteEmpty({ link, code }: { link: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card strong className="mx-auto max-w-2xl text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-100 text-brand-700"><UserPlus className="size-7" /></div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900">Belum ada siswa terdaftar</h2>
      <p className="mt-1 text-sm text-slate-600">Undang siswa dengan langkah berikut:</p>
      <ol className="mx-auto mt-5 max-w-md space-y-3 text-left text-sm text-slate-700">
        <li><b>1.</b> Bagikan tautan pendaftaran ini ke grup kelas (atau sebutkan kode sekolah <b className="font-mono">{code}</b>).</li>
        <li><b>2.</b> Siswa mendaftar; bila di bawah 18 tahun, orang tua menerima tautan persetujuan.</li>
        <li><b>3.</b> Siswa muncul di dashboard ini setelah persetujuan tercatat.</li>
      </ol>
      <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row">
        <input readOnly value={link} className="input font-mono text-xs" aria-label="Tautan undangan" />
        <Button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); }}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Tersalin" : "Salin"}</Button>
      </div>
    </Card>
  );
}
