"use client";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PlatformBadge } from "@/components/platform-badge";
import { PLATFORMS, validate, type Draft } from "@/lib/platforms";
import { cn } from "@/lib/utils";

export function PlatformChecklist({
  draft,
  selected,
  setSelected,
}: {
  draft: Draft;
  selected: string[];
  setSelected: (ids: string[]) => void;
}) {
  const toggle = (id: string, on: boolean) =>
    setSelected(on ? [...selected, id] : selected.filter((x) => x !== id));
  const all = selected.length === PLATFORMS.length;

  return (
    <div className="space-y-1">
      <label className="flex cursor-pointer items-center gap-3 px-2 pb-2 text-sm text-muted-foreground">
        <Checkbox checked={all} onCheckedChange={(c) => setSelected(c ? PLATFORMS.map((p) => p.id) : [])} />
        Select all
      </label>
      {PLATFORMS.map((p) => {
        const on = selected.includes(p.id);
        const errs = validate(p, draft);
        return (
          <label
            key={p.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-2 py-2 transition-colors",
              on ? "border-primary/30 bg-primary/5" : "border-transparent hover:bg-muted/60"
            )}
          >
            <Checkbox checked={on} onCheckedChange={(c) => toggle(p.id, !!c)} />
            <PlatformBadge id={p.id} />
            <span className="flex-1 text-sm font-medium">{p.name}</span>
            {!p.live && <Badge variant="outline" className="text-[10px]">simulated</Badge>}
            {on &&
              (errs.length ? (
                <span title={errs.join(" · ")} className="flex items-center gap-1 text-xs text-destructive">
                  <CircleAlert className="size-4" />
                  <span className="hidden max-w-36 truncate sm:inline">{errs[0]}</span>
                </span>
              ) : (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ))}
          </label>
        );
      })}
    </div>
  );
}
