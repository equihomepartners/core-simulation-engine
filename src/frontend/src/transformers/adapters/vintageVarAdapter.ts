import { VintageVarResults } from '@/api';

export interface VintageVarDataPoint {
  vintage: number;
  var: number;
}

export function adaptVintageVarResults(res: VintageVarResults | undefined): VintageVarDataPoint[] | null {
  if (!res || res.status !== 'success' || !res.vintage_var) return null;
  return Object.entries(res.vintage_var)
    .filter(([_y, v]) => typeof v.value_at_risk === 'number')
    .map(([year, obj]) => ({
      vintage: Number(year),
      var: obj.value_at_risk as number
    }));
} 