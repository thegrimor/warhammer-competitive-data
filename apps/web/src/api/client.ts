import { useQuery } from "@tanstack/react-query";
import type { MetaResponse } from "@40k/shared";

async function fetchMeta(): Promise<MetaResponse> {
  const res = await fetch("/api/meta");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useMetaData() {
  return useQuery<MetaResponse>({
    queryKey: ["meta"],
    queryFn: fetchMeta,
  });
}

export function useArmyList(data: MetaResponse | undefined): string[] {
  if (!data) return [];
  const names = new Set<string>();
  data.weeks.forEach((week) => week.factions.forEach((f) => names.add(f.faction)));
  return Array.from(names).sort();
}
