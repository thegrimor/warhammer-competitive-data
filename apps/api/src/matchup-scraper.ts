const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

// URLs to probe on 40kstats.goonhammer.com
const CANDIDATE_URLS = [
  "https://40kstats.goonhammer.com",
  "https://40kstats.goonhammer.com/matchups",
  "https://40kstats.goonhammer.com/army-performance",
];

export interface DebugResult {
  url: string;
  status: number;
  contentType: string;
  snippet: string;
  tableCount: number;
  tableHeaders: string[][];
}

async function probeUrl(url: string): Promise<DebugResult> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();

    const tableMatches = body.match(/<table[\s\S]*?<\/table>/gi) ?? [];
    const tableHeaders: string[][] = tableMatches.slice(0, 5).map((t) => {
      const headerCells = t.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) ?? [];
      return headerCells.slice(0, 10).map((h) =>
        h.replace(/<[^>]+>/g, "").trim().slice(0, 40)
      );
    });

    return {
      url,
      status: res.status,
      contentType,
      snippet: body.replace(/\s+/g, " ").slice(0, 500),
      tableCount: tableMatches.length,
      tableHeaders,
    };
  } catch (e) {
    return {
      url,
      status: 0,
      contentType: "",
      snippet: `ERR: ${String(e).slice(0, 200)}`,
      tableCount: 0,
      tableHeaders: [],
    };
  }
}

export async function debugMatchupSources(): Promise<DebugResult[]> {
  return Promise.all(CANDIDATE_URLS.map(probeUrl));
}
