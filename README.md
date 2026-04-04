# FuelWeek — AI-Powered Weekly Meal Planner for Gym Users

FuelWeek generates personalised 7-day meal plans based on your InBody body-composition data. Powered by the Grok AI (xAI), it calculates precise calorie and protein targets from your BMR and skeletal muscle mass, then produces full meal plans, recipes, and a grouped shopping list — all stored locally in your browser with zero backend setup.

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Add your Grok API key
cp .env.local.example .env.local
# Edit .env.local and set: XAI_API_KEY=your_xai_api_key_here

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the repo in [vercel.com/new](https://vercel.com/new).
3. Add the environment variable `XAI_API_KEY` in **Project → Settings → Environment Variables**.
4. Deploy — done. No database, no serverless DB config needed.

---

## Free vs Pro

| Feature | Free | Pro ($5/month) |
|---|---|---|
| Today's single recipe | 2/day | Unlimited |
| Full 7-day meal plan | — | ✓ |
| Auto shopping list | — | ✓ |
| InBody trend chart | ✓ | ✓ |
| Macro targets | ✓ | ✓ |

> **MVP note:** Pro status is stored in `localStorage` for now. Real payment (Stripe etc.) can replace the `UpgradePrompt` component without touching anything else.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| UI primitives | shadcn/ui + Radix UI |
| AI | Grok `grok-3-mini` via xAI API |
| AI SDK | `openai` npm package (OpenAI-compatible) |
| Persistence | `localStorage` (no database) |
| Deployment | Vercel |

---

## How to Get a Grok API Key

1. Go to [console.x.ai](https://console.x.ai)
2. Sign in with your X (Twitter) account.
3. Navigate to **API Keys** → **Create new key**.
4. Copy the key and paste it in `.env.local` as `XAI_API_KEY`.

---

## Project Structure

```
app/
  layout.tsx              Root layout + bottom nav
  page.tsx                Dashboard
  inbody/page.tsx         InBody input & trend chart
  meal-plan/page.tsx      Weekly meal plan generator
  shopping/page.tsx       Shopping list
  api/
    generate-meals/       POST → full 7-day WeeklyPlan (Grok)
    generate-recipe/      POST → single Meal (Grok)
components/
  BottomNav.tsx
  InBodyForm.tsx
  InBodyHistory.tsx       Pure SVG trend chart
  MealPlanGrid.tsx
  MealCard.tsx
  MacroBar.tsx
  ShoppingList.tsx
  UsageCounter.tsx
  UpgradePrompt.tsx
lib/
  types.ts                Shared TypeScript interfaces
  constants.ts
  storage.ts              localStorage helpers (SSR-safe)
  utils.ts                cn() helper
```
