import {
  generateCandidateUrls,
  parseWarpFriendsHtml,
  formatWeekLabel,
  getSundayOf,
} from "../../../packages/shared/src/index";
import type { WeekData } from "../../../packages/shared/src/index";

// Returns [html, statusOrError]
async function fetchUrl(url: string): Promise<[string | null, string]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) return [await res.text(), `${res.status}`];
    return [null, `HTTP ${res.status}`];
  } catch (e) {
    return [null, `ERR: ${String(e).slice(0, 80)}`];
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

  const log: string[] = [];

  for (const url of candidates) {
    const [html, status] = await fetchUrl(url);
    // Extract last path segment for concise logging
    const slug = url.split("/").filter(Boolean).pop() ?? url;

    if (!html) {
      log.push(`${slug}→${status}`);
      continue;
    }

    const factions = parseWarpFriendsHtml(html);
    if (factions.length === 0) {
      log.push(`${slug}→200 but no table`);
      continue;
    }

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
    error: log.join(" | "),
  };
}
