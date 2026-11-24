import { publish } from "./adapters";
import { captionFor, platformById, validate, type Draft } from "./platforms";
import { store, type PostStatus } from "./store";

export async function publishPost(post: { platforms: string[]; draft: Draft }) {
  return Promise.all(
    post.platforms.map(async (id) => {
      const p = platformById(id);
      if (!p) return { platform: id, ok: false, error: "Unknown platform" };
      const errs = validate(p, post.draft);
      if (errs.length) return { platform: id, ok: false, error: errs.join("; ") };
      return publish(id, { caption: captionFor(post.draft, id), media: post.draft.media });
    })
  );
}

export function statusFrom(results: { ok: boolean }[]): PostStatus {
  const ok = results.filter((r) => r.ok).length;
  return ok === results.length ? "published" : ok === 0 ? "failed" : "partial";
}

// Publish every scheduled post whose time has come.
export async function runDue(now = new Date()) {
  const claimed = await store.claimDue(now);
  return Promise.all(
    claimed.map(async (p) => {
      const results = await publishPost(p);
      const status = statusFrom(results);
      await store.finish(p.id, status, results);
      return { id: p.id, status, results };
    })
  );
}
