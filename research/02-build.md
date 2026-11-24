# How to build it (as of Nov 2026)

**How sure we are:** (V) means the agent confirmed it against official docs, through search results. (U) means it hasn't been checked, so verify it before you rely on it.

## Platform posting APIs
| Platform | Posting types | Approval needed? | Cost / limits | Difficulty |
|---|---|---|---|---|
| Instagram | Image, Reels, carousel, Stories (no text-only) | Meta app review + business verification; account must be Business/Creator (U) | Free; up to 100 posts per 24h. Check the live limit through the API instead of assuming a number (V) | Hard |
| Facebook Pages | Text, image, video, Reels | Meta app review (U); Pages only, not personal profiles | Free | Medium-hard |
| Threads | Text, image, video, carousel (U) | Meta app review (U) | Free, ~250 posts per 24h (U) | Medium |
| TikTok | Video, photo | App review **plus** an audit. Until it passes, posts are **private only**, for up to 5 users a day (V) | Free | **Hardest** |
| YouTube Shorts | Video | Until a compliance audit passes, uploads are **private only** (V) | Free; daily quota limits uploads, so apply for more early | Hard |
| X / Twitter | Text, image, video | None | Pay per post: ~$0.015 per post, **$0.20 per post with a link** (V, from third-party summaries; check docs.x.com) | Easy to build, costly to run |
| LinkedIn | Text, image, video, document | Slow access application; needs a company Page and a business email (V) | Free; ~500 calls/day at the starting tier | Hard |
| Pinterest | Image/video Pins | Starts on limited trial access; a demo is needed to upgrade (U) | Free | Medium |
| Bluesky | Text, image, video | None | Free | Easy |

**The key point: approvals, not code, are the bottleneck.** Apply to every platform on day 1.

## Components
- **Frontend:** a Next.js web app first; a mobile app with React Native/Expo later.
- **Backend:** Node/TypeScript, plus a separate "worker" process that does the posting. Each platform gets its own adapter.
- **Auth:** a login provider (Clerk or Supabase) for users, and OAuth to connect their social accounts. Store the platform tokens encrypted and refresh them on a schedule. Expired tokens are the #1 cause of failed posts.
- **Media:** Cloudflare R2 or S3 for files, plus video transcoding (Mux or FFmpeg) to make a version of each video for each platform.
- **Scheduler:** Postgres plus a job queue (BullMQ, Inngest or Trigger.dev) that retries failures, never double-posts, and tracks status per platform.
- **Payments:** Stripe Billing. **Analytics:** PostHog. **Errors:** Sentry.

## Shortcuts: build vs buy
| Option | Reported price | Notes |
|---|---|---|
| Ayrshare | ~$149/mo entry | Most mature; already has the platform approvals |
| Upload-Post | Free tier; paid from ~$24/mo | Cheapest; price is what the company reports |
| Late (getlate.dev, maybe renamed Zernio) | Sources conflict | Check current pricing |
| Postiz (open source) | Free to self-host | You still need your own platform approvals. Its license (AGPL) means you must publish any changes you make if you run it as a service |

**Recommendation:** for the MVP, use a shortcut API so you can launch before your own approvals come through. Set the code up so you can swap it out for each platform once your own approval passes.

## MVP and timeline (solo developer; the agent's estimate)
- Weeks 1–2: login, database, uploads; **send every approval application**
- Weeks 3–4: scheduler and the first platforms
- Weeks 5–6: post editor, calendar, Stripe
- Weeks 7–8: video handling, Meta platforms, legal pages
- Weeks 9–12: approval rounds and a beta

About **8–10 weeks** using a shortcut API, or **3–5 months** connecting every platform directly.

## Legal
- A privacy policy and terms of service. Every platform's review requires them.
- A way for users to delete their data (Meta requires one).
- TikTok's posting rules: users must give consent and see disclosures, and posts can't be made automatically.
- Meta and LinkedIn want a verified business, a domain and a business email, so register these early.

## Top risks
1. A platform approval is delayed or rejected.
2. Platforms change their APIs or rules. Even the official docs disagree on some limits.
3. Expired tokens make scheduled posts fail without anyone noticing.
4. X costs climb with every post that has a link.
5. You depend on the shortcut provider's prices and uptime.
