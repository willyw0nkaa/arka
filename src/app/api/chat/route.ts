import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { loadCareers, loadStudent } from "@/lib/data";
import { detectCrisis, CRISIS_REPLY } from "@/lib/crisis";
import { aiConfigured, generateWithFallback, localAnswer, looksCareerRelated, OFF_TOPIC_REPLY, retrieve, systemPrompt, type ChatTurn } from "@/lib/ai";
import { track } from "@/lib/events";

export const maxDuration = 30;

export async function POST(req: Request) {
  const a = await requireApi({ roles: ["student"], active: true });
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  const message = String(b.message ?? "").trim().slice(0, 1500);
  if (!message) return bad("Pesan kosong.");

  // FR-007: sinyal krisis → layar bantuan dulu, TANPA saran karier, dan isi pesan TIDAK disimpan/dicatat
  if (detectCrisis(message)) {
    await track(a.userId, "crisis_screen_shown");
    return NextResponse.json({ crisis: true, reply: CRISIS_REPLY });
  }

  const db = createAdminClient();
  const d = await loadStudent(a.userId);
  if (d.profile.status === "belum") return bad("Selesaikan minimal 2 asesmen untuk memakai Companion.");

  // Rate limit sederhana: 30 pesan / jam
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("chat_messages").select("id", { count: "exact", head: true }).eq("student_id", a.userId).eq("role", "user").gte("created_at", hourAgo);
  if ((count ?? 0) >= 30) return bad("Kamu sudah mengirim banyak pesan dalam satu jam. Istirahat sebentar, lalu coba lagi.", 429);

  // Memori percakapan: 12 pesan terakhir
  const { data: hist } = await db.from("chat_messages").select("role, content, created_at").eq("student_id", a.userId).order("created_at", { ascending: false }).limit(12);
  const history = ((hist ?? []) as { role: "user" | "assistant"; content: string; created_at: string }[]).reverse();
  const lastAt = history.length ? +new Date(history[history.length - 1].created_at) : 0;
  if (!lastAt || Date.now() - lastAt > 30 * 60_000) await track(a.userId, "chat_session_started"); // M4: jeda > 30 menit = sesi baru

  const careers = await loadCareers();
  const ctx = retrieve(careers, message, d.profile);
  const turns: ChatTurn[] = [...history.map((h) => ({ role: h.role, content: h.content })), { role: "user", content: message }];

  let content: string, provider: string, model: string;
  let sources = ctx.map((c) => ({ name: c.name, kind: c.kind, source: c.source }));

  if (aiConfigured()) {
    try {
      const sys = systemPrompt(a.profile.full_name, `kelas ${a.profile.class_level ?? "-"}`, d.profile, d.roadmap?.data ?? null, ctx);
      const r = await generateWithFallback(sys, turns);
      content = r.content;
      provider = r.provider;
      model = r.model;
    } catch {
      return NextResponse.json({ error: "Coba lagi nanti" }, { status: 503 });
    }
  } else if (!looksCareerRelated(message, history)) {
    content = OFF_TOPIC_REPLY;
    provider = "local";
    model = "arka-rules-v1";
    sources = [];
  } else {
    content = localAnswer(message, d.profile, d.roadmap?.data ?? null, ctx);
    provider = "local";
    model = "arka-rules-v1";
  }

  // Simpan percakapan (dengan versi model & sumber data — Bab 10, Kualitas AI)
  const now = Date.now();
  const { data: saved, error } = await db.from("chat_messages").insert([
    { student_id: a.userId, role: "user", content: message, sources: [], created_at: new Date(now).toISOString() },
    { student_id: a.userId, role: "assistant", content, sources, provider, model, created_at: new Date(now + 1).toISOString() },
  ]).select("id, role, content, sources, feedback, created_at");
  if (error || !saved) return bad("Gagal menyimpan percakapan.", 500);
  const user = saved.find((m) => m.role === "user");
  const assistant = saved.find((m) => m.role === "assistant");
  return NextResponse.json({ user, assistant });
}
