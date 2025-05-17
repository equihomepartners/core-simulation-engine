import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns'; // For date formatting

interface HeaderBarAProps {
  simulation: any;
  results: any;
  onExport: () => void;
}

export function HeaderBarA({ simulation, results, onExport }: HeaderBarAProps) {
  const fundName = simulation?.name || simulation?.config?.fund_name || simulation?.config?.fund_id || 'N/A';
  const vintageYear = simulation?.config?.vintage_year || (simulation?.created_at ? new Date(simulation.created_at).getFullYear() : 'N/A');
  
  let dataCutTimestamp = 'N/A';
  if (results?.metadata?.timestamp_of_results_generation) {
    dataCutTimestamp = format(new Date(results.metadata.timestamp_of_results_generation), 'dd MMM yyyy HH:mm XXX');
  } else if (simulation?.updated_at) {
    dataCutTimestamp = format(new Date(simulation.updated_at), 'dd MMM yyyy HH:mm XXX');
  }

  interface ShareClass {
    label: string;
    value: string;
  }
  // Placeholder for LP Share Class - to be implemented if data model supports it
  const lpShareClasses: ShareClass[] = []; // Example: [{label: 'Class A', value: 'class_a'}]
  const selectedShareClass = lpShareClasses[0]?.value;

  return (
    <div className="flex items-center justify-between py-2 px-4 border-b sticky top-0 bg-background z-10 h-[40px]">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-700">
          {fundName} <span className="text-sm text-gray-500 font-normal">({vintageYear})</span>
        </h1>
        {lpShareClasses.length > 0 && (
          <select 
            value={selectedShareClass}
            // onChange={(e) => setSelectedShareClass(e.target.value)} 
            className="text-xs p-1 border rounded bg-gray-50"
          >
            {lpShareClasses.map(sc => <option key={sc.value} value={sc.value}>{sc.label}</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">
          Data cut: {dataCutTimestamp}
        </span>
        <Button variant="outline" size="sm" onClick={onExport} className="text-xs">
          <Download className="h-3 w-3 mr-1.5" />
          Download raw JSON
        </Button>
        <Button variant="outline" size="sm" onClick={() => alert('FAQ PDF - Coming Soon')} className="text-xs">
          <FileText className="h-3 w-3 mr-1.5" />
          FAQ PDF
        </Button>
      </div>
    </div>
  );
} 