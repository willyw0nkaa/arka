"use client";
import { useState } from "react";
import { NotebookPen, Save, LoaderCircle, Lock } from "lucide-react";
import { Alert, Button, Card } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";

export function Notes({ studentId, initial }: { studentId: string; initial: { id: string; content: string; created_at: string }[] }) {
  const [notes, setNotes] = useState(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function save() {
    setBusy(true); setErr(null);
    const res = await fetch("/api/counselor/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, content: text }) });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) return setErr(j.error);
    setNotes((n) => [j.note, ...n]);
    setText("");
  }
  return (
    <Card className="h-fit lg:sticky lg:top-4">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900"><NotebookPen className="size-5 text-brand-600" />Catatan konseling</h2>
      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Lock className="size-3" />Hanya terlihat oleh Anda.</p>
      <textarea className="input mt-3 min-h-28" placeholder="Ringkasan sesi, kesepakatan, tindak lanjut…" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} aria-label="Catatan" />
      {err && <div className="mt-2"><Alert tone="red">{err}</Alert></div>}
      <Button className="mt-3 w-full" onClick={save} disabled={busy || !text.trim()}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Simpan catatan</Button>
      <ul className="mt-5 space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-2xl bg-white/75 p-3 text-sm shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{fmtDateTime(n.created_at)}</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{n.content}</p>
          </li>
        ))}
        {notes.length === 0 && <li className="text-center text-sm text-slate-500">Belum ada catatan.</li>}
      </ul>
    </Card>
  );
}
