// Post storage. With SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set, posts live
// in Supabase (needed on Vercel, whose disk is read-only). Without them, a
// local JSON file in data/ is used so you can develop offline.
import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { PublishResult } from "./adapters";
import type { Draft } from "./platforms";

export type PostStatus = "scheduled" | "publishing" | "published" | "partial" | "failed" | "cancelled";

export interface Post {
  id: string;
  createdAt: string;
  scheduledAt: string | null; // ISO UTC; null = posted immediately
  draft: Draft;
  platforms: string[];
  status: PostStatus;
  results: PublishResult[];
}

export interface Store {
  list(): Promise<Post[]>;
  insert(p: Post): Promise<void>;
  /** Atomically flip due "scheduled" posts to "publishing" and return them. */
  claimDue(now: Date): Promise<Post[]>;
  finish(id: string, status: PostStatus, results: PublishResult[]): Promise<void>;
  /** Returns false if the post wasn't scheduled (already sent or missing). */
  cancel(id: string): Promise<boolean>;
}

// ---------- Supabase ----------
type Row = {
  id: string; created_at: string; scheduled_at: string | null; draft: Draft;
  platforms: string[]; status: PostStatus; results: PublishResult[];
};
const fromRow = (r: Row): Post => ({
  id: r.id, createdAt: r.created_at, scheduledAt: r.scheduled_at, draft: r.draft,
  platforms: r.platforms, status: r.status, results: r.results,
});

function supabaseStore(url: string, key: string): Store {
  // Service-role key: server only. Never send it to the browser.
  const db = createClient(url, key, { auth: { persistSession: false } });
  const check = <T>(res: { data: T; error: { message: string } | null }) => {
    if (res.error) throw new Error(`Supabase: ${res.error.message}`);
    return res.data;
  };
  return {
    async list() {
      const rows = check(await db.from("posts").select("*").order("created_at", { ascending: false }).limit(500));
      return (rows as Row[]).map(fromRow);
    },
    async insert(p) {
      check(await db.from("posts").insert({
        id: p.id, created_at: p.createdAt, scheduled_at: p.scheduledAt, draft: p.draft,
        platforms: p.platforms, status: p.status, results: p.results,
      }));
    },
    async claimDue(now) {
      // UPDATE ... WHERE status='scheduled' is atomic in Postgres: if two runs
      // overlap, each row is claimed by only one of them.
      const rows = check(await db.from("posts").update({ status: "publishing" })
        .eq("status", "scheduled").lte("scheduled_at", now.toISOString()).select("*"));
      return (rows as Row[]).map(fromRow);
    },
    async finish(id, status, results) {
      check(await db.from("posts").update({ status, results }).eq("id", id));
    },
    async cancel(id) {
      const rows = check(await db.from("posts").update({ status: "cancelled" })
        .eq("id", id).eq("status", "scheduled").select("id"));
      return (rows as unknown[]).length > 0;
    },
  };
}

// ---------- Local JSON file (dev only) ----------
function fileStore(): Store {
  const FILE = path.join(process.cwd(), "data", "posts.json");
  const read = async (): Promise<Post[]> => {
    try { return JSON.parse(await fs.readFile(FILE, "utf8")); }
    catch (e: any) { if (e?.code === "ENOENT") return []; throw e; }
  };
  const write = async (posts: Post[]) => {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(posts.slice(0, 500), null, 2));
  };
  return {
    list: read,
    async insert(p) { const all = await read(); all.unshift(p); await write(all); },
    async claimDue(now) {
      const all = await read();
      const due = all.filter((p) => p.status === "scheduled" && p.scheduledAt && new Date(p.scheduledAt) <= now);
      due.forEach((p) => (p.status = "publishing"));
      if (due.length) await write(all);
      return due;
    },
    async finish(id, status, results) {
      const all = await read();
      const p = all.find((x) => x.id === id);
      if (p) Object.assign(p, { status, results });
      await write(all);
    },
    async cancel(id) {
      const all = await read();
      const p = all.find((x) => x.id === id);
      if (p?.status !== "scheduled") return false;
      p.status = "cancelled";
      await write(all);
      return true;
    },
  };
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
export const store: Store =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? supabaseStore(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : fileStore();
