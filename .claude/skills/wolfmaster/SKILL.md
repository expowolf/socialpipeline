---
name: wolfmaster
description: Startup/app idea research orchestrator. Use when the user runs /wolfmaster or asks to research an app or business idea — competitors (features, pricing, target audience, marketing), how to build it (components, APIs, architecture, MVP), and financials (startup + monthly costs, break-even, savings plan based on the user's income). Launches parallel research agents and compiles one report.
---

# Wolfmaster: app idea research

## 1. Get the inputs (ask only for what's missing)
- **The idea**: one sentence on what the app does and who it's for.
- **Known competitors**: optional.
- **Budget context**: hourly wage × hours/week. Monthly gross = wage × hours × 4.33.
  Default for this user: $17/hr × 26–29 hrs/wk ≈ $1,915–$2,135/mo gross.

## 2. Launch 3 research agents in parallel (background, cheaper model, to limit credits)
1. **Competitors**: 6–10 rivals. For each: features, current pricing tiers, target audience,
   marketing (positioning, channels), and review complaints. Ends with a comparison table
   and a "gaps / opportunities" section.
2. **Build**: required components (frontend, backend, auth, storage, queues, payments,
   analytics), the third-party APIs involved with their review requirements, limits and costs,
   build-vs-buy shortcuts, MVP scope, a solo-dev timeline, and legal items.
3. **Financials**: real current prices for each component. Three scenarios (DIY with a shortcut,
   DIY from scratch, hire someone), each with a one-time cost and a monthly cost at 0, 100 and
   1,000 users, plus break-even and months of saving at 15–20% of the user's income.

Each agent cites URLs, gives dates for prices, and stays under ~1,200 words.

## 3. Compile
Write `research/<idea-slug>-report.md` with these sections: Summary (5 bullets) → Competitors →
How to build → Financials → Biggest risks → Recommended next 3 steps.
Flag any number that couldn't be checked against a source.

## 4. Teach, don't just tell
The user wants to learn. End with 2–3 short questions that test whether they understood
the key tradeoffs (e.g. "Why might a unified API beat direct integrations for an MVP?").
