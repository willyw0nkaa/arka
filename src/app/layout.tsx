import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SwRegister } from "@/components/SwRegister";

export const metadata: Metadata = {
  title: { default: "ARKA — AI-powered Road for Knowledge & Advancement", template: "%s · ARKA" },
  description: "Platform asesmen minat, kepribadian, bakat, dan nilai karier, Career Roadmap, dan AI Career Companion untuk siswa SMA/SMK dan guru BK.",
};

export const viewport: Viewport = { themeColor: "#4f46e5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <div className="app-bg" aria-hidden />
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
