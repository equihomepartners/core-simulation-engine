import React, { createContext, useContext, useState, useEffect } from 'react';
import { StructuredConsole } from '@/components/debug/structured-console';
import { useSimulationStore } from '@/store/simulation-store';
import logStore, { 
  LogLevel, 
  LogCategory, 
  createMainLog, 
  addSubLog,
  logApiResponse,
  logSimulationProgress
} from '@/utils/structured-logger';

// Define the context type
interface StructuredLoggerContextType {
  isConsoleVisible: boolean;
  showConsole: () => void;
  hideConsole: () => void;
  toggleConsole: () => void;
  logApiCall: (endpoint: string, response: any) => void;
  logSimulationEvent: (message: string, data?: any) => void;
  logBackendData: (data: any, title: string) => void;
}

// Create the context with default values
const StructuredLoggerContext = createContext<StructuredLoggerContextType>({
  isConsoleVisible: false,
  showConsole: () => {},
  hideConsole: () => {},
  toggleConsole: () => {},
  logApiCall: () => {},
  logSimulationEvent: () => {},
  logBackendData: () => {}
});

// Hook to use the structured logger
export const useStructuredLogger = () => useContext(StructuredLoggerContext);

// Provider component
export const StructuredLoggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [isConsoleVisible, setIsConsoleVisible] = useState(false);
  const { currentSimulation } = useSimulationStore();
  
  // Methods
  const showConsole = () => setIsConsoleVisible(true);
  const hideConsole = () => setIsConsoleVisible(false);
  const toggleConsole = () => setIsConsoleVisible(prev => !prev);
  
  // Log an API call
  const logApiCall = (endpoint: string, response: any) => {
    logApiResponse(endpoint, response, currentSimulation?.id);
  };
  
  // Log a simulation event
  const logSimulationEvent = (message: string, data?: any) => {
    const mainLogId = createMainLog(
      LogCategory.SIMULATION,
      message,
      {
        ...data,
        simulationId: currentSimulation?.id
      }
    );
    
    // If data has properties, log them as sub-logs
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'simulationId' && value !== undefined) {
          addSubLog(
            mainLogId,
            LogLevel.INFO,
            `${key}: ${value}`,
            { [key]: value }
          );
        }
      });
    }
    
    return mainLogId;
  };
  
  // Log backend data
  const logBackendData = (data: any, title: string) => {
    if (!data) return;
    
    const mainLogId = createMainLog(
      LogCategory.BACKEND,
      title,
      {
        simulationId: currentSimulation?.id
      }
    );
    
    // Log top-level keys
    const topLevelKeys = Object.keys(data);
    addSubLog(
      mainLogId,
      LogLevel.INFO,
      `Structure: ${topLevelKeys.join(', ')}`,
      { keys: topLevelKeys }
    );
    
    // Log each top-level section
    topLevelKeys.forEach(key => {
      const value = data[key];
      if (value && typeof value === 'object') {
        const sectionLogId = addSubLog(
          mainLogId,
          LogLevel.INFO,
          `Section: ${key}`,
          { section: key }
        );
        
        // If it's an array, log the length and first few items
        if (Array.isArray(value)) {
          addSubLog(
            sectionLogId,
            LogLevel.INFO,
            `Array with ${value.length} items`,
            { 
              length: value.length,
              sample: value.slice(0, 3)
            }
          );
        } else {
          // Log object keys
          const subKeys = Object.keys(value);
          addSubLog(
            sectionLogId,
            LogLevel.INFO,
            `Object with ${subKeys.length} properties`,
            { 
              keys: subKeys,
              sample: value
            }
          );
        }
      } else {
        // Log primitive values directly
        addSubLog(
          mainLogId,
          LogLevel.INFO,
          `${key}: ${value}`,
          { [key]: value }
        );
      }
    });
    
    return mainLogId;
  };
  
  // Log when simulation changes
  useEffect(() => {
    if (currentSimulation?.id) {
      logSimulationEvent(
        `Active simulation: ${currentSimulation.id}`,
        {
          status: currentSimulation.status,
          name: currentSimulation.name
        }
      );
    }
  }, [currentSimulation?.id]);
  
  // Context value
  const contextValue: StructuredLoggerContextType = {
    isConsoleVisible,
    showConsole,
    hideConsole,
    toggleConsole,
    logApiCall,
    logSimulationEvent,
    logBackendData
  };
  
  return (
    <StructuredLoggerContext.Provider value={contextValue}>
      {children}
      {isConsoleVisible && (
        <StructuredConsole 
          simulationId={currentSimulation?.id} 
          onClose={hideConsole}
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
    </StructuredLoggerContext.Provider>
  );
};
