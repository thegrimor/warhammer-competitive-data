import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { WeekData } from "@40k/shared";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Props {
  army: string;
  weeks: WeekData[];
  activeWeeks: Set<string>;
}

const options: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#16161a",
      borderColor: "#2a2a33",
      borderWidth: 1,
      titleColor: "#e8e8f0",
      bodyColor: "#7070a0",
      callbacks: {
        label: (ctx) => ` ${ctx.parsed.y.toFixed(1)}%`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: "#2a2a33" },
      ticks: { color: "#7070a0", font: { family: "Space Mono", size: 11 } },
    },
    y: {
      grid: { color: "#2a2a33" },
      ticks: {
        color: "#7070a0",
        font: { family: "Space Mono", size: 11 },
        callback: (v) => `${v}%`,
      },
      min: 35,
      max: 70,
    },
  },
};

function winRateColor(v: number): string {
  if (v >= 55) return "#22c55e";
  if (v >= 50) return "#3b82f6";
  if (v >= 45) return "#71717a";
  return "#ef4444";
}

export default function TrendChart({ army, weeks, activeWeeks }: Props) {
  const filtered = weeks
    .filter((w) => activeWeeks.has(w.meta.weekStart))
    .slice()
    .reverse();

  const labels = filtered.map((w) => w.meta.label);
  const values = filtered.map((w) => {
    const f = w.factions.find((f) => f.faction === army);
    return f?.winRate ?? null;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: army,
        data: values,
        borderColor: "#8b5cf6",
        backgroundColor: "#8b5cf633",
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: values.map((v) => (v != null ? winRateColor(v) : "#8b5cf6")),
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  return (
    <div className="chart-container">
      <Line data={chartData} options={options} />
    </div>
  );
}
