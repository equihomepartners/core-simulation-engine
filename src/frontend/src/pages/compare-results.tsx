import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSimulation } from '@/hooks/use-simulation';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

// Simple placeholder component that compares two simulations
export function CompareResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leveredId = searchParams.get('levered') || '';
  const unleveredId = searchParams.get('unlevered') || '';

  const {
    simulation: leveredSim,
    isLoading: isLoadingLevered,
    error: leveredError
  } = useSimulation(leveredId, { enabled: !!leveredId });

  const {
    simulation: unleveredSim,
    isLoading: isLoadingUnlevered,
    error: unleveredError
  } = useSimulation(unleveredId, { enabled: !!unleveredId });

  if (!leveredId || !unleveredId) {
    return (
      <Error
        title="Missing parameters"
        message="Both levered and unlevered simulation IDs are required."
        onRetry={() => navigate('/dashboard')}
      />
    );
  }

  if (isLoadingLevered || isLoadingUnlevered) {
    return <Loading text="Loading simulations for comparison..." className="h-[400px]" />;
  }

  if (leveredError || unleveredError || !leveredSim || !unleveredSim) {
    const msg = (leveredError as any)?.message || (unleveredError as any)?.message || 'Failed to load simulations.';
    return (
      <Error
        title="Error loading simulations"
        message={msg}
        onRetry={() => window.location.reload()}
        className="h-[400px]"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Simulation Comparison</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Levered Simulation</h2>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(leveredSim, null, 2)}</pre>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Unlevered Simulation</h2>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(unleveredSim, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

export default CompareResults; 