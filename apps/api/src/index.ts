import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getRecentWeekMondays } from "@40k/shared";
import type { WeekData, MetaResponse } from "@40k/shared";
import { scrapeWeek } from "./scraper";
import { TTLCache } from "./cache";

const app = new Hono();
const cache = new TTLCache<WeekData>(12 * 60 * 60 * 1000); // 12h TTL

app.use("*", cors({ origin: "*" }));

app.get("/api/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.get("/api/meta", async (c) => {
  const weeks = getRecentWeekMondays(8);
  const results: WeekData[] = [];

  for (let i = 0; i < weeks.length; i++) {
    const monday = weeks[i];
    const cacheKey = monday.toISOString().split("T")[0];

    let data = cache.get(cacheKey);
    if (!data) {
      // Stagger requests to avoid rate limiting
      data = await scrapeWeek(monday, i === 0 ? 0 : 350);
      if (data.factions.length > 0) {
        cache.set(cacheKey, data);
      }
    }
    results.push(data);
  }

  const response: MetaResponse = {
    weeks: results,
    lastUpdated: new Date().toISOString(),
  };

  return c.json(response, 200, {
    "Cache-Control": "public, max-age=3600",
  });
});

app.get("/api/meta/refresh", async (c) => {
  cache.clear();
  return c.json({ ok: true, message: "Cache cleared" });
});

const port = parseInt(process.env.PORT ?? "3001");
console.log(`API server running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
