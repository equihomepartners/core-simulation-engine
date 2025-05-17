import { SimulationResult } from '../api/simulationClient';

declare module '../hooks/useSimulationStatus' {
  export interface SimulationStatusResult {
    simulations: SimulationResult[];
    loading: boolean;
    error: string | null;
  }

  export function useSimulationStatus(): SimulationStatusResult;
} 