# 40k Meta Analyzer

Dashboard that scrapes [WarpFriends](https://warpfriends.wordpress.com) to show Warhammer 40k win rates by army and subfaction across the last 8 weeks.

## Structure

```
apps/
  web/      Vite + React frontend (port 5173)
  api/      Node.js + Hono backend (port 3001)
packages/
  shared/   TypeScript types + WarpFriends parser + URL generator
```

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The API starts on port 3001 and the Vite dev server proxies `/api/*` to it automatically.

On first load the API scrapes the last 8 weeks from WarpFriends (with 350ms delay between requests). Results are cached in memory for 12 hours.

## Deploy

**Frontend** → Netlify / Vercel  
Set `VITE_API_URL` to your API base URL if deploying separately.

**Backend** → Railway / Render (free tier)  
Set `PORT` env var if needed (defaults to 3001).

## How it works

1. `packages/shared/urls.ts` — generates candidate WarpFriends URLs for each week using the slug pattern (`40k-meta-stats-from-{month}-{day}-{year}`) with slug and post date offsets to handle publish-day variation
2. `packages/shared/parser.ts` — extracts the pipe-delimited markdown table from the post HTML, auto-detects column order, distinguishes subfaction rows
3. `apps/api` — fetches, parses, and caches data; exposes `GET /api/meta`
4. `apps/web` — React dashboard with army selector, toggleable week pills, 4 metric cards, and 3 tabs (Trend chart, Subfactions, Meta ranking)
