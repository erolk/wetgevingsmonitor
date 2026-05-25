"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  adminGeconfigureerd,
  wachtwoordKlopt,
  maakSessieToken,
  SESSIE_DUUR_SECONDEN,
} from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function login(formData: FormData) {
  if (!adminGeconfigureerd()) redirect("/admin/login?fout=config");

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "onbekend";
  const rl = rateLimit(`admin-login:${ip}`, {
    max: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.ok) redirect("/admin/login?fout=limiet");

  const wachtwoord = String(formData.get("wachtwoord") ?? "");
  if (!wachtwoordKlopt(wachtwoord)) redirect("/admin/login?fout=1");

  const token = await maakSessieToken();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: SESSIE_DUUR_SECONDEN,
  });
  redirect("/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 0,
  });
  redirect("/admin/login");
}
