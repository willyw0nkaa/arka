"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, UserPlus, GraduationCap, Users, School as SchoolIcon, CircleCheck, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert, Button, LinkButton } from "@/components/ui";
import { ageFrom, cn, isEmail } from "@/lib/utils";

type S = { id: string; name: string; city: string };
type Role = "student" | "counselor" | "principal";
const DRAFT = "arka-register-draft";
const NONE = "__none__";

export function RegisterForm({ schools, prefillSchool }: { schools: S[]; prefillSchool: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [role, setRole] = useState<Role>(sp.get("peran") === "guru" ? "counselor" : "student");
  const [f, setF] = useState({
    full_name: "", email: "", password: "", birth_date: "", class_level: "11", class_name: "",
    school_id: prefillSchool, parent_name: "", parent_contact: "", agree: false,
  });
  const [err, setErr] = useState<string | null>(null);
  const [dup, setDup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ pending: boolean; demo?: { link: string; code: string } | null; sent?: boolean; staff?: boolean } | null>(null);

  // FR-001 edge case: isian tetap ada bila koneksi terputus / halaman dimuat ulang
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT);
      if (raw) {
        const d = JSON.parse(raw);
        setF((p) => ({ ...p, ...d, password: "", school_id: prefillSchool || d.school_id || "" }));
        if (d.role) setRole(d.role);
      }
    } catch {}
  }, [prefillSchool]);
  useEffect(() => {
    try {
      const { password: _pw, ...rest } = f;
      void _pw;
      sessionStorage.setItem(DRAFT, JSON.stringify({ ...rest, role }));
    } catch {}
  }, [f, role]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const age = useMemo(() => (f.birth_date ? ageFrom(f.birth_date) : null), [f.birth_date]);
  const minor = role === "student" && age !== null && age < 18;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setDup(false);
    if (!isEmail(f.email)) return setErr("Format email tidak valid.");
    if (f.password.length < 8) return setErr("Kata sandi minimal 8 karakter.");
    if (role === "student") {
      if (!f.birth_date || age === null || age < 10 || age > 25) return setErr("Tanggal lahir tidak valid.");
      if (!f.school_id) return setErr("Pilih sekolah, atau pilih “Sekolah belum terdaftar”.");
      if (minor && !isEmail(f.parent_contact)) return setErr("Email orang tua/wali wajib diisi dengan benar.");
      if (minor && f.parent_contact.trim().toLowerCase() === f.email.trim().toLowerCase()) return setErr("Email orang tua harus berbeda dari email siswa.");
    } else if (!f.school_id || f.school_id === NONE) return setErr("Pilih sekolah tempat Anda bertugas.");
    if (!f.agree) return setErr("Centang persetujuan Kebijakan Privasi terlebih dahulu.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, role, school_id: f.school_id === NONE ? null : f.school_id }),
      });
      const j = await res.json();
      if (res.status === 409) {
        setDup(true);
        return setErr("Email sudah terdaftar.");
      }
      if (!res.ok) return setErr(j.error || "Pendaftaran gagal.");
      const { error } = await createClient().auth.signInWithPassword({ email: f.email.trim(), password: f.password });
      if (error) return setErr("Akun dibuat, tetapi gagal masuk otomatis. Silakan masuk manual.");
      sessionStorage.removeItem(DRAFT);
      setDone({ pending: j.status === "pending_consent", demo: j.demo, sent: j.sent, staff: role !== "student" });
    } catch {
      setErr("Koneksi terputus. Isianmu masih tersimpan — tekan Daftar lagi saat koneksi kembali.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="green" icon={<CircleCheck className="size-5" />} title="Akun berhasil dibuat">
          {done.staff
            ? "Akun Anda menunggu verifikasi admin sebelum dapat membuka dashboard."
            : done.pending
              ? "Akunmu berstatus menunggu persetujuan orang tua. Asesmen dan Companion terbuka setelah orang tua menyetujui."
              : "Akunmu sudah aktif. Selamat menjelajah!"}
        </Alert>
        {done.pending && done.sent && <Alert tone="brand">Tautan persetujuan dan kode verifikasi telah dikirim ke email orang tua/wali.</Alert>}
        {done.pending && done.demo && <DemoConsent demo={done.demo} />}
        <Button className="w-full" size="lg" onClick={() => { router.replace("/beranda"); router.refresh(); }}>Lanjut ke beranda</Button>
      </div>
    );
  }

  const tabs: { k: Role; label: string; icon: React.ElementType }[] = [
    { k: "student", label: "Siswa", icon: GraduationCap },
    { k: "counselor", label: "Guru BK", icon: Users },
    { k: "principal", label: "Kepala Sekolah", icon: SchoolIcon },
  ];

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100/80 p-1.5" role="tablist">
        {tabs.map(({ k, label, icon: Icon }) => (
          <button type="button" key={k} role="tab" aria-selected={role === k} onClick={() => setRole(k)}
            className={cn("flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm",
              role === k ? "bg-white text-brand-700 shadow-md shadow-brand-500/15" : "text-slate-600 hover:text-slate-900")}>
            <Icon className="size-4" />{label}
          </button>
        ))}
      </div>

      {err && (
        <Alert tone="red">
          {err}
          {dup && <> <Link href={`/masuk?email=${encodeURIComponent(f.email)}`} className="font-semibold underline">Masuk ke akun ini</Link></>}
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="nm">Nama lengkap</label>
          <input id="nm" className="input" required value={f.full_name} onChange={set("full_name")} autoComplete="name" />
        </div>
        {role === "student" && (
          <>
            <div>
              <label className="label" htmlFor="bd">Tanggal lahir</label>
              <input id="bd" type="date" className="input" required value={f.birth_date} onChange={set("birth_date")} max={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="grid grid-cols-[6rem_1fr] gap-2">
              <div>
                <label className="label" htmlFor="kl">Kelas</label>
                <select id="kl" className="input" value={f.class_level} onChange={set("class_level")}>
                  <option value="10">10</option><option value="11">11</option><option value="12">12</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="kn">Rombel <span className="text-slate-400">(opsional)</span></label>
                <input id="kn" className="input" placeholder="XI IPA 1" value={f.class_name} onChange={set("class_name")} />
              </div>
            </div>
          </>
        )}
        <div className="sm:col-span-2">
          <label className="label" htmlFor="sc">Sekolah</label>
          <select id="sc" className="input" value={f.school_id} onChange={set("school_id")} required>
            <option value="">— Pilih sekolah —</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
            {role === "student" && <option value={NONE}>Sekolah belum terdaftar</option>}
          </select>
          {f.school_id === NONE && <p className="mt-1.5 text-xs text-amber-700">Akunmu tetap bisa dipakai, tetapi tidak terhubung ke dashboard guru BK mana pun.</p>}
        </div>
        <div>
          <label className="label" htmlFor="em">Email</label>
          <input id="em" type="email" className="input" required value={f.email} onChange={set("email")} autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="pw">Kata sandi</label>
          <input id="pw" type="password" className="input" required minLength={8} value={f.password} onChange={set("password")} autoComplete="new-password" placeholder="Minimal 8 karakter" />
        </div>
      </div>

      {minor && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-4">
          <p className="text-sm font-semibold text-brand-900">Persetujuan orang tua/wali diperlukan</p>
          <p className="mt-0.5 text-xs text-brand-800">Usiamu {age} tahun. Sesuai UU PDP Pasal 25, kami akan mengirim tautan persetujuan ke orang tua/wali.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><label className="label" htmlFor="pn">Nama orang tua/wali</label><input id="pn" className="input" value={f.parent_name} onChange={set("parent_name")} /></div>
            <div><label className="label" htmlFor="pc">Email orang tua/wali</label><input id="pc" type="email" className="input" value={f.parent_contact} onChange={set("parent_contact")} /></div>
          </div>
        </div>
      )}

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" className="mt-0.5 size-4 accent-brand-600" checked={f.agree} onChange={set("agree")} />
        <span>Saya sudah membaca <Link href="/privasi" target="_blank" className="font-semibold text-brand-700 underline">Kebijakan Privasi</Link> dan memahami bahwa hasil asesmen ARKA adalah indikasi, bukan diagnosis.</span>
      </label>

      <Button className="w-full" size="lg" disabled={loading}>
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Daftar
      </Button>
      <p className="text-center text-sm text-slate-600">Sudah punya akun? <Link className="font-semibold text-brand-700 hover:underline" href="/masuk">Masuk</Link></p>
    </form>
  );
}

export function DemoConsent({ demo }: { demo: { link: string; code: string } }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 p-4 text-sm text-amber-900">
      <p className="font-semibold">Mode demo aktif</p>
      <p className="mt-1">Email belum dikonfigurasi, jadi tautan & kode ditampilkan di sini. Berikan kepada orang tua/wali (atau uji sendiri):</p>
      <p className="mt-3 text-xs uppercase tracking-wide text-amber-700">Kode verifikasi</p>
      <p className="font-mono text-2xl font-bold tracking-[0.3em]">{demo.code}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <LinkButton href={demo.link} target="_blank" size="sm" variant="secondary">Buka halaman persetujuan</LinkButton>
        <Button type="button" size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(demo.link); setCopied(true); }}>
          <Copy className="size-3.5" />{copied ? "Tersalin" : "Salin tautan"}
        </Button>
      </div>
    </div>
  );
}
