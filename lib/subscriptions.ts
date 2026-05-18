import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// JSON-file based subscriber store. Voor productie te vervangen door
// Vercel KV, Postgres of een ander persistent store. De interface
// hier (createSubscription / confirm / unsubscribe / list / find) is
// expres minimal zodat overschakelen makkelijk is.

export type SubscriptionTarget =
  | { type: "wet"; wetId: string; titel: string }
  | { type: "ministerie"; slug: string; naam: string };

export type Subscription = {
  id: string; // uuid
  email: string;
  target: SubscriptionTarget;
  status: "pending" | "confirmed";
  confirmToken: string;
  unsubscribeToken: string;
  createdAt: string;
  confirmedAt: string | null;
};

const FILE = path.join(process.cwd(), "data", "subscriptions.json");

async function load(): Promise<Subscription[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function save(subs: Subscription[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(subs, null, 2));
}

function token() {
  return crypto.randomBytes(24).toString("hex");
}

function targetKey(t: SubscriptionTarget) {
  return t.type === "wet" ? `wet:${t.wetId}` : `min:${t.slug}`;
}

export async function createSubscription(
  email: string,
  target: SubscriptionTarget,
): Promise<Subscription> {
  const subs = await load();
  // Dubbele check: bestaat al een (al dan niet confirmed) subscriptie?
  const existing = subs.find(
    (s) =>
      s.email.toLowerCase() === email.toLowerCase() &&
      targetKey(s.target) === targetKey(target),
  );
  if (existing) {
    // Geef bestaande terug — nieuwe confirm-mail kan opnieuw verstuurd worden
    return existing;
  }
  const sub: Subscription = {
    id: crypto.randomUUID(),
    email,
    target,
    status: "pending",
    confirmToken: token(),
    unsubscribeToken: token(),
    createdAt: new Date().toISOString(),
    confirmedAt: null,
  };
  subs.push(sub);
  await save(subs);
  return sub;
}

export async function confirmByToken(t: string): Promise<Subscription | null> {
  const subs = await load();
  const sub = subs.find((s) => s.confirmToken === t);
  if (!sub) return null;
  if (sub.status !== "confirmed") {
    sub.status = "confirmed";
    sub.confirmedAt = new Date().toISOString();
    await save(subs);
  }
  return sub;
}

export async function unsubscribeByToken(t: string): Promise<Subscription | null> {
  const subs = await load();
  const idx = subs.findIndex((s) => s.unsubscribeToken === t);
  if (idx === -1) return null;
  const removed = subs[idx];
  subs.splice(idx, 1);
  await save(subs);
  return removed;
}

export async function listConfirmedFor(
  target: SubscriptionTarget,
): Promise<Subscription[]> {
  const subs = await load();
  const k = targetKey(target);
  return subs.filter(
    (s) => s.status === "confirmed" && targetKey(s.target) === k,
  );
}

export async function listAllConfirmed(): Promise<Subscription[]> {
  const subs = await load();
  return subs.filter((s) => s.status === "confirmed");
}
