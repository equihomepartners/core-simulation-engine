import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatPercentage } from '@/utils/format';
import { cn } from '@/lib/utils';
import { useSimulationActions } from '@/hooks/use-simulation-actions';

interface SimulationCardProps {
  simulation: any;
  onDelete?: (id: string) => void;
}

export function SimulationCard({ simulation, onDelete }: SimulationCardProps) {
  const navigate = useNavigate();
  const { runSimulation } = useSimulationActions();
  const [isRunning, setIsRunning] = React.useState(false);

  const id = simulation.simulationId || simulation.simulation_id;
  const name = simulation.name || `Simulation ${id}`;
  const status = simulation.status || 'Unknown';
  const createdAt = simulation.created_at ? new Date(simulation.created_at) : new Date();
  const fundSize = simulation.config?.fund_size || 0;
  const irr = simulation.metrics?.irr || 0;
  const multiple = simulation.metrics?.multiple || 0;

  const statusConfig = {
    completed: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: (
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
          className="mr-1"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    },
    running: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: (
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
          className="mr-1 animate-spin"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )
    },
    failed: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: (
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
          className="mr-1"
        >
          <path d="m10.5 20.5-7-7 7-7" />
          <path d="m13.5 6.5 7 7-7 7" />
        </svg>
      )
    },
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: (
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
          className="mr-1"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )
    },
    created: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: (
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
          className="mr-1"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      )
    },
    unknown: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: (
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
          className="mr-1"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v.01" />
          <path d="M12 8a4 4 0 0 1 0 8" />
        </svg>
      )
    }
  };

  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    return statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.unknown;
  };

  const handleViewResults = () => {
    navigate(`/results/${id}`);
  };

  const handleRunSimulation = async () => {
    try {
      setIsRunning(true);
      await runSimulation(id);
      navigate(`/results/${id}`);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const isCompleted = status.toLowerCase() === 'completed';
  const canRun = !isRunning && !['running', 'completed'].includes(status.toLowerCase());

  const statusInfo = getStatusConfig(status);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: status.toLowerCase() === 'completed' ? '#10b981' : status.toLowerCase() === 'running' ? '#3b82f6' : status.toLowerCase() === 'failed' ? '#ef4444' : '#6b7280' }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg truncate" title={name}>
            {name}
          </CardTitle>
          <span className={cn('px-2 py-1 rounded-full text-xs font-medium border flex items-center', statusInfo.color)}>
            {statusInfo.icon}
            {status}
          </span>
        </div>
        <CardDescription className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Created: {formatDate(createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
              >
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Fund Size
            </p>
            <p className="font-medium">{formatCurrency(fundSize)}</p>
          </div>
          {isCompleted && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  IRR
                </p>
                <p className="font-medium">{formatPercentage(irr)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground"
                  >
                    <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" />
                    <line x1="2" y1="20" x2="2" y2="20" />
                  </svg>
                  Multiple
                </p>
                <p className="font-medium">{multiple.toFixed(2)}x</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" onClick={handleViewResults} className="flex items-center gap-1">
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
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          {isCompleted ? 'View Results' : 'View Details'}
        </Button>
        <div className="flex gap-2">
          {canRun && (
            <Button size="sm" onClick={handleRunSimulation} disabled={isRunning} className="flex items-center gap-1">
              {isRunning ? (
                <>
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
                    className="animate-spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Running...
                </>
              ) : (
                <>
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
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Run
                </>
              )}
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete} className="flex items-center gap-1">
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
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
