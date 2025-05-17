import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

interface RecentActivityProps {
  simulations: any[];
  limit?: number;
  className?: string;
}

export function RecentActivity({ simulations, limit = 5, className }: RecentActivityProps) {
  const navigate = useNavigate();

  // Sort simulations by created_at date (newest first)
  const sortedSimulations = [...simulations]
    .sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, limit);

  const getActivityIcon = (status: string) => {
    const statusLower = status?.toLowerCase() || 'unknown';
    
    switch (statusLower) {
      case 'completed':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
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
              className="text-green-600"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        );
      case 'running':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
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
              className="text-blue-600"
            >
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="m4.93 4.93 2.83 2.83" />
              <path d="m16.24 16.24 2.83 2.83" />
              <path d="M2 12h4" />
              <path d="M18 12h4" />
              <path d="m4.93 19.07 2.83-2.83" />
              <path d="m16.24 7.76 2.83-2.83" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
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
              className="text-red-600"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </div>
        );
      case 'created':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
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
              className="text-gray-600"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
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
              className="text-gray-600"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
        );
    }
  };

  const getActivityText = (simulation: any) => {
    const id = simulation.simulationId || simulation.simulation_id;
    const name = simulation.name || `Simulation ${id}`;
    const status = simulation.status?.toLowerCase() || 'unknown';
    
    switch (status) {
      case 'completed':
        return `Simulation "${name}" completed`;
      case 'running':
        return `Simulation "${name}" is running`;
      case 'failed':
        return `Simulation "${name}" failed`;
      case 'created':
        return `Simulation "${name}" created`;
      default:
        return `Simulation "${name}" status: ${status}`;
    }
  };

  const handleActivityClick = (simulation: any) => {
    const id = simulation.simulationId || simulation.simulation_id;
    navigate(`/results/${id}`);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest simulation activities</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedSimulations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {sortedSimulations.map((simulation) => {
              const id = simulation.simulationId || simulation.simulation_id;
              const createdAt = simulation.created_at
                ? new Date(simulation.created_at)
                : new Date();
              
              return (
                <div
                  key={id}
                  className="flex items-center gap-4 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                  onClick={() => handleActivityClick(simulation)}
                >
                  {getActivityIcon(simulation.status)}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getActivityText(simulation)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
