"use client";
import { useState } from "react";
import { Check, X, LoaderCircle, CircleCheck } from "lucide-react";
import { Alert, Button } from "@/components/ui";

export function ConsentForm({ token, defaultName }: { token: string; defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "granted" | "rejected">(null);
  const [done, setDone] = useState<null | "granted" | "rejected">(null);

  async function decide(decision: "granted" | "rejected") {
    setErr(null);
    if (decision === "rejected" && !confirm("Menolak berarti akun anak tidak aktif dan datanya dihapus dalam 30 hari. Lanjutkan?")) return;
    setBusy(decision);
    try {
      const res = await fetch("/api/consent/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, code, decision, parent_name: name }) });
      const j = await res.json();
      if (!res.ok) return setErr(j.error);
      setDone(decision);
    } catch {
      setErr("Koneksi terputus. Coba lagi.");
    } finally {
      setBusy(null);
    }
  }

  if (done)
    return (
      <Alert tone={done === "granted" ? "green" : "slate"} icon={<CircleCheck className="size-5" />} title={done === "granted" ? "Terima kasih, persetujuan tercatat" : "Penolakan tercatat"}>
        {done === "granted" ? "Akun anak Anda sekarang aktif. Anda dapat menutup halaman ini." : "Akun anak tidak aktif dan datanya akan dihapus dalam 30 hari."}
      </Alert>
    );

  return (
    <div className="space-y-4 rounded-2xl border border-white/80 bg-white/70 p-4">
      {err && <Alert tone="red">{err}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pn">Nama orang tua/wali</label>
          <input id="pn" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="cd">Kode verifikasi (6 digit)</label>
          <input id="cd" className="input font-mono tracking-[0.4em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" variant="success" size="lg" disabled={!!busy} onClick={() => decide("granted")}>
          {busy === "granted" ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} Setuju
        </Button>
        <Button className="flex-1" variant="secondary" size="lg" disabled={!!busy} onClick={() => decide("rejected")}>
          {busy === "rejected" ? <LoaderCircle className="size-4 animate-spin" /> : <X className="size-4" />} Tolak
        </Button>
      </div>
    </div>
  );
}
