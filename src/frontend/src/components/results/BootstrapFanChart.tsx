import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBootstrapResults } from '@/hooks/use-bootstrap-results';

interface Props {
  simulationId: string;
}

export function BootstrapFanChart({ simulationId }: Props) {
  const { data, isLoading } = useBootstrapResults(simulationId);

  if (isLoading) return <Skeleton className="w-full h-64" />;
  if (!data) return <div className="text-muted-foreground">No bootstrap data</div>;

  const distribution = data.irr_distribution || [];
  const chartData = distribution.map((val: number, i: number) => ({ idx: i + 1, value: val }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bootstrap Fan Chart</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="idx" name="Sample" />
              <YAxis tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
              <Tooltip formatter={(v: number) => `${(v * 100).toFixed(2)}%`} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#bfdbfe" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No data</div>
        )}
      </CardContent>
    </Card>
  );
}

export default BootstrapFanChart;
