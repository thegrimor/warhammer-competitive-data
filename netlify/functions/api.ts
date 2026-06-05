import type { Handler } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { getRecentWeekMondays } from "@40k/shared";
import type { WeekData, MetaResponse } from "@40k/shared";
import { scrapeWeek } from "../../apps/api/src/scraper";
import { TTLCache } from "../../apps/api/src/cache";

// In-memory cache works within warm Lambda invocations
const memCache = new TTLCache<WeekData>(12 * 60 * 60 * 1000);

async function blobGet(key: string): Promise<WeekData | null> {
  try {
    return await getStore("meta-cache").get(key, { type: "json" });
  } catch {
    return null;
  }
}

async function blobSet(key: string, data: WeekData): Promise<void> {
  try {
    await getStore("meta-cache").set(key, JSON.stringify(data), { ttl: 86400 });
  } catch {
    // ignore — blobs not available in local dev
  }
}

export const handler: Handler = async (event) => {
  const path = event.path || "";

  if (path.includes("/refresh")) {
    memCache.clear();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: "Cache cleared" }),
    };
  }

  if (path.includes("/health")) {
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, ts: new Date().toISOString() }),
    };
  }

  // GET /api/meta — fetch all 8 weeks in parallel with 150ms stagger
  const weekMondays = getRecentWeekMondays(8);

  const results = await Promise.all(
    weekMondays.map(async (monday, i) => {
      const key = monday.toISOString().split("T")[0];

      // 1. check in-memory cache (warm invocation)
      let data = memCache.get(key);
      if (data) return data;

      // 2. check Netlify Blobs (persists across cold starts)
      const blob = await blobGet(key);
      if (blob) {
        memCache.set(key, blob);
        return blob;
      }

      // 3. scrape — stagger 150ms per week to avoid rate limiting
      await new Promise((r) => setTimeout(r, i * 150));
      data = await scrapeWeek(monday, 0);

      if (data.factions.length > 0) {
        memCache.set(key, data);
        await blobSet(key, data);
      }

      return data;
    })
  );

  const response: MetaResponse = {
    weeks: results,
    lastUpdated: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(response),
  };
};
