import React, { useState, useEffect, useRef } from 'react';
import { LogLevel, LogCategory } from '@/utils/logging';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Copy, 
  Eye, 
  EyeOff, 
  Filter, 
  X, 
  Clock, 
  BarChart, 
  Database, 
  Server, 
  Settings, 
  AlertCircle 
} from 'lucide-react';

// Define log entry structure
interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  component?: string;
  phase?: string;
}

// Define console props
interface SimulationConsoleProps {
  simulationId?: string;
  isCollapsed?: boolean;
  initialTab?: string;
}

// Define category icons
const categoryIcons = {
  [LogCategory.DATA]: <Database size={16} />,
  [LogCategory.UI]: <Eye size={16} />,
  [LogCategory.API]: <Server size={16} />,
  [LogCategory.PERFORMANCE]: <BarChart size={16} />,
  [LogCategory.BACKEND_DATA]: <Database size={16} />,
  [LogCategory.CONFIG]: <Settings size={16} />
};

// Define level colors
const levelColors = {
  [LogLevel.DEBUG]: 'bg-gray-200 text-gray-800',
  [LogLevel.INFO]: 'bg-blue-200 text-blue-800',
  [LogLevel.WARN]: 'bg-yellow-200 text-yellow-800',
  [LogLevel.ERROR]: 'bg-red-200 text-red-800'
};

// Define simulation phases
const simulationPhases = [
  'initialization',
  'portfolio-generation',
  'loan-lifecycle',
  'cash-flows',
  'waterfall',
  'performance-metrics',
  'monte-carlo',
  'optimization',
  'stress-testing',
  'reporting'
];

