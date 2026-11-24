import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/beranda", "/asesmen", "/profil", "/roadmap", "/companion", "/progres", "/direktori", "/pengaturan", "/guru", "/laporan", "/admin"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    const to = request.nextUrl.clone();
    to.pathname = "/masuk";
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }
  if (user && (path === "/masuk" || path === "/daftar")) {
    const to = request.nextUrl.clone();
    to.pathname = "/beranda";
    to.search = "";
    return NextResponse.redirect(to);
  }
  return response;
}
