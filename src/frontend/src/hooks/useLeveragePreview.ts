import { useEffect, useState, useRef } from 'react';

export interface LeverageMetrics {
  avg_leverage?: number;
  max_drawn?: number;
  total_interest?: number;
}

/**
 * Light wrapper around /api/leverage/preview
 * Debounces calls to avoid flooding the backend while the user drags sliders.
 */
export function useLeveragePreview(
  navByYear: Record<number, number> | null,
  leverageConfig: any | null,
  debounceMs = 400,
): LeverageMetrics | null {
  const [metrics, setMetrics] = useState<LeverageMetrics | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!navByYear || !leverageConfig) {
      return;
    }

    // debounce
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/leverage/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nav_by_year: navByYear, config: leverageConfig }),
        });
        if (!res.ok) throw new Error('preview failed');
        const data = await res.json();
        setMetrics(data.metrics ?? null);
      } catch (err) {
        console.warn('Leverage preview failed', err);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navByYear, leverageConfig, debounceMs]);

  return metrics;
} 