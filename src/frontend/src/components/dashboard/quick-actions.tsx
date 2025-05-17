import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSimulationActions } from '@/hooks/use-simulation-actions';
import { LogCategory, LogLevel, log } from '@/utils/logging';

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const navigate = useNavigate();
  const { get100MPreset, runSimulationWithConfig } = useSimulationActions();
  const [isRunning100M, setIsRunning100M] = useState(false);

  const handleCreateSimulation = () => {
    navigate('/wizard');
  };

  const handleRun100MPreset = async () => {
    try {
      setIsRunning100M(true);
      log(LogLevel.INFO, LogCategory.UI, 'Running 100M preset simulation');
      
      const preset = get100MPreset();
      const result = await runSimulationWithConfig(preset);
      
      if (result && (result.simulationId || result.simulation_id)) {
        const id = result.simulationId || result.simulation_id;
        log(LogLevel.INFO, LogCategory.UI, `100M preset simulation created with ID: ${id}`);
        navigate(`/results/${id}`);
      } else {
        log(LogLevel.ERROR, LogCategory.UI, 'Failed to get simulation ID from result', result);
      }
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.UI, 'Error running 100M preset:', error);
    } finally {
      setIsRunning100M(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Start a new simulation or use a preset</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button onClick={handleCreateSimulation} className="w-full justify-start">
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
            className="mr-2"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Create New Simulation
        </Button>
        <Button
          variant="outline"
          onClick={handleRun100MPreset}
          disabled={isRunning100M}
          className="w-full justify-start"
        >
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
            className="mr-2"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {isRunning100M ? 'Running...' : 'Run $100M Preset'}
        </Button>
      </CardContent>
    </Card>
  );
}
