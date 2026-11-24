import { Suspense } from "react";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Masuk" };

export default function Page() {
  return (
    <AuthShell title="Selamat datang kembali" subtitle="Masuk untuk melanjutkan perjalanan kariermu.">
      <Suspense><LoginForm /></Suspense>
    </AuthShell>
  );
}
