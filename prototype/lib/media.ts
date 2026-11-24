// Server-side: get the bytes of an uploaded file, wherever it lives.
import { promises as fs } from "fs";
import path from "path";

export const LOCAL_PREFIX = "/api/uploads/local/";
export const LOCAL_DIR = path.join(process.cwd(), "data", "uploads");

export function localPath(rel: string) {
  const full = path.resolve(LOCAL_DIR, rel);
  if (!full.startsWith(LOCAL_DIR + path.sep)) throw new Error("Bad path"); // block ../ tricks
  return full;
}

export async function loadMedia(url: string): Promise<Uint8Array> {
  if (url.startsWith(LOCAL_PREFIX)) {
    return new Uint8Array(await fs.readFile(localPath(decodeURIComponent(url.slice(LOCAL_PREFIX.length)))));
  }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Could not download media (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}
