"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Film, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformBadge } from "@/components/platform-badge";
import { captionFor, platformById } from "@/lib/platforms";
import type { Post, PostStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATUS: Record<PostStatus, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-800" },
  publishing: { label: "Publishing", className: "bg-amber-100 text-amber-800" },
  published: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
  partial: { label: "Partly failed", className: "bg-orange-100 text-orange-800" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground line-through" },
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const postDate = (p: Post) => new Date(p.scheduledAt ?? p.createdAt);
const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function Thumb({ post, className }: { post: Post; className?: string }) {
  const m = post.draft.media[0];
  if (!m) return null;
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded bg-muted", className)}>
      {m.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.url} alt="" className="size-full object-cover" />
      ) : (
        <>
          <video src={m.url} className="size-full object-cover" muted preload="metadata" />
          <Film className="absolute left-0.5 top-0.5 size-3 text-white drop-shadow" />
        </>
      )}
    </span>
  );
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState(dayKey(today));

  const load = useCallback(() => fetch("/api/posts").then((r) => r.json()).then(setPosts).catch(() => {}), []);
  useEffect(() => {
    load();
    window.addEventListener("posts-changed", load);
    return () => window.removeEventListener("posts-changed", load);
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) map.set(dayKey(postDate(p)), [...(map.get(dayKey(postDate(p))) ?? []), p]);
    for (const list of map.values()) list.sort((a, b) => +postDate(a) - +postDate(b));
    return map;
  }, [posts]);

  // 6 weeks starting on the Sunday on/before the 1st.
  const cells = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay() + i));
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const dayPosts = byDay.get(picked) ?? [];
  const pickedDate = cells.find((d) => dayKey(d) === picked) ?? today;
  const upcoming = posts.filter((p) => p.status === "scheduled").length;

  async function cancel(id: string) {
    const r = await fetch(`/api/posts?id=${id}`, { method: "DELETE" });
    if (r.ok) toast.success("Post cancelled");
    else toast.error((await r.json()).error);
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <CardTitle className="flex-1">
            {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
            <span className="ml-2 text-sm font-normal text-muted-foreground">{upcoming} scheduled</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setPicked(dayKey(today)); }}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="size-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="size-4" /></Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
            {DAYS.map((d) => (
              <div key={d} className="bg-muted/50 py-1.5 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
            {cells.map((d) => {
              const k = dayKey(d);
              const list = byDay.get(k) ?? [];
              const isToday = k === dayKey(today);
              return (
                <button
                  key={k}
                  onClick={() => setPicked(k)}
                  className={cn(
                    "flex min-h-16 flex-col gap-1 bg-background p-1 text-left transition-colors hover:bg-muted/50 sm:min-h-24 sm:p-1.5",
                    d.getMonth() !== month.getMonth() && "bg-muted/30 text-muted-foreground",
                    k === picked && "ring-2 ring-inset ring-primary"
                  )}
                >
                  <span className={cn("grid size-6 place-items-center rounded-full text-xs", isToday && "bg-primary font-semibold text-primary-foreground")}>
                    {d.getDate()}
                  </span>
                  {list.slice(0, 2).map((p) => (
                    <span key={p.id} className={cn("hidden items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] sm:flex", STATUS[p.status].className)}>
                      {fmtTime(postDate(p))}
                    </span>
                  ))}
                  {list.length > 0 && (
                    <span className="flex gap-0.5 sm:hidden">
                      {list.slice(0, 3).map((p) => <span key={p.id} className={cn("size-1.5 rounded-full", STATUS[p.status].className.split(" ")[0])} />)}
                    </span>
                  )}
                  {list.length > 2 && <span className="hidden text-[10px] text-muted-foreground sm:block">+{list.length - 2} more</span>}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-20 lg:self-start">
        <CardHeader className="flex flex-row items-center space-y-0">
          <CardTitle className="flex-1 text-base">
            {pickedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </CardTitle>
          <Button size="sm" variant="outline" render={<Link href="/" />}><Plus className="size-4" />New</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {!dayPosts.length && <p className="py-6 text-center text-sm text-muted-foreground">No posts on this day.</p>}
          {dayPosts.map((p) => (
            <div key={p.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium tabular-nums">{fmtTime(postDate(p))}</span>
                <Badge className={cn("border-0", STATUS[p.status].className)}>{STATUS[p.status].label}</Badge>
                {p.status === "scheduled" && (
                  <Button variant="ghost" size="sm" className="ml-auto h-7 text-destructive" onClick={() => cancel(p.id)}>Cancel</Button>
                )}
              </div>
              <div className="flex gap-3">
                <Thumb post={p} className="size-14" />
                <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{p.draft.caption || "(no caption)"}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.platforms.map((id) => {
                  const r = p.results.find((x) => x.platform === id);
                  return (
                    <span key={id} title={r?.error ?? captionFor(p.draft, id)} className={cn("relative", r && !r.ok && "opacity-40")}>
                      {r?.url ? <a href={r.url} target="_blank" rel="noreferrer"><PlatformBadge id={id} /></a> : <PlatformBadge id={id} />}
                    </span>
                  );
                })}
              </div>
              {p.results.filter((r) => !r.ok).map((r) => (
                <p key={r.platform} className="text-xs text-destructive">{platformById(r.platform)?.name}: {r.error}</p>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
