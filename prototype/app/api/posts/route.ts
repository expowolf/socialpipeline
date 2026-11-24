import { NextResponse } from "next/server";
import { PLATFORMS, validate, type Draft } from "@/lib/platforms";
import { publishPost, statusFrom } from "@/lib/runner";
import { store, type Post } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await store.list());
}

// Create a post: publish now, or schedule if scheduledAt is given.
export async function POST(req: Request) {
  const { draft, platforms, scheduledAt } = (await req.json()) as {
    draft: Draft;
    platforms: string[];
    scheduledAt?: string | null;
  };
  if (!platforms?.length) return NextResponse.json({ error: "Pick at least one platform" }, { status: 400 });

  // Validate up front so a scheduled post can't fail later for a fixable reason.
  const errors = platforms.flatMap((id) => {
    const p = PLATFORMS.find((x) => x.id === id);
    const errs = p ? validate(p, draft) : ["Unknown platform"];
    return errs.map((e) => `${p?.name ?? id}: ${e}`);
  });
  if (errors.length) return NextResponse.json({ error: errors.join("; ") }, { status: 400 });

  const post: Post = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    scheduledAt: null,
    draft,
    platforms,
    status: "scheduled",
    results: [],
  };

  if (scheduledAt) {
    const when = new Date(scheduledAt);
    if (isNaN(+when)) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    if (when.getTime() < Date.now() - 60_000) {
      return NextResponse.json({ error: "That time is in the past" }, { status: 400 });
    }
    post.scheduledAt = when.toISOString();
  } else {
    post.results = await publishPost(post);
    post.status = statusFrom(post.results);
  }

  await store.insert(post);
  return NextResponse.json(post);
}

// Cancel a scheduled post.
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const found = id ? await store.cancel(id) : false;
  return found
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Not found or already published" }, { status: 404 });
}
