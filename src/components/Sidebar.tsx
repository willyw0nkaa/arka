"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  House, ClipboardList, UserRound, Map, MessagesSquare, TrendingUp, Compass, Settings, LayoutDashboard,
  FileChartColumn, ShieldCheck, LifeBuoy, LogOut, Lock, Menu, X,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

type Item = { href: string; label: string; icon: React.ElementType; lock?: boolean };

const ROLE_LABEL: Record<Role, string> = { student: "Siswa", counselor: "Guru BK", principal: "Kepala Sekolah", admin: "Admin" };

function navFor(role: Role, locked: boolean): Item[] {
  if (role === "counselor") return [{ href: "/guru", label: "Dashboard Siswa", icon: LayoutDashboard }, { href: "/pengaturan", label: "Pengaturan", icon: Settings }];
  if (role === "principal") return [{ href: "/laporan", label: "Laporan Sekolah", icon: FileChartColumn }, { href: "/pengaturan", label: "Pengaturan", icon: Settings }];
  if (role === "admin") return [{ href: "/admin", label: "Admin", icon: ShieldCheck }, { href: "/laporan", label: "Laporan Sekolah", icon: FileChartColumn }, { href: "/pengaturan", label: "Pengaturan", icon: Settings }];
  return [
    { href: "/beranda", label: "Beranda", icon: House },
    { href: "/asesmen", label: "Asesmen", icon: ClipboardList, lock: locked },
    { href: "/profil", label: "Profil Diri", icon: UserRound, lock: locked },
    { href: "/roadmap", label: "Career Roadmap", icon: Map, lock: locked },
    { href: "/companion", label: "AI Companion", icon: MessagesSquare, lock: locked },
    { href: "/progres", label: "Progres", icon: TrendingUp, lock: locked },
    { href: "/direktori", label: "Career Directory", icon: Compass },
    { href: "/pengaturan", label: "Pengaturan", icon: Settings },
  ];
}

export function Sidebar({ role, name, schoolName, locked }: { role: Role; name: string; schoolName: string | null; locked: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const items = navFor(role, locked);
  const initials = name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="px-2 pb-6 pt-1"><Link href="/" aria-label="ARKA beranda publik"><Logo /></Link></div>
      <ul className="space-y-1">
        {items.map(({ href, label, icon: Icon, lock }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={lock ? "/beranda?terkunci=1" : href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-linear-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-md hover:shadow-brand-500/10",
                  lock && "opacity-60"
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-brand-600")} />
                <span className="flex-1">{label}</span>
                {lock && <Lock className="size-3.5" aria-label="terkunci" />}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto space-y-3 pt-6">
        <Link href="/bantuan" className="flex items-center gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:shadow-md hover:shadow-rose-500/15">
          <LifeBuoy className="size-[18px]" /> Butuh bantuan segera?
        </Link>
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 shadow-sm">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-500 to-cyan-500 text-sm font-bold text-white shadow-md shadow-brand-500/30">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
            <p className="truncate text-xs text-slate-500">{ROLE_LABEL[role]}{schoolName ? ` · ${schoolName}` : ""}</p>
          </div>
          <a href="/keluar" className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600" title="Keluar" aria-label="Keluar">
            <LogOut className="size-4" />
          </a>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      <header className="mobile-bar glass-strong sticky top-0 z-30 flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 lg:hidden">
        <Link href="/"><Logo /></Link>
        <button className="btn-secondary btn px-2.5" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu className="size-5" /></button>
      </header>
      <aside className="glass fixed inset-y-4 left-4 z-20 hidden w-68 p-4 lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="glass-strong absolute inset-y-3 left-3 w-[min(19rem,85vw)] p-4">
            <button className="btn-ghost btn absolute right-3 top-3 px-2" onClick={() => setOpen(false)} aria-label="Tutup menu"><X className="size-5" /></button>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
