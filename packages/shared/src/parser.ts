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
  // Normalize: if it looks like 0-1 range, convert to 0-100
  return n <= 1 ? Math.round(n * 1000) / 10 : Math.round(n * 10) / 10;
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function isSubfactionRow(rawLine: string, factionCell: string): boolean {
  return factionCell === "" || rawLine.includes("*");
}

function extractRawText(html: string): string {
  // Replace block-level tags with newlines to preserve line structure
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/li>/gi, "\n");

  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#124;/g, "|")
    .replace(/&[a-z]+;/g, " ");

  return text;
}

/**
 * Parse WarpFriends HTML and extract faction stats.
 * The site embeds a pipe-delimited markdown table in the post content.
 */
export function parseWarpFriendsHtml(html: string): FactionStat[] {
  const text = extractRawText(html);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Find the header row (contains "faction" and "|")
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

  // Skip separator row (--|---|-- etc.)
  let dataStart = headerIdx + 1;
  if (dataStart < lines.length && lines[dataStart].includes("---")) {
    dataStart++;
  }

  const factions: FactionStat[] = [];
  let currentFaction: FactionStat | null = null;

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes("|")) break; // End of table

    const cells = splitTableRow(line);
    if (cells.length < Math.max(...Object.values(columns)) + 1) continue;

    const factionCell = cells[columns.faction] ?? "";
    const isSub = isSubfactionRow(line, factionCell);

    if (isSub) {
      if (!currentFaction) continue;
      const name = factionCell.replace(/\*/g, "").trim() ||
                   cells[columns.faction + 1]?.replace(/\*/g, "").trim() ||
                   "Unknown";
      const sub: SubfactionStat = {
        name,
        tournamentWins: parseNumber(cells[columns.tw] ?? "0"),
        x0: parseNumber(cells[columns.x0] ?? "0"),
        x1: parseNumber(cells[columns.x1] ?? "0"),
        winRate: parseWinRate(cells[columns.winRate] ?? "0"),
      };
      currentFaction.subfactions.push(sub);
    } else {
      const faction: FactionStat = {
        faction: factionCell.replace(/\*/g, "").trim(),
        tournamentWins: parseNumber(cells[columns.tw] ?? "0"),
        x0: parseNumber(cells[columns.x0] ?? "0"),
        x1: parseNumber(cells[columns.x1] ?? "0"),
        winRate: parseWinRate(cells[columns.winRate] ?? "0"),
        subfactions: [],
      };
      if (!faction.faction) continue;
      factions.push(faction);
      currentFaction = faction;
    }
  }

  return factions;
}
