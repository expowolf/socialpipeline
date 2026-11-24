// Dev-only file storage under data/uploads. Disabled when Supabase is set up.
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { localPath } from "@/lib/media";

export const dynamic = "force-dynamic";
const enabled = () => !process.env.SUPABASE_URL;

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
  ".heic": "image/heic", ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
};

type Ctx = { params: Promise<{ path: string[] }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!enabled()) return NextResponse.json({ error: "Disabled" }, { status: 404 });
  const file = localPath((await params).path.join("/"));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, Buffer.from(await req.arrayBuffer()));
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: Ctx) {
  if (!enabled()) return NextResponse.json({ error: "Disabled" }, { status: 404 });
  try {
    const file = localPath((await params).path.join("/"));
    const body = await fs.readFile(file);
    return new NextResponse(body, {
      headers: { "Content-Type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream" },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
