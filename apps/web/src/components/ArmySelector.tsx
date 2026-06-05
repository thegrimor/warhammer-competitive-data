interface Props {
  armies: string[];
  selected: string;
  onChange: (army: string) => void;
}

export default function ArmySelector({ armies, selected, onChange }: Props) {
  return (
    <div className="army-selector card">
      <label>Army</label>
      <select value={selected} onChange={(e) => onChange(e.target.value)}>
        {armies.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}
