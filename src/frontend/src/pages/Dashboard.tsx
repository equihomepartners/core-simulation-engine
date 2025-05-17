import React, { useState } from 'react';
import { Loading } from '@/components/ui/loading';
import { Error } from '@/components/ui/error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulations } from '@/hooks/use-simulations';
import { SimulationList } from '@/components/dashboard/simulation-list';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { MetricsSummary } from '@/components/dashboard/metrics-summary';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { DeleteConfirmDialog } from '@/components/dashboard/delete-confirm-dialog';
import { LogCategory, LogLevel, log } from '@/utils/logging';
import { sdkWrapper } from '@/utils/sdkWrapper';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();
  const { simulations, isLoading, error, refetch } = useSimulations();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [simulationToDelete, setSimulationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSimulation = (id: string) => {
    setSimulationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!simulationToDelete) return;

    try {
      setIsDeleting(true);
      log(LogLevel.INFO, LogCategory.UI, `Deleting simulation ${simulationToDelete}`);

      // Call the SDK to delete the simulation
      await sdkWrapper.deleteSimulation?.(simulationToDelete);

      // Refresh the simulations list
      refetch();

      log(LogLevel.INFO, LogCategory.UI, `Successfully deleted simulation ${simulationToDelete}`);
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.UI, `Error deleting simulation ${simulationToDelete}:`, error);
    } finally {
      setIsDeleting(false);
      setSimulationToDelete(null);
    }
  };

  const handleCreateSimulation = () => {
    navigate('/wizard');
  };

  if (isLoading) {
    return <Loading text="Loading dashboard..." className="h-[400px]" />;
  }

  if (error) {
    return (
      <Error
        title="Failed to load dashboard"
        message={error.message}
        onRetry={refetch}
        className="h-[400px]"
      />
    );
  }

  // Show welcome message if no simulations
  if (simulations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>

        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle>Welcome to the Simulation Engine</CardTitle>
            <CardDescription>
              Get started by creating your first simulation or running a preset
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-6">
            <div className="mb-6 rounded-full bg-primary/10 p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 18v-6" />
                <path d="M8 18v-1" />
                <path d="M16 18v-3" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">No simulations yet</h3>
            <p className="mb-6 text-center text-muted-foreground">
              Create your first simulation to start analyzing fund performance and metrics.
              <br />
              You can create a custom simulation or use our 100M preset for a quick start.
            </p>
            <div className="flex gap-4">
              <Button onClick={handleCreateSimulation} size="lg" className="gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Create New Simulation
              </Button>
              <Button variant="outline" onClick={() => navigate('/wizard')} size="lg" className="gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                </svg>
                Run 100M Preset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your simulations and key metrics
          </p>
        </div>
        <Button onClick={handleCreateSimulation} className="self-start sm:self-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          New Simulation
        </Button>
      </div>

      {/* Metrics Summary */}
      <MetricsSummary simulations={simulations} isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - 2/3 width */}
        <div className="space-y-6 md:col-span-2">
          {/* Simulations List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Simulations</h2>
              <Button variant="outline" size="sm" onClick={refetch} className="gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
                Refresh
              </Button>
            </div>
            <SimulationList
              simulations={simulations}
              onDelete={handleDeleteSimulation}
            />
          </div>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Activity */}
          <RecentActivity simulations={simulations} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={isDeleting ? "Deleting..." : "Delete Simulation"}
        description="Are you sure you want to delete this simulation? This action cannot be undone."
      />
    </div>
  );
}
