import { BootstrapResults } from '@/api';

export interface FanChartData {
  iterations: number;
  labels: number[]; // percentiles or index
  series: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

/**
 * Convert BootstrapResults into fan-chart friendly data.
 * Returns the percentile band (p5 – p95) plus the mean.
 */
export function adaptBootstrapResults(bootstrap: BootstrapResults | undefined): FanChartData | null {
  if (!bootstrap || bootstrap.status !== 'success' || !bootstrap.irr_distribution) return null;

  const dist = bootstrap.irr_distribution;
  const sorted = [...dist].sort((a, b) => a - b);

  const p = (q: number) => {
    const idx = Math.floor((q / 100) * (sorted.length - 1));
    return sorted[idx];
  };

  const mean = bootstrap.mean_irr ?? (dist.reduce((s, v) => s + v, 0) / dist.length);
  const p5 = bootstrap.percentile_5 ?? p(5);
  const p95 = bootstrap.percentile_95 ?? p(95);

  return {
    iterations: bootstrap.iterations ?? dist.length,
    labels: [5, 50, 95],
    series: [
      {
        label: 'Mean',
        data: [mean],
        color: '#3b82f6'
      },
      {
        label: 'P5',
        data: [p5],
        color: '#d97706'
      },
      {
        label: 'P95',
        data: [p95],
        color: '#10b981'
      }
    ]
  };
} 