import { MessagesSquare, UserRound } from "lucide-react";
import { requirePage } from "@/lib/auth";
import { loadStudent } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { aiConfigured } from "@/lib/ai";
import { Empty, LinkButton, PageHeader } from "@/components/ui";
import { Chat, type Msg } from "./Chat";

export const metadata = { title: "AI Companion" };

export default async function Page() {
  const { profile } = await requirePage({ roles: ["student"], active: true });
  const d = await loadStudent(profile.id);
  if (d.profile.status === "belum") {
    return (
      <>
        <PageHeader title="AI Career Companion" icon={<MessagesSquare className="size-5" />} />
        <Empty icon={<UserRound className="size-6" />} title="Companion butuh profilmu dulu" action={<LinkButton href="/asesmen">Selesaikan asesmen</LinkButton>}>
          Supaya jawabannya relevan, Companion merujuk hasil asesmenmu. Selesaikan minimal 2 asesmen.
        </Empty>
      </>
    );
  }
  // RLS: hanya pesan milik sendiri
  const sb = await createClient();
  const { data } = await sb.from("chat_messages").select("id, role, content, sources, feedback, created_at").order("created_at", { ascending: false }).limit(60);
  const history = ((data ?? []) as Msg[]).reverse();
  return <Chat initial={history} firstName={profile.full_name.split(" ")[0]} localMode={!aiConfigured()} riasec={d.profile.riasecCode} />;
}
