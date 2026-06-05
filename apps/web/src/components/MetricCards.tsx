import type { WeekData } from "@40k/shared";

interface Props {
  army: string;
  weeks: WeekData[];
  activeWeeks: Set<string>;
}

function colorClass(v: number) {
  if (v >= 55) return "green";
  if (v >= 50) return "blue";
  if (v >= 45) return "gray";
  return "red";
}

export default function MetricCards({ army, weeks, activeWeeks }: Props) {
  const activeData = weeks
    .filter((w) => activeWeeks.has(w.meta.weekStart))
    .map((w) => w.factions.find((f) => f.faction === army))
    .filter(Boolean) as NonNullable<ReturnType<typeof weeks[0]["factions"]["find"]>>[];

  if (activeData.length === 0) {
    return <div className="no-data">No data for {army} in selected weeks.</div>;
  }

  const latest = activeData[0];
  const winRates = activeData.map((d) => d.winRate);
  const avgWinRate = winRates.reduce((a, b) => a + b, 0) / winRates.length;

  const trend =
    winRates.length >= 2
      ? winRates[0] - winRates[winRates.length - 1]
      : 0;

  const totalTW = activeData.reduce((a, b) => a + b.tournamentWins, 0);

  return (
    <div className="metrics">
      <div className="metric-card">
        <div className="metric-label">Win Rate (latest)</div>
        <div className={`metric-value ${colorClass(latest.winRate)}`}>
          {latest.winRate.toFixed(1)}%
        </div>
        <div className="metric-sub">{latest.x0}×0 · {latest.x1}×1</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Average ({activeData.length}wk)</div>
        <div className={`metric-value ${colorClass(avgWinRate)}`}>
          {avgWinRate.toFixed(1)}%
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Trend</div>
        <div className={`metric-value ${trend > 1 ? "green" : trend < -1 ? "red" : "gray"}`}>
          {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
        </div>
        <div className="metric-sub">vs oldest selected week</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Tournament Wins</div>
        <div className="metric-value blue">{totalTW}</div>
        <div className="metric-sub">across {activeData.length} weeks</div>
      </div>
    </div>
  );
}
