# SocialPipeline prototype

Write a post once, see right away whether each platform will accept it, then post to all of them in one click.

## What works
- An editor that counts characters correctly (an emoji counts as 1), plus an optional image or video URL.
- **Checks for each platform before you post:** X's 280 characters, Bluesky's 300, TikTok and YouTube needing a video, and so on.
- **Bluesky posts for real** (text, links, @mentions and images). Bluesky's API is free and needs no approval.
- Every other platform is **simulated** until you get its API approval or a unified API key.
- **Scheduling:** pick a date and time. Posts go out when they're due, and you can cancel a scheduled post.
- **Calendar:** a month view with a status icon on each day (🕒 scheduled, ✅ published, ⚠️ partly failed, ❌ failed). Tap a day to see its posts.
- **Storage:** Supabase when its keys are set, otherwise a local `data/posts.json` file.

## Run it
```bash
cd prototype
npm install
cp .env.example .env.local   # then add your Bluesky handle + App Password
npm run dev                  # open http://localhost:3000
```
Create the Bluesky App Password at bsky.app → Settings → Privacy and security → App passwords.
Never use your main Bluesky password here.

## How it's organized
- `lib/platforms.ts`: each platform's rules and the validation checks.
- `lib/adapters.ts`: one publish function per platform, all with the same shape.
- `lib/store.ts`: storage (Supabase, or a local file). Claiming a due post is a single safe database step, so a post can't go out twice.
- `lib/runner.ts`: publishes the posts that are due.
- `app/api/posts`: create (post now or schedule), list and cancel.
- `app/api/cron`: publishes due posts. The open page calls it every 30 seconds; on Vercel, a cron service calls it.
- `app/components/Calendar.tsx`: the month view.
- `supabase/schema.sql`: run once in the Supabase SQL Editor to create the `posts` table.
- `app/page.tsx`: the editor screen.

## Next steps (Benchmarks 2–3)
1. Real image uploads instead of pasting a URL (Cloudflare R2).
2. A unified API adapter (Upload-Post free tier) so X, Instagram, TikTok and the others post for real.
3. Deploy to Vercel. Add the Supabase keys and `CRON_SECRET` as environment variables, then point a cron service at `/api/cron` every minute.
   Vercel's free plan only runs its own cron jobs once a day, so use cron-job.org (free), or Vercel Pro.
4. Logins, so other creators can connect their own accounts.

## Known issue
`npm audit` flags `zod`, a library that Bluesky's official SDK depends on (even the latest SDK).
It's low risk while the app only runs on your own computer. Re-check before going public.
