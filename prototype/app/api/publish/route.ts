import { NextResponse } from "next/server";
import { publish } from "@/lib/adapters";
import { PLATFORMS, validate, type Draft } from "@/lib/platforms";
import { addHistory } from "@/lib/store";

export async function POST(req: Request) {
  const { draft, platforms } = (await req.json()) as { draft: Draft; platforms: string[] };
  if (!platforms?.length) return NextResponse.json({ error: "Pick at least one platform" }, { status: 400 });

  // Re-validate on the server; never trust the browser.
  const results = await Promise.all(
    platforms.map(async (id) => {
      const p = PLATFORMS.find((x) => x.id === id);
      if (!p) return { platform: id, ok: false, error: "Unknown platform" };
      const errs = validate(p, draft);
      if (errs.length) return { platform: id, ok: false, error: errs.join("; ") };
      return publish(id, draft);
    })
  );

  await addHistory({ id: crypto.randomUUID(), at: new Date().toISOString(), draft, results });
  return NextResponse.json({ results });
}
