import type { FactionStat, SubfactionStat } from "./types";

interface ColumnMap {
  faction: number;
  tw: number;
  x0: number;
  x1: number;
  winRate: number;
}

function detectColumns(headerCells: string[]): ColumnMap | null {
  const map: Partial<ColumnMap> = {};
  headerCells.forEach((cell, i) => {
    const c = cell.toLowerCase().trim().replace(/\s+/g, "");
    if (c.includes("faction") || c.includes("army") || c === "detachment") {
      map.faction = i;
    } else if (c === "tw" || c.includes("tournamentwin")) {
      map.tw = i;
    } else if (c === "x-0" || c === "x0") {
      map.x0 = i;
    } else if (c === "x-1" || c === "x1") {
      map.x1 = i;
    } else if (c.includes("win") || c.includes("wr") || c.includes("%")) {
      map.winRate = i;
    }
  });

  if (
    map.faction === undefined ||
    map.tw === undefined ||
    map.x0 === undefined ||
    map.x1 === undefined ||
    map.winRate === undefined
  ) {
    return null;
  }
  return map as ColumnMap;
}

function parseNumber(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseWinRate(s: string): number {
  const cleaned = s.trim().replace("%", "");
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 0;
  return n <= 1 ? Math.round(n * 1000) / 10 : Math.round(n * 10) / 10;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#124;/g, "|")
    .replace(/&[a-z0-9]+;/g, " ");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

function cellText(tdHtml: string): string {
  return decodeEntities(stripTags(tdHtml)).trim();
}

// ── Strategy 1: HTML <table> ──────────────────────────────────────────────────

function parseFactionRows(
  rows: string[],
  columns: ColumnMap,
  startIdx: number
): FactionStat[] {
  const factions: FactionStat[] = [];
  let current: FactionStat | null = null;

  for (let i = startIdx; i < rows.length; i++) {
    const cells: string[] = [];
    const re = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rows[i])) !== null) cells.push(cellText(m[1]));

    if (cells.length === 0) continue;

    const factionCell = cells[columns.faction] ?? "";
    const isSub = factionCell === "" || factionCell.includes("*");

    if (isSub) {
      if (!current) continue;
      const name = factionCell.replace(/\*/g, "").trim() || "Unknown";
      current.subfactions.push({
        name,
        tournamentWins: parseNumber(cells[columns.tw] ?? "0"),
        x0: parseNumber(cells[columns.x0] ?? "0"),
        x1: parseNumber(cells[columns.x1] ?? "0"),
        winRate: parseWinRate(cells[columns.winRate] ?? "0"),
      });
    } else {
      const f: FactionStat = {
        faction: factionCell.replace(/\*/g, "").trim(),
        tournamentWins: parseNumber(cells[columns.tw] ?? "0"),
        x0: parseNumber(cells[columns.x0] ?? "0"),
        x1: parseNumber(cells[columns.x1] ?? "0"),
        winRate: parseWinRate(cells[columns.winRate] ?? "0"),
        subfactions: [],
      };
      if (!f.faction) continue;
      factions.push(f);
      current = f;
    }
  }
  return factions;
}

function parseHtmlTable(html: string): FactionStat[] {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];

  for (const table of tables) {
    const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    if (rows.length < 2) continue;

    // Collect header cells from first row
    const headerCells: string[] = [];
    const re = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rows[0])) !== null) headerCells.push(cellText(m[1]));

    const columns = detectColumns(headerCells);
    if (!columns) continue;

    const factions = parseFactionRows(rows, columns, 1);
    if (factions.length > 0) return factions;
  }
  return [];
}

// ── Strategy 2: pipe-delimited markdown text ──────────────────────────────────

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function extractRawText(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/li>/gi, "\n");

  text = text.replace(/<[^>]+>/g, "");
  return decodeEntities(text);
}

function parsePipeTable(html: string): FactionStat[] {
  const text = extractRawText(html);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes("|") && (lower.includes("faction") || lower.includes("army"))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];

  const headerCells = splitTableRow(lines[headerIdx]);
  const columns = detectColumns(headerCells);
  if (!columns) return [];

  let dataStart = headerIdx + 1;
  if (dataStart < lines.length && lines[dataStart].includes("---")) dataStart++;

  const factions: FactionStat[] = [];
  let current: FactionStat | null = null;

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("|")) break;

    const cells = splitTableRow(line);
    if (cells.length < Math.max(...Object.values(columns)) + 1) continue;

    const factionCell = cells[columns.faction] ?? "";
    const isSub = factionCell === "" || line.includes("*");

    if (isSub) {
      if (!current) continue;
      const name =
        factionCell.replace(/\*/g, "").trim() ||
        cells[columns.faction + 1]?.replace(/\*/g, "").trim() ||
        "Unknown";
      current.subfactions.push({
        name,
        tournamentWins: parseNumber(cells[columns.tw] ?? "0"),
        x0: parseNumber(cells[columns.x0] ?? "0"),
        x1: parseNumber(cells[columns.x1] ?? "0"),
        winRate: parseWinRate(cells[columns.winRate] ?? "0"),
      });
    } else {
      const f: FactionStat = {
        faction: factionCell.replace(/\*/g, "").trim(),
        tournamentWins: parseNumber(cells[columns.tw] ?? "0"),
        x0: parseNumber(cells[columns.x0] ?? "0"),
        x1: parseNumber(cells[columns.x1] ?? "0"),
        winRate: parseWinRate(cells[columns.winRate] ?? "0"),
        subfactions: [],
      };
      if (!f.faction) continue;
      factions.push(f);
      current = f;
    }
  }
  return factions;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Parse WarpFriends HTML and extract faction stats.
 * Tries HTML <table> first (WordPress Gutenberg renders tables as HTML),
 * falls back to pipe-delimited markdown text.
 */
export function parseWarpFriendsHtml(html: string): FactionStat[] {
  const fromHtmlTable = parseHtmlTable(html);
  if (fromHtmlTable.length > 0) return fromHtmlTable;
  return parsePipeTable(html);
}
