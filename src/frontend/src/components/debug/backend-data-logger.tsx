import React, { useEffect, useState } from 'react';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Download, Copy, Eye } from 'lucide-react';

interface BackendDataLoggerProps {
  data: any;
  title?: string;
  description?: string;
}

export function BackendDataLogger({ data, title = 'Backend Data', description = 'Complete structure of data from the backend' }: BackendDataLoggerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('structure');

  useEffect(() => {
    if (data) {
      // Log the data to console once
      log(LogLevel.INFO, LogCategory.BACKEND_DATA, `${title} structure:`, {
        topLevelKeys: Object.keys(data || {}),
        data
      });
    }
  }, [data, title]);

  if (!data) {
    return null;
  }

  const downloadData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const copyData = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      .then(() => {
        log(LogLevel.INFO, LogCategory.UI, 'Data copied to clipboard');
      })
      .catch(err => {
        log(LogLevel.ERROR, LogCategory.UI, 'Failed to copy data', err);
      });
  };

  // Recursive component to render nested objects
  const RenderObject = ({ obj, depth = 0, path = '' }: { obj: any, depth?: number, path?: string }) => {
    if (obj === null) return <span className="text-muted-foreground">null</span>;
    if (obj === undefined) return <span className="text-muted-foreground">undefined</span>;
    
    if (typeof obj !== 'object') {
      if (typeof obj === 'string') return <span className="text-green-600">"{obj}"</span>;
      if (typeof obj === 'number') return <span className="text-blue-600">{obj}</span>;
      if (typeof obj === 'boolean') return <span className="text-purple-600">{obj.toString()}</span>;
      return <span>{String(obj)}</span>;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return <span className="text-muted-foreground">[]</span>;
      
      return (
        <Collapsible className="ml-4">
          <div className="flex items-center">
            <CollapsibleTrigger className="flex items-center">
              <ChevronRight className="h-4 w-4" />
            </CollapsibleTrigger>
            <span className="text-muted-foreground">Array({obj.length})</span>
          </div>
          <CollapsibleContent>
            <div className="ml-4 border-l-2 border-muted pl-2">
              {obj.slice(0, 10).map((item, index) => (
                <div key={`${path}-${index}`} className="flex">
                  <span className="text-muted-foreground mr-2">{index}:</span>
                  <RenderObject obj={item} depth={depth + 1} path={`${path}[${index}]`} />
                </div>
              ))}
              {obj.length > 10 && (
                <div className="text-muted-foreground">... {obj.length - 10} more items</div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }
    
    const keys = Object.keys(obj);
    if (keys.length === 0) return <span className="text-muted-foreground">{}</span>;
    
    return (
      <Collapsible className={depth > 0 ? "ml-4" : ""}>
        <div className="flex items-center">
          <CollapsibleTrigger className="flex items-center">
            <ChevronRight className="h-4 w-4" />
          </CollapsibleTrigger>
          <span className="text-muted-foreground">Object {`{${keys.length} keys}`}</span>
        </div>
        <CollapsibleContent>
          <div className="ml-4 border-l-2 border-muted pl-2">
            {keys.map(key => (
              <div key={`${path}-${key}`} className="flex">
                <span className="text-muted-foreground mr-2">{key}:</span>
                <RenderObject obj={obj[key]} depth={depth + 1} path={`${path}.${key}`} />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)}>
            <Eye className="h-4 w-4 mr-2" />
            {isVisible ? 'Hide' : 'Show'} Data
          </Button>
        </div>
      </CardHeader>
      
      {isVisible && (
        <>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
                <TabsTrigger value="keys">Keys</TabsTrigger>
              </TabsList>
              
              <TabsContent value="structure">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <RenderObject obj={data} />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="raw">
                <ScrollArea className="h-[400px] rounded-md border">
                  <pre className="p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="keys">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Top-level keys:</h3>
                    <ul className="list-disc pl-5">
                      {Object.keys(data).map(key => (
                        <li key={key} className="text-sm">
                          {key} <span className="text-muted-foreground">({typeof data[key]})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={copyData}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={downloadData}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
