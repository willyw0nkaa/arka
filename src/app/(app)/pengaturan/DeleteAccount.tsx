"use client";
import { useState } from "react";
import { Trash, LoaderCircle, ShieldAlert } from "lucide-react";
import { Alert, Button, Card } from "@/components/ui";

export function DeleteAccount({ minor, parentContact, email }: { minor: boolean; parentContact: string | null; email: string }) {
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [demo, setDemo] = useState<string | null>(null);
  const target = minor && parentContact ? parentContact : email;

  async function request() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/account/delete-request", { method: "POST" });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(j.error);
    setStep("code");
    setDemo(j.demoCode ?? null);
    setInfo(j.sent ? `Kode konfirmasi dikirim ke ${j.to}.` : `Kode konfirmasi dibuat untuk ${j.to}.`);
  }
  async function confirmDelete() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/account/delete-confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(j.error);
    window.location.href = "/keluar?alasan=dihapus";
  }

  return (
    <Card className="border-rose-200/80">
      <h2 className="flex items-center gap-2 font-semibold text-rose-700"><ShieldAlert className="size-5" />Hapus akun dan seluruh data</h2>
      <p className="mt-1 text-sm text-slate-600">
        Akun langsung nonaktif, dan seluruh data (profil, hasil asesmen, roadmap, percakapan) terhapus dari server dalam 30 hari.
        Angka agregat tanpa nama yang sudah masuk laporan sekolah tidak berubah karena tidak dapat dilacak ke individu.
        {minor && " Karena usiamu di bawah 18 tahun, kode konfirmasi dikirim ke kontak orang tua/wali yang memberi persetujuan."}
      </p>
      <div className="mt-4 space-y-3">
        {err && <Alert tone="red">{err}</Alert>}
        {info && <Alert tone="brand">{info}</Alert>}
        {demo && <Alert tone="amber" title="Mode demo">Kode konfirmasi: <b className="font-mono text-lg tracking-widest">{demo}</b></Alert>}
        {step === "idle" ? (
          <Button variant="danger" onClick={request} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Trash className="size-4" />}Hapus akun dan data</Button>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div><label className="label" htmlFor="dc">Kode dari {target}</label><input id="dc" className="input w-48 font-mono tracking-[0.4em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></div>
            <Button variant="danger" onClick={confirmDelete} disabled={busy || code.length !== 6}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Trash className="size-4" />}Konfirmasi hapus</Button>
            <Button variant="ghost" onClick={() => setStep("idle")}>Batal</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
