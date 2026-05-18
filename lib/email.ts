import fs from "node:fs/promises";
import path from "node:path";

// Twee modes:
// - 'file' (default): schrijft mails naar data/outbox/ als .eml-bestanden,
//   geen externe afhankelijkheden. Goed voor dev en demo.
// - 'resend': stuurt echt via Resend API. Vereist RESEND_API_KEY +
//   EMAIL_FROM (een geverifieerd afzenderadres).
// Schakelen via EMAIL_MODE=resend in .env.local.

export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const MODE = process.env.EMAIL_MODE === "resend" ? "resend" : "file";
const FROM = process.env.EMAIL_FROM ?? "Wetgevingsmonitor <noreply@example.invalid>";
const RESEND_KEY = process.env.RESEND_API_KEY;

export async function sendEmail(email: Email): Promise<{ ok: boolean; via: string; detail?: string }> {
  if (MODE === "resend") return sendViaResend(email);
  return sendViaFile(email);
}

async function sendViaFile(email: Email) {
  const dir = path.join(process.cwd(), "data", "outbox");
  await fs.mkdir(dir, { recursive: true });
  const safeId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileName = `${safeId}.eml`;
  const content =
    `From: ${FROM}\n` +
    `To: ${email.to}\n` +
    `Subject: ${email.subject}\n` +
    `Date: ${new Date().toUTCString()}\n` +
    `Content-Type: text/plain; charset=utf-8\n\n` +
    `${email.text}\n\n---HTML---\n${email.html}\n`;
  await fs.writeFile(path.join(dir, fileName), content, "utf8");
  return { ok: true, via: "file", detail: fileName };
}

async function sendViaResend(email: Email) {
  if (!RESEND_KEY) {
    return { ok: false, via: "resend", detail: "RESEND_API_KEY ontbreekt" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  if (!res.ok) {
    return { ok: false, via: "resend", detail: `Resend ${res.status}: ${await res.text()}` };
  }
  return { ok: true, via: "resend" };
}

export function emailMode(): "file" | "resend" {
  return MODE;
}
