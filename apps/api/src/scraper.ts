import {
  generateCandidateUrls,
  parseWarpFriendsHtml,
  formatWeekLabel,
  getSundayOf,
} from "../../packages/shared/src/index";
import type { WeekData } from "../../packages/shared/src/index";

async function fetchUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; 40k-meta-analyzer/1.0; +https://github.com/thegrimor/warhammer-competitive-data)",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return res.text();
    return null;
  } catch {
    return null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function scrapeWeek(
  weekMonday: Date,
  delayMs = 300
): Promise<WeekData> {
  const candidates = generateCandidateUrls(weekMonday);
  const weekSunday = getSundayOf(weekMonday);
  const label = formatWeekLabel(weekMonday);

  if (delayMs > 0) await delay(delayMs);

  for (const url of candidates) {
    const html = await fetchUrl(url);
    if (!html) continue;

    const factions = parseWarpFriendsHtml(html);
    if (factions.length === 0) continue;

    return {
      meta: {
        weekStart: weekMonday.toISOString().split("T")[0],
        weekEnd: weekSunday.toISOString().split("T")[0],
        label,
        url,
        fetchedAt: new Date().toISOString(),
      },
      factions,
    };
  }

  return {
    meta: {
      weekStart: weekMonday.toISOString().split("T")[0],
      weekEnd: weekSunday.toISOString().split("T")[0],
      label,
      url: "",
      fetchedAt: new Date().toISOString(),
    },
    factions: [],
    error: `No data found after trying ${candidates.length} URL candidates`,
  };
}
