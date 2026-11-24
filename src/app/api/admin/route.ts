import { NextResponse } from "next/server";
import { requireApi, bad } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { audit } from "@/lib/events";

export async function POST(req: Request) {
  const a = await requireApi({ roles: ["admin"] });
  if (!a.ok) return a.res;
  const b = await req.json().catch(() => ({}));
  const db = createAdminClient();
  const userId = String(b.userId ?? "");

  switch (b.action) {
    case "verify": {
      const { error } = await db.from("profiles").update({ verified: true }).eq("id", userId).in("role", ["counselor", "principal"]);
      if (error) return bad(error.message, 500);
      await audit(a.userId, "staff_verified", userId);
      break;
    }
    case "deactivate": {
      // FR-009 edge case: akses hilang seketika (setiap request memeriksa status) + login diblokir
      await db.from("profiles").update({ status: "deactivated" }).eq("id", userId).in("role", ["counselor", "principal"]);
      await db.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
      await audit(a.userId, "staff_deactivated", userId);
      break;
    }
    case "reactivate": {
      await db.from("profiles").update({ status: "active" }).eq("id", userId).in("role", ["counselor", "principal"]);
      await db.auth.admin.updateUserById(userId, { ban_duration: "none" });
      await audit(a.userId, "staff_reactivated", userId);
      break;
    }
    case "addSchool": {
      const name = String(b.name ?? "").trim().slice(0, 120);
      const city = String(b.city ?? "").trim().slice(0, 60);
      const type = b.type === "negeri" ? "negeri" : "swasta";
      if (!name || !city) return bad("Nama dan kota wajib diisi.");
      const { error } = await db.from("schools").insert({ name, city, type });
      if (error) return bad(error.message, 500);
      await audit(a.userId, "school_added", null, { name });
      break;
    }
    case "reviewed": {
      await db.from("chat_messages").update({ reviewed: true }).eq("id", String(b.messageId ?? ""));
      await audit(a.userId, "ai_answer_reviewed", null, { message_id: b.messageId });
      break;
    }
    default:
      return bad("Aksi tidak dikenal.");
  }
  return NextResponse.json({ ok: true });
}
