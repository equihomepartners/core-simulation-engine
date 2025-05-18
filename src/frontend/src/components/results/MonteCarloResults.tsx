import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useMonteCarloResults } from '@/hooks/use-montecarlo-results';
import { useSimulationResults } from '@/hooks/use-simulation-results';

interface Props {
  simulationId: string;
  metric?: 'irr' | 'multiple' | 'default_rate';
}

export function MonteCarloResults({ simulationId, metric = 'irr' }: Props) {
  const {
    data: distribution,
    isLoading: loadingDist
  } = useMonteCarloResults(simulationId, 'distribution', metric);

  const {
    data: sensitivity,
    isLoading: loadingSens
  } = useMonteCarloResults(simulationId, 'sensitivity', metric);

  const {
    data: convergence,
    isLoading: loadingConv
  } = useMonteCarloResults(simulationId, 'confidence', metric);

  const { results } = useSimulationResults(simulationId);

  const distChartData = React.useMemo(() => {
    if (!distribution) return [];
    const labels = distribution.data.labels || [];
    const dataset = distribution.data.datasets?.[0];
    return labels.map((label: number, idx: number) => ({
      label,
      value: dataset?.data?.[idx] ?? 0
    }));
  }, [distribution]);

  const sensChartData = React.useMemo(() => {
    if (!sensitivity) return [];
    const labels = sensitivity.data.labels || [];
    const dataset = sensitivity.data.datasets?.[0];
    return labels.map((label: string, idx: number) => ({
      label,
      value: dataset?.data?.[idx] ?? 0
    }));
  }, [sensitivity]);

  const convChartData = React.useMemo(() => {
    if (!convergence) return [];
    const labels = convergence.data.labels || [];
    const dataset = convergence.data.datasets?.[0];
    return labels.map((label: number, idx: number) => ({
      label,
      value: dataset?.data?.[idx] ?? 0
    }));
  }, [convergence]);

  const factorData = React.useMemo(() => {
    const betas = results?.monte_carlo_results?.factor_decomposition?.betas || {};
    return Object.entries(betas).map(([name, val]) => ({ name, value: val as number }));
  }, [results]);

  if (loadingDist && loadingSens && loadingConv) {
    return <Skeleton className="w-full h-64" />;
  }

  return (
    <div className="space-y-8">
      <div className="h-64">
        {distChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No distribution data</div>
        )}
      </div>
      <div className="h-64">
        {sensChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={sensChartData} margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="label" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No sensitivity data</div>
        )}
      </div>
      <div className="h-64">
        {convChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={convChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#f97316" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No convergence data</div>
        )}
      </div>
      <div className="h-64">
        {factorData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={factorData} margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No factor data</div>
        )}
      </div>
    </div>
  );
}

export default MonteCarloResults;
