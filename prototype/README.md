# SocialPipeline prototype

Write a post once, see right away whether each platform will accept it, then post to all of them in one click.

## What works
- An editor that counts characters correctly (an emoji counts as 1), plus an optional image or video URL.
- **Checks for each platform before you post:** X's 280 characters, Bluesky's 300, TikTok and YouTube needing a video, and so on.
- **Bluesky posts for real** (text, links, @mentions and images). Bluesky's API is free and needs no approval.
- Every other platform is **simulated** until you get its API approval or a unified API key.
- A history of what you posted and how each platform responded (saved in `data/history.json`).

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
- `app/api/publish/route.ts`: checks the post again on the server, then posts to every platform at once.
- `app/page.tsx`: the editor screen.

## Next steps (Benchmarks 2–3)
1. Real image uploads instead of pasting a URL (Cloudflare R2).
2. A unified API adapter (Upload-Post free tier) so X, Instagram, TikTok and the others post for real.
3. Scheduling: save the post with a time, and have a worker publish it then.
4. Logins, so other creators can connect their own accounts.

## Known issue
`npm audit` flags `zod`, a library that Bluesky's official SDK depends on (even the latest SDK).
It's low risk while the app only runs on your own computer. Re-check before going public.
