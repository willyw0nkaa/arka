import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";

const secret = () => process.env.APP_SECRET || "arka-dev-secret-ganti-di-produksi";

export const hashCode = (code: string) => createHash("sha256").update(`${secret()}:${code}`).digest("hex");
export const sixDigit = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
export const randomToken = () => randomBytes(24).toString("base64url");
export const pseudoId = (userId: string) =>
  createHash("sha256").update(`pseudo:${secret()}:${userId}`).digest("hex").slice(0, 24);

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
