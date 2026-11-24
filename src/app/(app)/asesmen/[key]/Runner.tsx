"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CircleCheck, CloudOff, Cloud, LoaderCircle, RotateCcw, Flag, ArrowRight, Info } from "lucide-react";
import { ASSESSMENTS, LIKERT, topDims, type AssessmentKey } from "@/lib/assessments";
import { Alert, Badge, Button, Card, LinkButton, PageHeader, Progress, ScoreBars } from "@/components/ui";
import { cn, fmtDate } from "@/lib/utils";

const PER_PAGE = 10;
type SaveState = "idle" | "saving" | "saved" | "offline";

export function Runner(props: {
  userId: string;
  akey: AssessmentKey;
  title: string;
  initialAnswers: Record<string, number>;
  serverUpdatedAt: string | null;
  last: { scores: Record<string, number>; completed_at: string } | null;
  doneCount: number;
}) {
  const a = ASSESSMENTS[props.akey];
  const LS = `arka-asm-${props.userId}-${props.akey}`;
  const [mode, setMode] = useState<"result" | "run">(props.last && Object.keys(props.initialAnswers).length === 0 ? "result" : "run");
  const [answers, setAnswers] = useState<Record<string, number>>(props.initialAnswers);
  const [page, setPage] = useState(0);
  const [save, setSave] = useState<SaveState>("idle");
  const [showMissing, setShowMissing] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ scores: Record<string, number>; profileNow: number } | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(Object.keys(props.initialAnswers).length > 0);

  // Gabungkan jawaban lokal (offline) bila lebih baru dari server
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS);
      if (!raw) return;
      const local = JSON.parse(raw) as { answers: Record<string, number>; at: number; pending: boolean };
      const serverAt = props.serverUpdatedAt ? +new Date(props.serverUpdatedAt) : 0;
      if (local.at > serverAt && Object.keys(local.answers).length) {
        setAnswers((s) => ({ ...s, ...local.answers }));
        if (local.pending) { dirty.current = true; setSave("offline"); }
        setMode("run");
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushToServer = useCallback(async (ans: Record<string, number>) => {
    setSave("saving");
    try {
      const res = await fetch("/api/assessment/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: props.akey, answers: ans }) });
      if (!res.ok) throw new Error();
      dirty.current = false;
      setSave("saved");
      try { localStorage.setItem(LS, JSON.stringify({ answers: ans, at: Date.now(), pending: false })); } catch {}
    } catch {
      setSave("offline");
    }
  }, [LS, props.akey]);

  // Kirim ulang otomatis saat koneksi kembali (FR-003 edge case)
  useEffect(() => {
    const on = () => { if (dirty.current) pushToServer(answersRef.current); };
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, [pushToServer]);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  function choose(id: string, v: number) {
    const next = { ...answers, [id]: v };
    setAnswers(next);
    dirty.current = true;
    started.current = true;
    try { localStorage.setItem(LS, JSON.stringify({ answers: next, at: Date.now(), pending: true })); } catch {}
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => pushToServer(next), 700);
  }

  const total = a.items.length;
  const answered = useMemo(() => a.items.filter((i) => answers[i.id]).length, [a.items, answers]);
  const missing = useMemo(() => a.items.filter((i) => !answers[i.id]), [a.items, answers]);
  const pages = Math.ceil(total / PER_PAGE);
  const pageItems = a.items.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const pageMissing = (p: number) => a.items.slice(p * PER_PAGE, (p + 1) * PER_PAGE).some((i) => !answers[i.id]);

  async function finish() {
    if (missing.length) { setShowMissing(true); return; }
    setFinishing(true);
    setErr(null);
    try {
      const res = await fetch("/api/assessment/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: props.akey, answers }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Gagal menyimpan.");
      try { localStorage.removeItem(LS); } catch {}
      setResult({ scores: j.scores, profileNow: j.doneCount });
      setMode("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan. Jawabanmu tetap tersimpan di perangkat.");
    } finally {
      setFinishing(false);
    }
  }

  function restart() {
    if (!confirm("Mulai ulang asesmen ini? Hasil lama tetap tersimpan di riwayat; profil akan memakai hasil terbaru.")) return;
    setAnswers({});
    setPage(0);
    setResult(null);
    setMode("run");
    try { localStorage.removeItem(LS); } catch {}
  }

  // ---------- Tampilan hasil ----------
  if (mode === "result") {
    const scores = result?.scores ?? props.last?.scores ?? {};
    const top = topDims(props.akey, scores, a.dims.length);
    const doneNow = result?.profileNow ?? props.doneCount;
    return (
      <>
        <PageHeader title={`Hasil ${a.title}`} subtitle={result ? "Baru saja selesai — kerja bagus!" : props.last ? `Diselesaikan ${fmtDate(props.last.completed_at)}` : undefined}
          action={<><Button variant="secondary" onClick={restart}><RotateCcw className="size-4" />Ulangi</Button><LinkButton href="/asesmen">Asesmen lain</LinkButton></>} />
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <ScoreBars items={top.map((t) => ({ label: t.label, score: t.score, desc: a.dims.find((d) => d.key === t.dim)?.desc }))} />
          </Card>
          <div className="space-y-4">
            <Alert tone="brand" icon={<Info className="size-5" />}>Skor 0–100 menunjukkan seberapa kuat kecenderungan itu menurut jawabanmu. Ini indikasi, bukan diagnosis atau label.</Alert>
            {doneNow >= 2 ? (
              <Card strong>
                <CircleCheck className="size-7 text-emerald-600" />
                <p className="mt-2 font-semibold text-slate-900">Profil {doneNow >= 4 ? "lengkap" : "sementara"}mu sudah siap</p>
                <p className="mt-1 text-sm text-slate-600">Lihat gambaran dirimu dan rekomendasi jurusan di Career Roadmap.</p>
                <div className="mt-4 flex flex-wrap gap-2"><LinkButton href="/profil" variant="secondary">Lihat profil</LinkButton><LinkButton href="/roadmap">Career Roadmap <ArrowRight className="size-4" /></LinkButton></div>
              </Card>
            ) : (
              <Card><p className="font-semibold text-slate-900">Satu asesmen lagi!</p><p className="mt-1 text-sm text-slate-600">Selesaikan minimal 2 asesmen untuk membentuk profil sementara.</p><LinkButton href="/asesmen" className="mt-4">Pilih asesmen berikutnya</LinkButton></Card>
            )}
          </div>
        </div>
      </>
    );
  }

  // ---------- Tampilan pengerjaan ----------
  return (
    <>
      <PageHeader title={a.title} subtitle={a.subtitle} action={<LinkButton href="/asesmen" variant="secondary"><ChevronLeft className="size-4" />Simpan & keluar</LinkButton>} />

      <Card strong className="sticky top-16 z-10 mb-5 py-4 lg:top-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-900">{answered} / {total} terjawab</span>
          <span className={cn("flex items-center gap-1.5 text-xs", save === "offline" ? "text-amber-700" : "text-slate-500")} aria-live="polite">
            {save === "saving" && <><LoaderCircle className="size-3.5 animate-spin" />Menyimpan…</>}
            {save === "saved" && <><Cloud className="size-3.5" />Tersimpan</>}
            {save === "offline" && <><CloudOff className="size-3.5" />Tersimpan di perangkat — dikirim saat tersambung</>}
          </span>
        </div>
        <Progress value={(answered / total) * 100} className="mt-2" />
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Halaman">
          {Array.from({ length: pages }).map((_, p) => (
            <button key={p} onClick={() => setPage(p)} aria-current={p === page ? "step" : undefined}
              className={cn("size-8 rounded-lg text-xs font-semibold transition",
                p === page ? "bg-brand-600 text-white shadow-md shadow-brand-500/40" : "bg-white/80 text-slate-600 hover:bg-white",
                showMissing && pageMissing(p) && p !== page && "ring-2 ring-rose-400")}>{p + 1}</button>
          ))}
        </div>
      </Card>

      {showMissing && missing.length > 0 && (
        <div className="mb-4"><Alert tone="red" icon={<Flag className="size-5" />}>Masih ada {missing.length} pernyataan kosong (ditandai merah). Lengkapi dulu untuk menyelesaikan.</Alert></div>
      )}

      <ol className="space-y-3" start={page * PER_PAGE + 1}>
        {pageItems.map((it, idx) => {
          const v = answers[it.id];
          const isMissing = showMissing && !v;
          return (
            <li key={it.id} id={it.id} className={cn("glass p-4 sm:p-5", isMissing && "ring-2 ring-rose-400")}>
              <p className="font-medium text-slate-900"><span className="mr-2 text-slate-400">{page * PER_PAGE + idx + 1}.</span>{it.text}</p>
              <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup" aria-label={it.text}>
                {LIKERT.map((l) => (
                  <button key={l.v} role="radio" aria-checked={v === l.v} onClick={() => choose(it.id, l.v)}
                    className={cn("rounded-xl border px-1 py-2 text-center text-[11px] leading-tight transition sm:text-xs",
                      v === l.v ? "border-transparent bg-linear-to-br from-brand-500 to-brand-700 font-semibold text-white shadow-lg shadow-brand-500/30"
                        : "border-white/80 bg-white/70 text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:shadow-md")}>
                    <span className="block text-base font-bold">{l.v}</span>{l.label}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      {err && <div className="mt-4"><Alert tone="red">{err}</Alert></div>}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="secondary" disabled={page === 0} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0 }); }}><ChevronLeft className="size-4" />Sebelumnya</Button>
        {page < pages - 1 ? (
          <Button onClick={() => { setPage(page + 1); window.scrollTo({ top: 0 }); }}>Berikutnya<ChevronRight className="size-4" /></Button>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <Button variant="success" onClick={finish} disabled={finishing || missing.length > 0} aria-describedby="finish-hint">
              {finishing ? <LoaderCircle className="size-4 animate-spin" /> : <CircleCheck className="size-4" />}Selesai
            </Button>
            {missing.length > 0 && (
              <button id="finish-hint" className="text-xs font-semibold text-rose-600 underline" onClick={() => { setShowMissing(true); const p = Math.floor(a.items.indexOf(missing[0]) / PER_PAGE); setPage(p); }}>
                {missing.length} item kosong — tampilkan
              </button>
            )}
          </div>
        )}
      </div>
      {save === "offline" && <p className="mt-4 text-center text-xs text-amber-700"><Badge tone="amber">Offline</Badge> Jawabanmu aman di perangkat ini.</p>}
    </>
  );
}