export function SimulationConsole({ 
  simulationId, 
  isCollapsed = false, 
  initialTab = 'all' 
}: SimulationConsoleProps) {
  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filters, setFilters] = useState({
    level: [] as LogLevel[],
    category: [] as LogCategory[],
    phase: [] as string[]
  });
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Intercept console logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    // Override console methods
    console.log = function(...args: any[]) {
      originalConsole.log(...args);
      processLog(LogLevel.INFO, args);
    };
    
    console.info = function(...args: any[]) {
      originalConsole.info(...args);
      processLog(LogLevel.INFO, args);
    };
    
    console.warn = function(...args: any[]) {
      originalConsole.warn(...args);
      processLog(LogLevel.WARN, args);
    };
    
    console.error = function(...args: any[]) {
      originalConsole.error(...args);
      processLog(LogLevel.ERROR, args);
    };
    
    console.debug = function(...args: any[]) {
      originalConsole.debug(...args);
      processLog(LogLevel.DEBUG, args);
    };
    
    // Process log entries
    function processLog(level: LogLevel, args: any[]) {
      // Only process logs with our format: [CATEGORY] message
      if (args.length > 0 && typeof args[0] === 'string') {
        const message = args[0];
        const categoryMatch = message.match(/\[(.*?)\]/);
        
        if (categoryMatch) {
          const category = categoryMatch[1] as LogCategory;
          const cleanMessage = message.replace(/\[.*?\]\s*/, '');
          const data = args.length > 1 ? args[1] : undefined;
          
          // Extract component and phase if available
          let component = undefined;
          let phase = undefined;
          
          if (cleanMessage.includes('[') && cleanMessage.includes(']')) {
            const componentMatch = cleanMessage.match(/\[(.*?)\]/);
            if (componentMatch) {
              component = componentMatch[1];
            }
          }
          
          // Check if message contains a simulation phase
          for (const p of simulationPhases) {
            if (cleanMessage.toLowerCase().includes(p)) {
              phase = p;
              break;
            }
          }
          
          // Add to logs
          const newLog: LogEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            timestamp: new Date().toISOString(),
            level,
            category,
            message: cleanMessage,
            data,
            component,
            phase
          };
          
          setLogs(prevLogs => [...prevLogs, newLog]);
        }
      }
    }
    
    // Restore original console on cleanup
    return () => {
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.debug = originalConsole.debug;
    };
  }, []);
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);
  
  // Filter logs based on active tab and filters
  const filteredLogs = logs.filter(log => {
    // Filter by tab
    if (activeTab !== 'all' && activeTab !== log.category) {
      return false;
    }
    
    // Apply additional filters
    if (filters.level.length > 0 && !filters.level.includes(log.level)) {
      return false;
    }
    
    if (filters.category.length > 0 && !filters.category.includes(log.category)) {
      return false;
    }
    
    if (filters.phase.length > 0 && (!log.phase || !filters.phase.includes(log.phase))) {
      return false;
    }
    
    return true;
  });
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Download logs
  const downloadLogs = () => {
    const logData = JSON.stringify(logs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-logs-${simulationId || 'all'}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Toggle filter
  const toggleFilter = (type: 'level' | 'category' | 'phase', value: any) => {
    setFilters(prev => {
      const current = [...prev[type]];
      const index = current.indexOf(value);
      
      if (index === -1) {
        current.push(value);
      } else {
        current.splice(index, 1);
      }
      
      return { ...prev, [type]: current };
    });
  };
  
  // Render log entry
  const renderLogEntry = (log: LogEntry) => (
    <div key={log.id} className="py-1 border-b border-gray-100 hover:bg-gray-50">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-2">
          {categoryIcons[log.category] || <AlertCircle size={16} />}
        </div>
        <div className="flex-grow">
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <Badge className={`${levelColors[log.level]} mr-2`}>
              {log.level}
            </Badge>
            {log.phase && (
              <Badge variant="outline" className="mr-2">
                {log.phase}
              </Badge>
            )}
          </div>
          <div className="text-sm mt-1">{log.message}</div>
          {log.data && (
            <Collapsible className="mt-1">
              <CollapsibleTrigger className="flex items-center text-xs text-blue-600">
                <ChevronRight className="h-3 w-3 mr-1" />
                View Details
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="text-xs bg-gray-50 p-2 mt-1 rounded overflow-auto max-h-40">
                  {typeof log.data === 'object' 
                    ? JSON.stringify(log.data, null, 2) 
                    : String(log.data)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
  
  // If fully collapsed, just show a button to expand
  if (collapsed) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setCollapsed(false)}
      >
        <Eye className="h-4 w-4 mr-2" />
        Show Console
      </Button>
    );
  }
  
  return (
    <Card className="fixed bottom-0 right-0 w-full md:w-2/3 lg:w-1/2 max-h-96 z-50 shadow-lg">
      <CardHeader className="py-2 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <CardTitle className="text-lg">Simulation Console</CardTitle>
          {simulationId && (
            <Badge variant="outline" className="ml-2">
              {simulationId}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => setAutoScroll(!autoScroll)}>
            {autoScroll ? <Clock className="h-4 w-4" /> : <Clock className="h-4 w-4 text-gray-400" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={clearLogs}>
            <X className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadLogs}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(true)}>
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={LogCategory.DATA}>Data</TabsTrigger>
            <TabsTrigger value={LogCategory.API}>API</TabsTrigger>
            <TabsTrigger value={LogCategory.BACKEND_DATA}>Backend</TabsTrigger>
            <TabsTrigger value={LogCategory.PERFORMANCE}>Performance</TabsTrigger>
            <TabsTrigger value={LogCategory.CONFIG}>Config</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          <div className="px-4 py-2 bg-gray-50 border-y flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium">Filters:</span>
            
            {/* Level filters */}
            {Object.values(LogLevel).map(level => (
              <Badge 
                key={level}
                variant={filters.level.includes(level) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilter('level', level)}
              >
                {level}
              </Badge>
            ))}
            
            {/* Phase filters */}
            {simulationPhases.map(phase => (
              <Badge 
                key={phase}
                variant={filters.phase.includes(phase) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleFilter('phase', phase)}
              >
                {phase}
              </Badge>
            ))}
          </div>
          
          <ScrollArea className="h-64" ref={scrollAreaRef}>
            <div className="p-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No logs to display
                </div>
              ) : (
                filteredLogs.map(renderLogEntry)
              )}
            </div>
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="py-2 px-4 text-xs text-gray-500">
          {filteredLogs.length} logs displayed (of {logs.length} total)
        </CardFooter>
      </Tabs>
    </Card>
  );
}
