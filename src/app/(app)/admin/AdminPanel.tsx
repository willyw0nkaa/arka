"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, School, Bot, ChartColumn, Plus, LoaderCircle, Ban, Check, ShieldAlert } from "lucide-react";
import { Alert, Badge, Button, Card, Stat } from "@/components/ui";
import { cn, fmtDate, fmtDateTime } from "@/lib/utils";

type Staff = { id: string; full_name: string; email: string; role: string; verified: boolean; status: string; school_id: string | null; created_at: string };
type SchoolT = { id: string; name: string; city: string; type: string; invite_code: string };
type Review = { id: string; question: string; answer: string; model: string; created_at: string };

const EVENT_LABELS: [string, string][] = [
  ["account_registered", "Pendaftaran"], ["consent_recorded", "Persetujuan ortu"], ["assessment_started", "Asesmen dimulai"],
  ["assessment_completed", "Asesmen selesai"], ["profile_generated", "Profil terbentuk"], ["roadmap_saved", "Roadmap disimpan"],
  ["roadmap_step_completed", "Langkah roadmap selesai"], ["chat_session_started", "Sesi Companion"], ["ai_feedback_given", "Umpan balik AI"],
  ["crisis_screen_shown", "Layar krisis tampil"], ["dashboard_opened", "Dashboard BK dibuka"], ["student_detail_opened", "Detail siswa dibuka"],
  ["counseling_note_saved", "Catatan konseling"], ["clarity_survey_answered", "Survei kejelasan"], ["account_deletion_requested", "Permintaan hapus akun"],
];

