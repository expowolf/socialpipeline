"use client";
import { useMemo, useState } from "react";
import { Loader2, Send, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaDropzone, type UploadingItem } from "@/components/composer/media-dropzone";
import { PlatformChecklist } from "@/components/composer/platform-checklist";
import { CaptionEditor } from "@/components/composer/caption-editor";
import { SchedulePicker, scheduleToDate, type Schedule } from "@/components/composer/schedule-picker";
import { platformById, validate, type Draft, type MediaItem } from "@/lib/platforms";

function defaultSchedule(): Schedule {
  const d = new Date(Date.now() + 60 * 60_000); // an hour from now
  return { mode: "now", date: d, time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` };
}

export default function CreatePage() {
  const [uploads, setUploads] = useState<UploadingItem[]>([]);
  const [text, setText] = useState<Pick<Draft, "caption" | "captions">>({ caption: "" });
  const [selected, setSelected] = useState<string[]>(["instagram", "tiktok"]);
  const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);
  const [busy, setBusy] = useState(false);

  const draft: Draft = useMemo(
    () => ({
      ...text,
      media: uploads.map(({ url, kind, name, size, type }) => ({ url: url ?? "", kind, name, size: size ?? 0, type: type ?? "" }) as MediaItem),
    }),
    [text, uploads]
  );

  const uploading = uploads.some((u) => u.status === "uploading");
  const failedUpload = uploads.some((u) => u.status === "error");
  const problems = selected.flatMap((id) => validate(platformById(id)!, draft).map((e) => `${platformById(id)!.name}: ${e}`));
  const when = schedule.mode === "later" ? scheduleToDate(schedule) : null;
  const inPast = when !== null && when.getTime() < Date.now();

  const blocker =
    !selected.length ? "Pick at least one platform"
    : uploading ? "Waiting for uploads to finish…"
    : failedUpload ? "Remove the failed upload"
    : problems[0] ?? (inPast ? "Pick a time in the future" : null);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, platforms: selected, scheduledAt: when?.toISOString() ?? null }),
      });
      const post = await res.json();
      if (!res.ok) throw new Error(post.error);
      if (post.status === "scheduled") {
        toast.success(`Scheduled for ${new Date(post.scheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`);
      } else {
        const bad = post.results.filter((r: any) => !r.ok);
        if (bad.length) toast.error(`Failed on ${bad.map((r: any) => `${platformById(r.platform)?.name}: ${r.error}`).join("; ")}`);
        else toast.success(`Posted to ${post.results.length} platform${post.results.length > 1 ? "s" : ""}`);
      }
      setUploads([]);
      setText({ caption: "" });
      window.dispatchEvent(new Event("posts-changed"));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
            <CardDescription>Upload the photos or video you want to post.</CardDescription>
          </CardHeader>
          <CardContent>
            <MediaDropzone items={uploads} setItems={setUploads} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Caption</CardTitle>
            <CardDescription>What do you want to say with this post?</CardDescription>
          </CardHeader>
          <CardContent>
            <CaptionEditor draft={draft} setDraft={(d) => setText({ caption: d.caption, captions: d.captions })} selected={selected} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Post to</CardTitle>
            <CardDescription>{selected.length} of 9 selected</CardDescription>
          </CardHeader>
          <CardContent>
            <PlatformChecklist draft={draft} selected={selected} setSelected={setSelected} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>When</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SchedulePicker value={schedule} onChange={setSchedule} />
            <Button className="h-11 w-full text-base" disabled={busy || !!blocker} onClick={submit}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : schedule.mode === "now" ? <Send className="size-4" /> : <CalendarClock className="size-4" />}
              {schedule.mode === "now" ? "Post now" : "Schedule post"}
            </Button>
            {blocker && <p className="text-center text-xs text-muted-foreground">{blocker}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
