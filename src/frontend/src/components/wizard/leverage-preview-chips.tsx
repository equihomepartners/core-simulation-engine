import React from 'react';
import { LeverageMetrics } from '@/hooks/useLeveragePreview';

interface Props {
  metrics: LeverageMetrics | null;
}

export function LeveragePreviewChips({ metrics }: Props) {
  if (!metrics) return null;
  const { avg_leverage, max_drawn, total_interest } = metrics;
  const fmt = (n?: number) => (n === undefined ? '–' : n.toFixed(2));

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <span className="px-3 py-1 rounded-full bg-muted text-sm">
        Avg Leverage&nbsp;{fmt(avg_leverage)}×
      </span>
      <span className="px-3 py-1 rounded-full bg-muted text-sm">
        Max Drawn&nbsp;${fmt((max_drawn ?? 0) / 1_000_000)}m
      </span>
      <span className="px-3 py-1 rounded-full bg-muted text-sm">
        Total Interest&nbsp;${fmt((total_interest ?? 0) / 1_000_000)}m
      </span>
    </div>
  );
} 