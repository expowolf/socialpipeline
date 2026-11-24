# SocialPipeline prototype

Write a post once, see right away whether each platform will accept it, then post to all of them in one click.

## What works
- **Create screen:** a nav bar, then:
  - a drag-and-drop **uploader** for photos and video from your computer, with progress bars and previews
  - a **caption** box, with an optional "customize per platform" caption for each platform
  - a **checklist of platforms**, with a live OK or error for each one (for example "Videos only" on TikTok, or "312/300 characters" on Bluesky)
  - a **Post now / Schedule** switch, with a date picker and a time box
- **Calendar screen:** a month view of every post, color-coded by status. Click a day to see its posts, with thumbnails and per-platform results, and cancel any that are still scheduled.
- **Bluesky posts for real** (text, links and up to 4 photos under 1 MB each). Every other platform is **simulated** until it's approved or a unified API key is added.
- **Storage:** Supabase (posts in Postgres, files in Storage) when its keys are set. Otherwise posts go in `data/posts.json` and files in `data/uploads/`.
- **UI:** shadcn/ui (Base UI) + Tailwind v4. 21st.dev's registry needs an account login; swap in its community components later if you want.

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
- `app/api/uploads`: gives the browser a place to upload each file. With Supabase, files go straight from the browser to Storage, which avoids Vercel's ~4.5 MB request limit.
- `components/composer/*`: the Create screen pieces. `app/calendar/page.tsx`: the calendar.
- `supabase/schema.sql`: run once in the Supabase SQL Editor. It creates the `posts` table and the public `media` storage bucket.
- `app/page.tsx`: the editor screen.

## Next steps (Benchmarks 2–3)
1. A unified API adapter (Upload-Post free tier) so X, Instagram, TikTok and the others post for real.
2. Deploy to Vercel. Add the Supabase keys and `CRON_SECRET` as environment variables, then point a cron service at `/api/cron` every minute.
   Vercel's free plan only runs its own cron jobs once a day, so use cron-job.org (free), or Vercel Pro.
3. Logins, so other creators can connect their own accounts.

## Known issues
- The Supabase upload path hasn't been tested against a real project yet. The local path has been tested in a browser.
- Supabase's free plan caps files at 50 MB (`MAX_UPLOAD_MB`). Long 4K videos will need Pro or compression.
- `npm audit` flags `zod`, a library that Bluesky's official SDK depends on (even the latest SDK).
It's low risk while the app only runs on your own computer. Re-check before going public.
