import { GridStressResults } from '@/api';

export interface HeatmapData {
  xLabels: number[];
  yLabels: number[];
  matrix: number[][];
}

export function adaptGridStressResults(grid: GridStressResults | undefined): HeatmapData | null {
  if (!grid) return null;
  const { factors, irr_matrix } = grid;
  if (!factors || !irr_matrix) return null;
  return {
    xLabels: factors,
    yLabels: factors,
    matrix: irr_matrix
  };
} 