import type { WeekData } from "@40k/shared";

interface Props {
  weeks: WeekData[];
  active: Set<string>;
  onToggle: (weekStart: string) => void;
}

export default function WeekPills({ weeks, active, onToggle }: Props) {
  return (
    <div className="week-pills">
      {weeks.map((w) => {
        const key = w.meta.weekStart;
        const hasData = w.factions.length > 0;
        return (
          <button
            key={key}
            className={`week-pill${active.has(key) ? " active" : ""}${!hasData ? " error" : ""}`}
            onClick={() => hasData && onToggle(key)}
            title={hasData ? w.meta.label : "No data available"}
          >
            {w.meta.label}
          </button>
        );
      })}
    </div>
  );
}