export function AdminPanel({ staff, schools, review, counts, guard }: { staff: Staff[]; schools: SchoolT[]; review: Review[]; counts: Record<string, number>; guard: { minors: number; gr2Violations: number; activeStudents: number; pending: number } }) {
  const router = useRouter();
  const [tab, setTab] = useState<"verify" | "schools" | "review" | "metrics">("verify");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [school, setSchool] = useState({ name: "", city: "", type: "swasta" });
  const schoolName = (id: string | null) => schools.find((s) => s.id === id)?.name ?? "—";

  async function act(body: Record<string, unknown>, key: string) {
    setBusy(key); setErr(null);
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setErr(j.error || "Gagal.");
    router.refresh();
  }

  const pending = staff.filter((s) => !s.verified && s.status !== "deactivated");
  const tabs = [
    { k: "verify", label: `Verifikasi akun${pending.length ? ` (${pending.length})` : ""}`, icon: BadgeCheck },
    { k: "schools", label: "Sekolah", icon: School },
    { k: "review", label: `Tinjauan AI${review.length ? ` (${review.length})` : ""}`, icon: Bot },
    { k: "metrics", label: "Metrik 30 hari", icon: ChartColumn },
  ] as const;

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(({ k, label, icon: Icon }) => <button key={k} onClick={() => setTab(k)} className={cn("btn", tab === k ? "btn-primary" : "btn-secondary")}><Icon className="size-4" />{label}</button>)}
      </div>
      {err && <div className="mb-4"><Alert tone="red">{err}</Alert></div>}

      {tab === "verify" && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2">Nama</th><th>Peran</th><th>Sekolah</th><th>Terdaftar</th><th>Status</th><th /></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-slate-200/70">
                  <td className="py-2.5"><p className="font-medium">{s.full_name}</p><p className="text-xs text-slate-500">{s.email}</p></td>
                  <td>{s.role === "counselor" ? "Guru BK" : "Kepala sekolah"}</td>
                  <td>{schoolName(s.school_id)}</td>
                  <td>{fmtDate(s.created_at)}</td>
                  <td>{s.status === "deactivated" ? <Badge tone="red">Nonaktif</Badge> : s.verified ? <Badge tone="green">Terverifikasi</Badge> : <Badge tone="amber">Menunggu</Badge>}</td>
                  <td className="space-x-1 text-right">
                    {s.status !== "deactivated" && !s.verified && <Button size="sm" variant="success" disabled={!!busy} onClick={() => act({ action: "verify", userId: s.id }, s.id)}>{busy === s.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}Verifikasi</Button>}
                    {s.status !== "deactivated" && <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => confirm(`Nonaktifkan ${s.full_name}? Akses hilang seketika.`) && act({ action: "deactivate", userId: s.id }, s.id + "d")}><Ban className="size-3.5" />Nonaktifkan</Button>}
                    {s.status === "deactivated" && <Button size="sm" variant="secondary" disabled={!!busy} onClick={() => act({ action: "reactivate", userId: s.id }, s.id + "r")}>Aktifkan lagi</Button>}
                  </td>
                </tr>
              ))}
              {staff.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">Belum ada akun guru BK / kepala sekolah.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "schools" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card strong>
            <h2 className="font-semibold text-slate-900">Tambah sekolah</h2>
            <div className="mt-4 space-y-3">
              <div><label className="label" htmlFor="sn">Nama sekolah</label><input id="sn" className="input" value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} /></div>
              <div><label className="label" htmlFor="sc">Kota</label><input id="sc" className="input" value={school.city} onChange={(e) => setSchool({ ...school, city: e.target.value })} /></div>
              <div><label className="label" htmlFor="st">Jenis</label><select id="st" className="input" value={school.type} onChange={(e) => setSchool({ ...school, type: e.target.value })}><option value="swasta">Swasta</option><option value="negeri">Negeri</option></select></div>
              <Button className="w-full" disabled={!!busy || !school.name || !school.city} onClick={async () => { await act({ action: "addSchool", ...school }, "school"); setSchool({ name: "", city: "", type: "swasta" }); }}>
                {busy === "school" ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}Tambah
              </Button>
            </div>
          </Card>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2">Sekolah</th><th>Kota</th><th>Jenis</th><th>Kode undangan</th></tr></thead>
              <tbody>{schools.map((s) => <tr key={s.id} className="border-t border-slate-200/70"><td className="py-2.5 font-medium">{s.name}</td><td>{s.city}</td><td className="capitalize">{s.type}</td><td><span className="rounded-lg bg-white px-2 py-1 font-mono text-xs shadow-sm">{s.invite_code}</span></td></tr>)}</tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === "review" && (
        <div className="space-y-4">
          <Alert tone="brand">Antrean tinjauan mingguan (GR3): jawaban Companion yang ditandai “Tidak akurat” oleh siswa. Identitas siswa tidak ditampilkan. Target: &lt; 10% jawaban bermasalah dari sampel minimal 50 jawaban per minggu.</Alert>
          {review.length === 0 && <Card className="text-center text-sm text-slate-500">Antrean kosong.</Card>}
          {review.map((r) => (
            <Card key={r.id}>
              <p className="text-xs text-slate-500">{fmtDateTime(r.created_at)} · {r.model}</p>
              <p className="mt-2 text-sm"><b>Pertanyaan:</b> {r.question}</p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-sm"><b>Jawaban:</b> {r.answer}</p>
              <Button size="sm" className="mt-3" variant="secondary" disabled={!!busy} onClick={() => act({ action: "reviewed", messageId: r.id }, r.id)}><Check className="size-3.5" />Tandai sudah ditinjau</Button>
            </Card>
          ))}
        </div>
      )}

      {tab === "metrics" && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Siswa aktif" value={guard.activeStudents} />
            <Stat label="Menunggu persetujuan" value={guard.pending} />
            <Stat label="Akun < 18 tahun" value={guard.minors} />
            <Stat label="GR2: asesmen tanpa persetujuan" value={<span className={guard.gr2Violations ? "text-rose-600" : "text-emerald-600"}>{guard.gr2Violations}</span>} hint="Harus 0" icon={<ShieldAlert className="size-5" />} />
          </div>
          <Card>
            <h2 className="font-semibold text-slate-900">Event 30 hari terakhir</h2>
            <p className="text-xs text-slate-500">Hanya ID pseudonim, jenis event, dan waktu yang dicatat.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {EVENT_LABELS.map(([k, l]) => <div key={k} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-sm"><span>{l}</span><b className="tabular-nums">{counts[k] ?? 0}</b></div>)}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
