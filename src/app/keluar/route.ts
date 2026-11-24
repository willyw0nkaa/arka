import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const sb = await createClient();
  await sb.auth.signOut();
  const to = new URL("/masuk", req.url);
  const alasan = req.nextUrl.searchParams.get("alasan");
  if (alasan) to.searchParams.set("info", alasan);
  return NextResponse.redirect(to);
}
