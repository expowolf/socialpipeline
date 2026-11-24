"use client";
import { useEffect } from "react";

// While any page is open, publish due posts every 30s. On Vercel, an external
// cron calls /api/cron too, so posts go out even with every tab closed.
export function CronTicker() {
  useEffect(() => {
    const tick = () =>
      fetch("/api/cron")
        .then((r) => (r.ok ? r.json() : null))
        .then((r) => r?.published && window.dispatchEvent(new Event("posts-changed")))
        .catch(() => {});
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  return null;
}
