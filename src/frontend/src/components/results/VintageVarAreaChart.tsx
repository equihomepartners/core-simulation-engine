import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useVintageVarResults } from '@/hooks/use-vintage-var-results';

interface Props {
  simulationId: string;
}

export function VintageVarAreaChart({ simulationId }: Props) {
  const { data, isLoading } = useVintageVarResults(simulationId);

  if (isLoading) return <Skeleton className="w-full h-64" />;
  if (!data || !data.vintage_var) return <div className="text-muted-foreground">No vintage VaR data</div>;

  const series = Object.entries(data.vintage_var).map(([year, val]: any) => ({ year, var: val.value_at_risk }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vintage VaR</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {series.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} />
              <Tooltip formatter={(v: number) => `${(v * 100).toFixed(2)}%`} />
              <Area type="monotone" dataKey="var" stroke="#10b981" fill="#d1fae5" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No data</div>
        )}
      </CardContent>
    </Card>
  );
}

export default VintageVarAreaChart;
