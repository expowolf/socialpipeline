// Publishes due posts. Called every ~minute by: the open page (locally), or an
// external cron hitting this URL on Vercel. If CRON_SECRET is set, callers
// must send "Authorization: Bearer <CRON_SECRET>".
import { NextResponse } from "next/server";
import { runDue } from "@/lib/runner";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const done = await runDue();
  return NextResponse.json({ published: done.length, done });
}
