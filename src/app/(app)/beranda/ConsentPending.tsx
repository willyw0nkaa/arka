"use client";
import { useState } from "react";
import { Mail, RotateCcw, LoaderCircle, Clock } from "lucide-react";
import { Alert, Button, Card } from "@/components/ui";
import { DemoConsent } from "@/app/daftar/RegisterForm";
import { fmtDate } from "@/lib/utils";

export function ConsentPending({ parentContact, parentName, sentAt, expired }: { parentContact: string; parentName: string; sentAt: string | null; expired: boolean }) {
  const [contact, setContact] = useState(parentContact);
  const [name, setName] = useState(parentName);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const [demo, setDemo] = useState<{ link: string; code: string } | null>(null);

  async function resend() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/consent/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parent_contact: contact, parent_name: name }) });
      const j = await res.json();
      if (!res.ok) return setMsg({ tone: "red", text: j.error });
      setDemo(j.demo);
      setMsg({ tone: "green", text: j.sent ? "Tautan baru terkirim ke email orang tua/wali." : "Tautan baru dibuat." });
    } catch {
      setMsg({ tone: "red", text: "Koneksi terputus." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card strong>
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Clock className="size-6" /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Menunggu persetujuan orang tua/wali</h2>
          <p className="mt-1 text-sm text-slate-600">
            {sentAt ? <>Tautan dikirim ke <b>{parentContact}</b> pada {fmtDate(sentAt)}. </> : null}
            {expired ? <span className="font-semibold text-amber-700">Tautan sudah kedaluwarsa — kirim ulang di bawah.</span> : "Tautan berlaku 7 hari."}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div><label className="label" htmlFor="pn">Nama orang tua/wali</label><input id="pn" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label" htmlFor="pc">Email orang tua/wali</label><input id="pc" type="email" className="input" value={contact} onChange={(e) => setContact(e.target.value)} /></div>
        <Button onClick={resend} disabled={busy}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}Kirim ulang tautan</Button>
      </div>
      <div className="mt-4 space-y-3">
        {msg && <Alert tone={msg.tone} icon={<Mail className="size-4" />}>{msg.text}</Alert>}
        {demo && <DemoConsent demo={demo} />}
      </div>
    </Card>
  );
}
