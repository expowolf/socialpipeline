// Step 1 of an upload: the browser asks where to send a file.
// Supabase mode -> a signed URL so the browser uploads DIRECTLY to Supabase
// Storage (Vercel caps request bodies at ~4.5 MB, too small for video).
// Local mode -> our own PUT endpoint that writes to data/uploads.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { LOCAL_PREFIX } from "@/lib/media";

export const dynamic = "force-dynamic";
const BUCKET = "media";
// Supabase's free plan caps files at 50 MB. Raise this if you raise that.
const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 50);

export async function POST(req: Request) {
  const { name, type, size } = (await req.json()) as { name: string; type: string; size: number };
  if (!/^(image|video)\//.test(type ?? "")) {
    return NextResponse.json({ error: "Only photos and videos" }, { status: 400 });
  }
  if (!(size > 0) || size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Files must be under ${MAX_MB} MB` }, { status: 400 });
  }
  const safe = (name || "file").replace(/[^\w.\-]+/g, "_").slice(-80);
  const objectPath = `${crypto.randomUUID()}/${safe}`;

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const bucket = db.storage.from(BUCKET);
    const { data, error } = await bucket.createSignedUploadUrl(objectPath);
    if (error) return NextResponse.json({ error: `Storage: ${error.message}` }, { status: 500 });
    return NextResponse.json({
      mode: "supabase",
      uploadUrl: data.signedUrl,
      publicUrl: bucket.getPublicUrl(objectPath).data.publicUrl,
    });
  }
  const url = LOCAL_PREFIX + objectPath;
  return NextResponse.json({ mode: "local", uploadUrl: url, publicUrl: url });
}
