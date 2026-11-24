"use client";
import { useEffect, useRef, useState } from "react";
import { Send, ThumbsUp, ThumbsDown, LoaderCircle, Bot, Sparkles, BookOpen, Info, LifeBuoy } from "lucide-react";
import { Alert, Badge, Button, PageHeader } from "@/components/ui";
import { CrisisModal } from "@/components/CrisisModal";
import { cn } from "@/lib/utils";

export type Msg = { id: string; role: "user" | "assistant"; content: string; sources?: { name: string; kind: string; source: string }[]; feedback?: string | null; created_at?: string; crisis?: boolean };

const SUGGEST = [
  "Jurusan apa yang cocok dengan hasil asesmenku?",
  "Apa bedanya Teknik Informatika dan Sistem Informasi?",
  "Keterampilan apa yang perlu kulatih dari sekarang?",
  "Beasiswa apa yang bisa kucoba?",
];

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className={i ? "mt-2" : ""}>
          {para.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
            seg.startsWith("**") ? <b key={j}>{seg.slice(2, -2)}</b> : seg.split("\n").map((l, k, arr) => <span key={k}>{l}{k < arr.length - 1 && <br />}</span>)
          )}
        </p>
      ))}
    </>
  );
}

export function Chat({ initial, firstName, localMode, riasec }: { initial: Msg[]; firstName: string; localMode: boolean; riasec: string | null }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [pendingReply, setPendingReply] = useState<Msg | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, sending]);

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || sending) return;
    setErr(null);
    const temp: Msg = { id: `tmp-${Date.now()}`, role: "user", content: q };
    setMsgs((m) => [...m, temp]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Coba lagi nanti");
      if (j.crisis) {
        // Layar bantuan tampil SEBELUM jawaban apa pun
        setPendingReply({ id: `crisis-${Date.now()}`, role: "assistant", content: j.reply, crisis: true });
        setCrisis(true);
      } else {
        setMsgs((m) => [...m.filter((x) => x.id !== temp.id), j.user, j.assistant]);
      }
    } catch (e) {
      // FR-006: kedua penyedia gagal → "Coba lagi nanti", pertanyaan tetap di kolom input
      setMsgs((m) => m.filter((x) => x.id !== temp.id));
      setInput(q);
      setErr(e instanceof Error ? e.message : "Coba lagi nanti");
    } finally {
      setSending(false);
    }
  }

  function closeCrisis() {
    setCrisis(false);
    if (pendingReply) setMsgs((m) => [...m, pendingReply]);
    setPendingReply(null);
  }

  async function feedback(id: string, value: "helpful" | "inaccurate") {
    setMsgs((m) => m.map((x) => (x.id === id ? { ...x, feedback: value } : x)));
    await fetch("/api/chat/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, value }) });
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col lg:h-[calc(100dvh-4rem)]">
      <PageHeader title="AI Career Companion" icon={<Bot className="size-5" />}
        subtitle={<>Membahas jurusan, kuliah, dan karier — merujuk profilmu{riasec ? ` (kode minat ${riasec})` : ""}.</>}
        action={localMode ? <Badge tone="amber" className="px-3 py-1">Mode lokal (tanpa model AI)</Badge> : <Badge tone="green" className="px-3 py-1">AI aktif</Badge>} />

      <div className="glass flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {msgs.length === 0 && (
            <div className="mx-auto max-w-lg py-6 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-linear-to-br from-brand-500 to-cyan-500 text-white shadow-lg shadow-brand-500/30"><Sparkles className="size-7" /></div>
              <p className="mt-4 text-lg font-semibold text-slate-900">Hai {firstName}! Mau ngobrol soal apa?</p>
              <p className="mt-1 text-sm text-slate-600">Aku mengingat percakapan kita dan memakai hasil asesmenmu. Jawabanku adalah bahan pertimbangan, bukan keputusan.</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="rounded-2xl border border-white/80 bg-white/80 p-3 text-left text-sm text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">{s}</button>)}
              </div>
            </div>
          )}
          {msgs.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] sm:max-w-[75%]", m.role === "user" ? "" : "flex gap-2.5")}>
                {m.role === "assistant" && <div className={cn("mt-1 grid size-8 shrink-0 place-items-center rounded-xl text-white shadow-md", m.crisis ? "bg-rose-500" : "bg-linear-to-br from-brand-500 to-cyan-500")}>{m.crisis ? <LifeBuoy className="size-4" /> : <Bot className="size-4" />}</div>}
                <div>
                  <div className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user" ? "rounded-br-md bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25"
                      : m.crisis ? "rounded-bl-md border border-rose-200 bg-rose-50 text-rose-900" : "rounded-bl-md bg-white/90 text-slate-800 shadow-sm")}>
                    <Rich text={m.content} />
                  </div>
                  {m.role === "assistant" && !m.crisis && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-1">
                      {m.sources && m.sources.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-slate-500"><BookOpen className="size-3" />Sumber: {m.sources.map((s) => s.name).join(", ")}</span>
                      )}
                      {!m.id.startsWith("tmp") && (
                        <span className="ml-auto flex gap-1">
                          <button onClick={() => feedback(m.id, "helpful")} aria-pressed={m.feedback === "helpful"} className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition", m.feedback === "helpful" ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:bg-white")}><ThumbsUp className="size-3" />Membantu</button>
                          <button onClick={() => feedback(m.id, "inaccurate")} aria-pressed={m.feedback === "inaccurate"} className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition", m.feedback === "inaccurate" ? "bg-rose-100 text-rose-800" : "text-slate-500 hover:bg-white")}><ThumbsDown className="size-3" />Tidak akurat</button>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 text-white"><Bot className="size-4" /></div>
              <div className="flex gap-1 rounded-2xl bg-white/90 px-4 py-3 shadow-sm">{[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
            </div>
          )}
          <div ref={end} />
        </div>

        <div className="border-t border-white/70 bg-white/50 p-3 sm:p-4">
          {err && <div className="mb-3"><Alert tone="red" icon={<Info className="size-4" />}>{err} — pertanyaanmu masih ada di kolom bawah.</Alert></div>}
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
            <label htmlFor="msg" className="sr-only">Tulis pertanyaan</label>
            <textarea id="msg" rows={1} value={input} maxLength={1500}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Tanyakan soal jurusan, kuliah, atau karier…" className="input max-h-36 min-h-11 resize-none" />
            <Button type="submit" disabled={sending || !input.trim()} className="h-11 shrink-0" aria-label="Kirim">
              {sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-slate-500">Companion bisa keliru. Bukan layanan konseling krisis — butuh bantuan segera? Buka menu “Butuh bantuan segera?”.</p>
        </div>
      </div>
      <CrisisModal open={crisis} onClose={closeCrisis} />
    </div>
  );
}
