import type { WeekData } from "@40k/shared";
import WinRateBadge from "./WinRateBadge";

interface Props {
  army: string;
  weeks: WeekData[];
  activeWeeks: Set<string>;
}

export default function SubfactionTab({ army, weeks, activeWeeks }: Props) {
  const weekWithData = weeks
    .filter((w) => activeWeeks.has(w.meta.weekStart))
    .find((w) => {
      const f = w.factions.find((f) => f.faction === army);
      return f && f.subfactions.length > 0;
    });

  const faction = weekWithData?.factions.find((f) => f.faction === army);

  if (!faction || faction.subfactions.length === 0) {
    return <div className="no-data">No subfaction data available.</div>;
  }

  const sorted = [...faction.subfactions].sort((a, b) => b.winRate - a.winRate);

  return (
    <div className="subfaction-list">
      {sorted.map((sub) => (
        <div key={sub.name} className="subfaction-row">
          <span className="subfaction-name">{sub.name}</span>
          <div className="subfaction-stats">
            <span>{sub.tournamentWins} TW</span>
            <span>{sub.x0}×0</span>
            <span>{sub.x1}×1</span>
            <WinRateBadge value={sub.winRate} />
          </div>
        </div>
      ))}
    </div>
  );
}
