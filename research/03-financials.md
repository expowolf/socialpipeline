# Financials
**Your income:** $17/hr × 26–29 hrs/week ≈ $1,915–$2,135/month before tax. Saving 15–20% of it is **$287–$427/month**.
**Assumptions:** users pay ~$12/month, each connects 4–5 accounts, and the shortcut posting API costs about $2 per user per month (Upload-Post's tiers).

## Key prices (the ones marked (V) were checked against a source)
- Apple Developer $99/yr (V) · Google Play $25 one-time (V) · domain ~$12/yr
- Cloudflare R2 storage $0.015/GB, with **free downloads (egress)** (V). Avoid S3 for video, because S3 charges ~$0.09 for every GB downloaded.
- Vercel Pro $20/mo, Supabase Pro $25/mo, Resend free tier, Stripe 2.9% + $0.30 per charge (all unverified)
- Shortcut posting APIs: Upload-Post free → $24 (5 profiles) → $147 (75) (V) · Late/Zernio free → $19 · Ayrshare $149+ (**3–6x more per profile**)
- X API: pay per post. ⚠️ The two agents disagree: one found ~$0.01 per post, the other $0.015, and $0.20 when the post has a link. Check docs.x.com.
- Freelancers: $35–45/hr (marketplace median) up to $75–178/hr (experienced). Agencies: $170–285/hr.

## Three scenarios
| | A) Build it yourself + shortcut API | B) Build it yourself, connect every platform directly | C) Hire a freelancer |
|---|---|---|---|
| Your time | 300–500 hrs | 800–1,200 hrs | Little |
| Cash to start | $400–800 | $500–1,000 | $18k–60k (agency $80k+) |
| Monthly cost, 0 users | ~$70 | ~$70 | ~$600–2,100 (includes a developer on retainer) |
| Monthly cost, 100 users | ~$360 (revenue $1,200) | ~$230 | ~$900–2,400 |
| Monthly cost, 1,000 users | ~$2,900 (revenue $12k) | ~$1,300 | ~$3,400–4,900 |
| Months of saving needed | **2–3.5** | 3–6 | 4–18 **years** |

## Break-even (Scenario A)
- Profit per user per month after costs: ~$6.30 at $9, **~$9.25 at $12**, ~$16 at $19.
- **Covering the app's running costs:** ~10 users at $12/month.
- **Replacing your $2,000/month paycheck:** ~225 users at $12/month, or ~130 at $19.
- **Not modeled:** user churn (often 5–10% of users cancel each month) and the cost of finding new users.

## Cost-cutting tips
1. Start with Scenario A on Upload-Post's or Late's free tier.
2. Charge at least $12/month. At $9 you keep very little.
3. Launch on the web only, skip Apple's $99/year, and use a PWA (a website that installs like an app).
4. Use R2 for storage and delete each upload once it has posted.
5. Stay on the free tiers until you have paying users, and use Supabase's login instead of Clerk.
6. Make X posts a paid add-on.
7. AI captions cost under $1 per 1,000 captions (unverified), so add them as a feature.
8. Use a template generator for the legal docs now and have a lawyer review them later. Avoid agencies.
