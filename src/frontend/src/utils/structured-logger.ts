/**
 * Structured Logger
 * 
 * A streamlined logging system that organizes logs into a hierarchical structure
 * with a main log and collapsible sub-logs.
 */

// Define log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Define log categories
export enum LogCategory {
  SIMULATION = 'simulation',
  API = 'api',
  BACKEND = 'backend',
  METRICS = 'metrics',
  SYSTEM = 'system'
}

// Define log entry structure
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  parent?: string;
  children?: string[];
  expanded?: boolean;
}

// Define log store
class LogStore {
  private logs: Map<string, LogEntry> = new Map();
  private rootLogs: string[] = [];
  private listeners: Set<() => void> = new Set();
  private simulationLogs: Map<string, string[]> = new Map();
  
  // Add a log entry
  addLog(entry: LogEntry): string {
    // Generate ID if not provided
    if (!entry.id) {
      entry.id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set timestamp if not provided
    if (!entry.timestamp) {
      entry.timestamp = new Date();
    }
    
    // Initialize children array
    if (!entry.children) {
      entry.children = [];
    }
    
    // Add to logs map
    this.logs.set(entry.id, entry);
    
    // If it has a parent, add it to the parent's children
    if (entry.parent && this.logs.has(entry.parent)) {
      const parent = this.logs.get(entry.parent)!;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(entry.id);
      this.logs.set(parent.id, parent);
    } else {
      // If no parent, add to root logs
      this.rootLogs.push(entry.id);
    }
    
    // Track by simulation ID if available
    if (entry.data?.simulationId) {
      const simId = entry.data.simulationId;
      if (!this.simulationLogs.has(simId)) {
        this.simulationLogs.set(simId, []);
      }
      this.simulationLogs.get(simId)!.push(entry.id);
    }
    
    // Notify listeners
    this.notifyListeners();
    
    return entry.id;
  }
  
  // Get a log entry
  getLog(id: string): LogEntry | undefined {
    return this.logs.get(id);
  }
  
  // Get all root logs
  getRootLogs(): LogEntry[] {
    return this.rootLogs.map(id => this.logs.get(id)!).filter(Boolean);
  }
  
  // Get logs for a simulation
  getSimulationLogs(simulationId: string): LogEntry[] {
    const logIds = this.simulationLogs.get(simulationId) || [];
    return logIds.map(id => this.logs.get(id)!).filter(Boolean);
  }
  
  // Get all logs
  getAllLogs(): LogEntry[] {
    return Array.from(this.logs.values());
  }
  
  // Clear all logs
  clearLogs(): void {
    this.logs.clear();
    this.rootLogs = [];
    this.simulationLogs.clear();
    this.notifyListeners();
  }
  
  // Toggle expanded state
  toggleExpanded(id: string): void {
    const log = this.logs.get(id);
    if (log) {
      log.expanded = !log.expanded;
      this.logs.set(id, log);
      this.notifyListeners();
    }
  }
  
  // Add a listener
  addListener(listener: () => void): void {
    this.listeners.add(listener);
  }
  
  // Remove a listener
  removeListener(listener: () => void): void {
    this.listeners.delete(listener);
  }
  
  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Create a singleton instance
export const logStore = new LogStore();

/**
 * Create a main log entry
 */
export function createMainLog(
  category: LogCategory,
  message: string,
  data?: any
): string {
  return logStore.addLog({
    id: `main_${Date.now()}`,
    timestamp: new Date(),
    level: LogLevel.INFO,
    category,
    message,
    data,
    expanded: true,
    children: []
  });
}

/**
 * Add a sub-log to a parent log
 */
export function addSubLog(
  parentId: string,
  level: LogLevel,
  message: string,
  data?: any
): string {
  return logStore.addLog({
    timestamp: new Date(),
    level,
    category: logStore.getLog(parentId)?.category || LogCategory.SYSTEM,
    message,
    data,
    parent: parentId,
    expanded: false,
    children: []
  });
}

/**
 * Process API response and create structured logs
 */
export function logApiResponse(
  endpoint: string,
  response: any,
  simulationId?: string
): string {
  // Create main log for the API response
  const mainLogId = createMainLog(
    LogCategory.API,
    `Response from ${endpoint}`,
    { endpoint, simulationId }
  );
  
  // Don't log empty responses
  if (!response) return mainLogId;
  
  // Log the response structure
  addSubLog(
    mainLogId,
    LogLevel.DEBUG,
    'Response structure',
    {
      keys: Object.keys(response),
      simulationId
    }
  );
  
  // If it's a simulation result, log key metrics
  if (endpoint.includes('/results') && response.performance_metrics) {
    const metrics = response.performance_metrics;
    
    // Create a metrics sub-log
    const metricsLogId = addSubLog(
      mainLogId,
      LogLevel.INFO,
      'Performance Metrics',
      { simulationId }
    );
    
    // Log IRR metrics
    if (metrics.irr !== undefined) {
      addSubLog(
        metricsLogId,
        LogLevel.INFO,
        `Gross IRR: ${(metrics.irr * 100).toFixed(2)}%`,
        { grossIrr: metrics.irr }
      );
    }
    
    if (metrics.fund_irr !== undefined) {
      addSubLog(
        metricsLogId,
        LogLevel.INFO,
        `Fund IRR: ${(metrics.fund_irr * 100).toFixed(2)}%`,
        { fundIrr: metrics.fund_irr }
      );
    }
    
    if (metrics.lp_irr !== undefined) {
      addSubLog(
        metricsLogId,
        LogLevel.INFO,
        `LP IRR: ${(metrics.lp_irr * 100).toFixed(2)}%`,
        { lpIrr: metrics.lp_irr }
      );
    }
    
    // Log multiple metrics
    if (metrics.moic !== undefined) {
      addSubLog(
        metricsLogId,
        LogLevel.INFO,
        `Multiple: ${metrics.moic.toFixed(2)}x`,
        { multiple: metrics.moic }
      );
    }
    
    // Log distribution metrics
    if (metrics.dpi !== undefined) {
      addSubLog(
        metricsLogId,
        LogLevel.INFO,
        `DPI: ${metrics.dpi.toFixed(2)}`,
        { dpi: metrics.dpi }
      );
    }
    
    if (metrics.rvpi !== undefined) {
      addSubLog(
        metricsLogId,
        LogLevel.INFO,
        `RVPI: ${metrics.rvpi.toFixed(2)}`,
        { rvpi: metrics.rvpi }
      );
    }
    
    if (metrics.tvpi !== undefined) {
      addSubLog(
        metricsLogId,
        LogLevel.INFO,
        `TVPI: ${metrics.tvpi.toFixed(2)}`,
        { tvpi: metrics.tvpi }
      );
    }
  }
  
  return mainLogId;
}

/**
 * Process simulation progress update
 */
export function logSimulationProgress(
  progressData: any
): string {
  if (!progressData) return '';
  
  const { simulation_id, step, progress, message, current_step } = progressData;
  
  // Create main log for the progress update
  const mainLogId = createMainLog(
    LogCategory.SIMULATION,
    `Simulation Progress: ${(progress * 100).toFixed(1)}%`,
    {
      simulationId: simulation_id,
      step,
      progress,
      currentStep: current_step
    }
  );
  
  // Log the current step
  if (current_step) {
    addSubLog(
      mainLogId,
      LogLevel.INFO,
      `Current step: ${current_step}`,
      { step: current_step }
    );
  }
  
  // If there's a snapshot with metrics, log those too
  if (progressData.snapshot?.metrics) {
    const metricsLogId = addSubLog(
      mainLogId,
      LogLevel.INFO,
      'Snapshot Metrics',
      { simulationId: simulation_id }
    );
    
    Object.entries(progressData.snapshot.metrics).forEach(([key, value]) => {
      addSubLog(
        metricsLogId,
        LogLevel.INFO,
        `${key}: ${value}`,
        { [key]: value }
      );
    });
  }
  
  return mainLogId;
}

// Export the log store
export default logStore;
