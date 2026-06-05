import { useState, useMemo } from "react";
import { useMetaData, useArmyList } from "./api/client";
import ArmySelector from "./components/ArmySelector";
import WeekPills from "./components/WeekPills";
import MetricCards from "./components/MetricCards";
import TrendChart from "./components/TrendChart";
import SubfactionTab from "./components/SubfactionTab";
import MetaTab from "./components/MetaTab";

type Tab = "trend" | "subfactions" | "meta";

export default function App() {
  const { data, isLoading, error } = useMetaData();
  const armies = useArmyList(data);
  const [army, setArmy] = useState<string>("");
  const [tab, setTab] = useState<Tab>("trend");
  const [activeWeeks, setActiveWeeks] = useState<Set<string>>(new Set());

  const weeks = data?.weeks ?? [];

  useMemo(() => {
    if (armies.length > 0 && !army) setArmy(armies[0]);
  }, [armies]);

  useMemo(() => {
    if (weeks.length > 0 && activeWeeks.size === 0) {
      setActiveWeeks(
        new Set(weeks.filter((w) => w.factions.length > 0).map((w) => w.meta.weekStart))
      );
    }
  }, [weeks]);

  function toggleWeek(weekStart: string) {
    setActiveWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekStart)) {
        if (next.size > 1) next.delete(weekStart);
      } else {
        next.add(weekStart);
      }
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
          <span>Loading meta data… (scraping up to 8 weeks)</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app">
        <div className="error-msg">
          Failed to load data. Make sure the API server is running on port 3001.
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>40k Meta Analyzer</h1>
        <span>WarpFriends · last {weeks.length} weeks</span>
      </div>

      {armies.length > 0 && (
        <ArmySelector armies={armies} selected={army} onChange={setArmy} />
      )}

      <WeekPills weeks={weeks} active={activeWeeks} onToggle={toggleWeek} />

      {army && (
        <MetricCards army={army} weeks={weeks} activeWeeks={activeWeeks} />
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="tabs">
          {(["trend", "subfactions", "meta"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "trend" && army && (
          <TrendChart army={army} weeks={weeks} activeWeeks={activeWeeks} />
        )}
        {tab === "subfactions" && army && (
          <SubfactionTab army={army} weeks={weeks} activeWeeks={activeWeeks} />
        )}
        {tab === "meta" && (
          <MetaTab weeks={weeks} activeWeeks={activeWeeks} />
        )}
      </div>
    </div>
  );
}
