import { NextResponse } from "next/server";
import { confirmByToken } from "@/lib/subscriptions";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/abonnement/fout", url.origin));
  }
  const sub = await confirmByToken(token);
  if (!sub) {
    return NextResponse.redirect(new URL("/abonnement/fout", url.origin));
  }
  return NextResponse.redirect(
    new URL(`/abonnement/bevestigd?type=${sub.target.type}`, url.origin),
  );
}
