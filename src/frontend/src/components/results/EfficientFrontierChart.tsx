import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Line } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useEfficientFrontier } from '@/hooks/use-efficient-frontier';

interface Props {
  optimizationId: string;
}

export function EfficientFrontierChart({ optimizationId }: Props) {
  const { data, isLoading } = useEfficientFrontier(optimizationId);

  const points = data?.efficient_frontier || [];

  if (isLoading) {
    return <Skeleton className="w-full h-64" />;
  }

  return (
    <div className="h-64">
      {points.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="risk" name="Risk" tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
            <YAxis type="number" dataKey="return" name="Return" tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
            <Tooltip formatter={(val: number) => `${(val * 100).toFixed(2)}%`} />
            <Scatter data={points} fill="#3b82f6" />
            <Line type="monotone" dataKey="return" data={points} stroke="#94a3b8" dot={false} />
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">No frontier data</div>
      )}
    </div>
  );
}

export default EfficientFrontierChart;
