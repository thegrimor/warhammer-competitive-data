import {
  generateSlugCandidates,
  parseWarpFriendsHtml,
  formatWeekLabel,
  getSundayOf,
} from "../../../packages/shared/src/index";
import type { WeekData } from "../../../packages/shared/src/index";

const WP_API = "https://public-api.wordpress.com/rest/v1.1/sites/warpfriends.wordpress.com/posts/slug:";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "application/json",
};

// Returns [html_content, status_label, post_url]
async function fetchViaWpApi(slug: string): Promise<[string | null, string, string]> {
  try {
    const res = await fetch(`${WP_API}${slug}`, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [null, `HTTP ${res.status}`, ""];
    const data = await res.json();
    return [data.content ?? null, "200", data.URL ?? ""];
  } catch (e) {
    return [null, `ERR:${String(e).slice(0, 60)}`, ""];
  }
}

export async function scrapeWeek(weekMonday: Date, delayMs = 300): Promise<WeekData> {
  const weekSunday = getSundayOf(weekMonday);
  const label = formatWeekLabel(weekMonday);
  const weekStart = weekMonday.toISOString().split("T")[0];
  const weekEnd = weekSunday.toISOString().split("T")[0];

  if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

  const log: string[] = [];
  const slugs = generateSlugCandidates(weekMonday);

  for (const slug of slugs) {
    const [html, status, postUrl] = await fetchViaWpApi(slug);

    if (!html) {
      log.push(`${slug}→${status}`);
      continue;
    }

    const factions = parseWarpFriendsHtml(html);
    if (factions.length === 0) {
      log.push(`${slug}→200 no table`);
      continue;
    }

    return {
      meta: { weekStart, weekEnd, label, url: postUrl, fetchedAt: new Date().toISOString() },
      factions,
    };
  }

  return {
    meta: { weekStart, weekEnd, label, url: "", fetchedAt: new Date().toISOString() },
    factions: [],
    error: log.join(" | "),
  };
}
