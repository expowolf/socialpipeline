"use client";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlatformBadge } from "@/components/platform-badge";
import { charCount, platformById, type Draft } from "@/lib/platforms";
import { cn } from "@/lib/utils";

function Counter({ text, max }: { text: string; max: number }) {
  const n = charCount(text);
  return <span className={cn("text-xs tabular-nums", n > max ? "font-medium text-destructive" : "text-muted-foreground")}>{n}/{max}</span>;
}

export function CaptionEditor({
  draft,
  setDraft,
  selected,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  selected: string[];
}) {
  const custom = draft.captions !== undefined;
  // The tightest limit among selected platforms that use the main caption.
  const shared = selected.filter((id) => draft.captions?.[id] === undefined);
  const limit = Math.min(...shared.map((id) => platformById(id)?.maxChars ?? Infinity), Infinity);

  const setOverride = (id: string, text: string) =>
    setDraft({ ...draft, captions: { ...draft.captions, [id]: text } });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="caption">Caption</Label>
          {limit !== Infinity && <Counter text={draft.caption} max={limit} />}
        </div>
        <Textarea
          id="caption"
          value={draft.caption}
          onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
          placeholder="What do you want to say about this post? #hashtags @mentions"
          className="min-h-32 resize-y text-base"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <Label htmlFor="custom">Customize per platform</Label>
          <p className="text-xs text-muted-foreground">Write a different caption for specific platforms.</p>
        </div>
        <Switch
          id="custom"
          checked={custom}
          onCheckedChange={(on) => setDraft({ ...draft, captions: on ? {} : undefined })}
        />
      </div>

      {custom &&
        selected.map((id) => {
          const p = platformById(id)!;
          const value = draft.captions?.[id] ?? draft.caption;
          return (
            <div key={id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <PlatformBadge id={id} className="size-5" />
                <span className="flex-1 text-sm font-medium">{p.name}</span>
                <Counter text={value} max={p.maxChars} />
              </div>
              <Textarea value={value} onChange={(e) => setOverride(id, e.target.value)} className="min-h-20" />
            </div>
          );
        })}
    </div>
  );
}
