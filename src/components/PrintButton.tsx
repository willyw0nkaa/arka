"use client";
import { Download } from "lucide-react";
import { Button } from "@/components/ui";
export function PrintButton({ label = "Unduh PDF" }: { label?: string }) {
  return <Button onClick={() => window.print()}><Download className="size-4" />{label}</Button>;
}
