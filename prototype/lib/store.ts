// Tiny JSON-file history so you can see what was posted. Swap for Postgres later.
import { promises as fs } from "fs";
import path from "path";
import type { PublishResult } from "./adapters";
import type { Draft } from "./platforms";

export interface HistoryEntry {
  id: string;
  at: string;
  draft: Draft;
  results: PublishResult[];
}

const FILE = path.join(process.cwd(), "data", "history.json");

export async function readHistory(): Promise<HistoryEntry[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function addHistory(e: HistoryEntry) {
  const all = await readHistory();
  all.unshift(e);
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all.slice(0, 200), null, 2));
}
