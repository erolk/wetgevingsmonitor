import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, sessieGeldig } from "@/lib/admin-auth";

// Schermt /admin/* af. /admin/login is altijd bereikbaar (anders kun je niet
// inloggen). Alle admin-responses krijgen noindex mee zodat ze niet in
// zoekmachines belanden.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/admin/login";
  if (!isLogin) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const ok = await sessieGeldig(token);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
