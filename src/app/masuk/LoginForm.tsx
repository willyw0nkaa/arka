"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert, Button } from "@/components/ui";

const INFO: Record<string, string> = {
  nonaktif: "Akun ini tidak aktif atau sedang dalam proses penghapusan.",
  dihapus: "Permintaan penghapusan akun diterima. Data akan terhapus permanen dalam 30 hari.",
};

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const info = INFO[sp.get("info") ?? ""];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) return setErr(error.message === "Invalid login credentials" ? "Email atau kata sandi salah." : error.message);
    router.replace(sp.get("next") || "/beranda");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {info && <Alert tone="amber">{info}</Alert>}
      {err && <Alert tone="red">{err}</Alert>}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="pw">Kata sandi</label>
        <input id="pw" type="password" className="input" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button className="w-full" size="lg" disabled={loading}>
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />} Masuk
      </Button>
      <p className="text-center text-sm text-slate-600">Belum punya akun? <Link className="font-semibold text-brand-700 hover:underline" href="/daftar">Daftar</Link></p>
    </form>
  );
}
