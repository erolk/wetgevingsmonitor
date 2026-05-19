import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export type ContactMessage = {
  id: string;
  naam: string;
  email: string;
  bericht: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

const FILE = path.join(process.cwd(), "data", "contact-messages.json");

async function load(): Promise<ContactMessage[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function save(msgs: ContactMessage[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(msgs, null, 2));
}

export async function createContactMessage(input: {
  naam: string;
  email: string;
  bericht: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<ContactMessage> {
  const msg: ContactMessage = {
    id: crypto.randomUUID(),
    naam: input.naam.trim(),
    email: input.email.trim().toLowerCase(),
    bericht: input.bericht.trim(),
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    createdAt: new Date().toISOString(),
  };
  const all = await load();
  all.push(msg);
  await save(all);
  return msg;
}
