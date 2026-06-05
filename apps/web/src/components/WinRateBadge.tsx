interface Props { value: number; }

function colorClass(v: number) {
  if (v >= 55) return "green";
  if (v >= 50) return "blue";
  if (v >= 45) return "gray";
  return "red";
}

export default function WinRateBadge({ value }: Props) {
  return (
    <span className={`win-rate-badge ${colorClass(value)}`}>
      {value.toFixed(1)}%
    </span>
  );
}
