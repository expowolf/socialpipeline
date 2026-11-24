"use client";
import { useState } from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Schedule {
  mode: "now" | "later";
  date: Date; // local date (time ignored)
  time: string; // "HH:mm" local
}

/** Combine the picked local date + time into one Date. */
export function scheduleToDate(s: Schedule) {
  const [h, m] = s.time.split(":").map(Number);
  const d = new Date(s.date);
  d.setHours(h, m, 0, 0);
  return d;
}

export function SchedulePicker({ value, onChange }: { value: Schedule; onChange: (s: Schedule) => void }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="space-y-3">
      <Tabs value={value.mode} onValueChange={(mode) => onChange({ ...value, mode: mode as Schedule["mode"] })}>
        <TabsList className="w-full">
          <TabsTrigger value="now" className="flex-1">Post now</TabsTrigger>
          <TabsTrigger value="later" className="flex-1">Schedule</TabsTrigger>
        </TabsList>
      </Tabs>

      {value.mode === "later" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger render={<Button variant="outline" className="flex-1 justify-start font-normal" />}>
                <CalendarIcon className="size-4" />
                {value.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={value.date}
                  onSelect={(d) => { if (d) { onChange({ ...value, date: d }); setOpen(false); } }}
                  disabled={{ before: today }}
                />
              </PopoverContent>
            </Popover>
            <div className="relative w-36">
              <Clock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="time"
                value={value.time}
                onChange={(e) => onChange({ ...value, time: e.target.value })}
                className="pl-8"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Times are in your time zone ({tz}).</p>
        </div>
      )}
    </div>
  );
}
