import "server-only";

export const DEMO_MODE = process.env.DEMO_MODE !== "false";

/** Kirim email via Resend bila RESEND_API_KEY ada. Mengembalikan true bila terkirim. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || "ARKA <onboarding@resend.dev>", to: [to], subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function emailLayout(title: string, body: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0f172a">
  <h2 style="color:#4338ca;margin:0 0 12px">ARKA</h2><h3 style="margin:0 0 12px">${title}</h3>${body}
  <p style="color:#64748b;font-size:12px;margin-top:24px">Email ini dikirim otomatis oleh ARKA. Abaikan bila Anda tidak merasa terkait.</p></div>`;
}
