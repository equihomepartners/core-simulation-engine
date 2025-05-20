import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronDown,
  ChevronUp,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  Database,
  Server,
  BarChart,
  Activity,
  Settings
} from 'lucide-react';
import logStore, { LogEntry, LogLevel, LogCategory } from '@/utils/structured-logger';

interface StructuredConsoleProps {
  simulationId?: string;
  isCollapsed?: boolean;
  onClose?: () => void;
}

export function StructuredConsole({
  simulationId,
  isCollapsed = false,
  onClose
}: StructuredConsoleProps) {
  // State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expanded, setExpanded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Update logs when the store changes
  useEffect(() => {
    const updateLogs = () => {
      if (simulationId) {
        setLogs(logStore.getSimulationLogs(simulationId));
      } else {
        setLogs(logStore.getRootLogs());
      }
    };
    
    // Initial update
    updateLogs();
    
    // Subscribe to changes
    logStore.addListener(updateLogs);
    
    // Cleanup
    return () => {
      logStore.removeListener(updateLogs);
    };
  }, [simulationId]);
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs]);
  
  // Filter logs by category
  const filteredLogs = activeCategory === 'all'
    ? logs
    : logs.filter(log => log.category === activeCategory);
  
  // Toggle a log's expanded state
  const toggleLogExpanded = (id: string) => {
    logStore.toggleExpanded(id);
  };
  
  // Clear all logs
  const clearLogs = () => {
    logStore.clearLogs();
  };
  
  // Export logs as JSON
  const exportLogs = () => {
    const exportData = {
      simulationId,
      timestamp: new Date().toISOString(),
      logs: logStore.getAllLogs()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `simulation-logs-${simulationId || 'all'}-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Render a log entry recursively
  const renderLogEntry = (log: LogEntry, depth = 0) => {
    const hasChildren = log.children && log.children.length > 0;
    const childLogs = hasChildren
      ? log.children!.map(id => logStore.getLog(id)).filter(Boolean) as LogEntry[]
      : [];
    
    // Define level colors
    const levelColors = {
      [LogLevel.DEBUG]: 'bg-gray-200 text-gray-800',
      [LogLevel.INFO]: 'bg-blue-200 text-blue-800',
      [LogLevel.WARN]: 'bg-yellow-200 text-yellow-800',
      [LogLevel.ERROR]: 'bg-red-200 text-red-800'
    };
    
    // Define category icons
    const categoryIcons = {
      [LogCategory.SIMULATION]: <Activity size={16} />,
      [LogCategory.API]: <Server size={16} />,
      [LogCategory.BACKEND]: <Database size={16} />,
      [LogCategory.METRICS]: <BarChart size={16} />,
      [LogCategory.SYSTEM]: <Settings size={16} />
    };
    
    return (
      <div key={log.id} className="mb-1">
        <div 
          className={`flex items-start p-2 rounded-md ${depth === 0 ? 'bg-gray-100' : ''}`}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleLogExpanded(log.id)}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              {log.expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">
                {log.timestamp.toLocaleTimeString()}
              </span>
              
              <Badge className={levelColors[log.level] || 'bg-gray-200'}>
                {log.level}
              </Badge>
              
              <span className="flex items-center gap-1 text-xs text-gray-600">
                {categoryIcons[log.category] || <Settings size={16} />}
                {log.category}
              </span>
              
              <span className="font-medium">{log.message}</span>
            </div>
            
            {log.data && Object.keys(log.data).length > 0 && (
              <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
        
        {log.expanded && hasChildren && (
          <div className="ml-4">
            {childLogs.map(childLog => renderLogEntry(childLog, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card 
      className={`fixed bottom-0 right-0 z-50 shadow-lg transition-all duration-200 ${
        expanded ? 'w-full h-[80vh]' : 'w-full md:w-2/3 lg:w-1/2 max-h-96'
      } ${collapsed ? 'h-12' : ''}`}
    >
      <CardHeader className="py-2 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <CardTitle className="text-lg">Simulation Console</CardTitle>
          {simulationId && (
            <Badge variant="outline" className="ml-2">
              {simulationId}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearLogs}
            title="Clear logs"
          >
            <RefreshCw size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={exportLogs}
            title="Export logs"
          >
            <Download size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Minimize' : 'Maximize'}
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
          
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {!collapsed && (
        <>
          <div className="px-4">
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value={LogCategory.SIMULATION}>Simulation</TabsTrigger>
                <TabsTrigger value={LogCategory.API}>API</TabsTrigger>
                <TabsTrigger value={LogCategory.BACKEND}>Backend</TabsTrigger>
                <TabsTrigger value={LogCategory.METRICS}>Metrics</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <CardContent className="p-4 pt-0">
            <ScrollArea 
              className="h-64" 
              ref={scrollAreaRef}
            >
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No logs to display
                  </div>
                ) : (
                  filteredLogs.map(log => renderLogEntry(log))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </>
      )}
    </Card>
  );
}
