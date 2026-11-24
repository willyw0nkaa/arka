import Link from "next/link";
import { Logo } from "@/components/ui";

export function AuthShell({ title, subtitle, children, wide }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8">
      <Link href="/" className="mb-8"><Logo /></Link>
      <div className={`glass-strong w-full p-6 sm:p-8 ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        <Link href="/privasi" className="underline-offset-2 hover:underline">Kebijakan Privasi</Link> ·{" "}
        <Link href="/bantuan" className="underline-offset-2 hover:underline">Butuh bantuan segera?</Link>
      </p>
    </div>
  );
}
