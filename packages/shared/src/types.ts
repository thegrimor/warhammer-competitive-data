export interface WeekMeta {
  weekStart: string;   // ISO date (Monday)
  weekEnd: string;     // ISO date (Sunday)
  label: string;       // e.g. "May 19 – May 25"
  url: string;
  fetchedAt: string;
}

export interface SubfactionStat {
  name: string;
  tournamentWins: number;
  x0: number;
  x1: number;
  winRate: number;     // 0-100
}

export interface FactionStat {
  faction: string;
  tournamentWins: number;
  x0: number;
  x1: number;
  winRate: number;     // 0-100
  subfactions: SubfactionStat[];
}

export interface WeekData {
  meta: WeekMeta;
  factions: FactionStat[];
  error?: string;
}

export interface MetaResponse {
  weeks: WeekData[];
  lastUpdated: string;
}
