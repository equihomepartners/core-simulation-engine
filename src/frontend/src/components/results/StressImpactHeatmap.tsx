import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGridStressResults } from '@/hooks/use-grid-stress-results';

interface Props {
  simulationId: string;
}

function getColor(value: number, min: number, max: number) {
  const ratio = (value - min) / (max - min || 1);
  const hue = (1 - ratio) * 240; // blue -> red
  return `hsl(${hue},70%,50%)`;
}

export function StressImpactHeatmap({ simulationId }: Props) {
  const { data, isLoading } = useGridStressResults(simulationId);

  if (isLoading) return <Skeleton className="w-full h-64" />;
  if (!data) return <div className="text-muted-foreground">No grid stress data</div>;

  const factors = data.factors || [];
  const matrix = data.irr_matrix || [];
  const flat = matrix.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stress Impact Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto">
        <table className="border-collapse text-xs" role="table">
          <thead>
            <tr>
              <th className="p-1" />
              {factors.map((f, i) => (
                <th key={i} className="p-1 text-right">{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, y) => (
              <tr key={y}>
                <th className="p-1 text-right">{factors[y]}</th>
                {row.map((val, x) => (
                  <td
                    key={x}
                    style={{ backgroundColor: getColor(val, min, max) }}
                    className="w-8 h-8 text-center text-white"
                  >
                    {(val * 100).toFixed(1)}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default StressImpactHeatmap;
