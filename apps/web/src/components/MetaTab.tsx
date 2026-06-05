import type { WeekData } from "@40k/shared";
import WinRateBadge from "./WinRateBadge";

interface Props {
  weeks: WeekData[];
  activeWeeks: Set<string>;
}

interface AggregatedFaction {
  faction: string;
  avgWinRate: number;
  totalTW: number;
  totalX0: number;
  weekCount: number;
}

export default function MetaTab({ weeks, activeWeeks }: Props) {
  const active = weeks.filter((w) => activeWeeks.has(w.meta.weekStart));
  const factionMap = new Map<string, { winRates: number[]; tw: number; x0: number }>();

  active.forEach((week) => {
    week.factions.forEach((f) => {
      const existing = factionMap.get(f.faction) ?? { winRates: [], tw: 0, x0: 0 };
      existing.winRates.push(f.winRate);
      existing.tw += f.tournamentWins;
      existing.x0 += f.x0;
      factionMap.set(f.faction, existing);
    });
  });

  const aggregated: AggregatedFaction[] = Array.from(factionMap.entries())
    .map(([faction, data]) => ({
      faction,
      avgWinRate: data.winRates.reduce((a, b) => a + b, 0) / data.winRates.length,
      totalTW: data.tw,
      totalX0: data.x0,
      weekCount: data.winRates.length,
    }))
    .sort((a, b) => b.avgWinRate - a.avgWinRate);

  if (aggregated.length === 0) {
    return <div className="no-data">No data for selected weeks.</div>;
  }

  return (
    <table className="meta-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Faction</th>
          <th>Avg Win Rate</th>
          <th>Total TW</th>
          <th>Total X-0</th>
          <th>Weeks</th>
        </tr>
      </thead>
      <tbody>
        {aggregated.map((f, i) => (
          <tr key={f.faction}>
            <td style={{ color: "var(--text-muted)", width: 32 }}>{i + 1}</td>
            <td>{f.faction}</td>
            <td><WinRateBadge value={f.avgWinRate} /></td>
            <td>{f.totalTW}</td>
            <td>{f.totalX0}</td>
            <td style={{ color: "var(--text-muted)" }}>{f.weekCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
