import React, { createContext, useContext, useState, useEffect } from 'react';
import { SimulationConsole } from '@/components/debug/simulation-console';
import { useSimulationStore } from '@/store/simulation-store';
import { LogLevel, LogCategory, SimulationPhase, log, logPhaseStart, logPhaseComplete } from '@/utils/logging';

// Define the context type
interface SimulationLoggerContextType {
  isConsoleVisible: boolean;
  showConsole: () => void;
  hideConsole: () => void;
  toggleConsole: () => void;
  logSimulationEvent: (
    level: LogLevel,
    message: string,
    data?: any,
    phase?: SimulationPhase
  ) => void;
  logMetric: (name: string, value: any) => void;
}

// Create the context with default values
const SimulationLoggerContext = createContext<SimulationLoggerContextType>({
  isConsoleVisible: false,
  showConsole: () => {},
  hideConsole: () => {},
  toggleConsole: () => {},
  logSimulationEvent: () => {},
  logMetric: () => {}
});

// Hook to use the simulation logger
export const useSimulationLogger = () => useContext(SimulationLoggerContext);

// Provider component
export const SimulationLoggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [isConsoleVisible, setIsConsoleVisible] = useState(false);
  const { currentSimulation } = useSimulationStore();
  
  // Methods
  const showConsole = () => setIsConsoleVisible(true);
  const hideConsole = () => setIsConsoleVisible(false);
  const toggleConsole = () => setIsConsoleVisible(prev => !prev);
  
  // Log a simulation event
  const logSimulationEvent = (
    level: LogLevel,
    message: string,
    data?: any,
    phase?: SimulationPhase
  ) => {
    log(
      level,
      LogCategory.SIMULATION,
      message,
      data,
      {
        simulationId: currentSimulation?.id,
        phase,
        deduplicateKey: `${message}:${JSON.stringify(data || {})}`
      }
    );
  };
  
  // Log a metric
  const logMetric = (name: string, value: any) => {
    log(
      LogLevel.INFO,
      LogCategory.METRICS,
      `${name}: ${typeof value === 'number' ? value.toFixed(4) : value}`,
      { [name]: value },
      {
        simulationId: currentSimulation?.id,
        deduplicateKey: `metric:${name}:${currentSimulation?.id}`
      }
    );
  };
  
  // Log when simulation changes
  useEffect(() => {
    if (currentSimulation?.id) {
      log(
        LogLevel.INFO,
        LogCategory.SIMULATION,
        `Active simulation changed to ${currentSimulation.id}`,
        {
          simulationId: currentSimulation.id,
          status: currentSimulation.status
        }
      );
    }
  }, [currentSimulation?.id]);
  
  // Context value
  const contextValue: SimulationLoggerContextType = {
    isConsoleVisible,
    showConsole,
    hideConsole,
    toggleConsole,
    logSimulationEvent,
    logMetric
  };
  
  return (
    <SimulationLoggerContext.Provider value={contextValue}>
      {children}
      {isConsoleVisible && (
        <SimulationConsole 
          simulationId={currentSimulation?.id} 
          isCollapsed={false}
        />
      )}
      {!isConsoleVisible && (
        <button
          className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          onClick={showConsole}
          aria-label="Show console"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </button>
      )}
    </SimulationLoggerContext.Provider>
  );
};
