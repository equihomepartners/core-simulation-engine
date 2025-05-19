import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns'; // For date formatting
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeaderBarAProps {
  simulation: any;
  results: any;
  onExport: () => void;
}

export function HeaderBarA({ simulation, results, onExport }: HeaderBarAProps) {
  const fundName = simulation?.name || simulation?.config?.fund_name || simulation?.config?.fund_id || 'N/A';
  const vintageYear = simulation?.config?.vintage_year || (simulation?.created_at ? new Date(simulation.created_at).getFullYear() : 'N/A');
  const [selectedShareClass, setSelectedShareClass] = useState<string>("default");

  let dataCutTimestamp = 'N/A';
  if (results?.metadata?.timestamp_of_results_generation) {
    dataCutTimestamp = format(new Date(results.metadata.timestamp_of_results_generation), 'dd MMM yyyy HH:mm XXX');
  } else if (simulation?.updated_at) {
    dataCutTimestamp = format(new Date(simulation.updated_at), 'dd MMM yyyy HH:mm XXX');
  }

  // Check if we have LP share classes in the data
  const hasShareClasses = results?.lp_share_classes?.length > 0 || false;

  return (
    <div className="flex items-center justify-between py-2 px-4 border-b sticky top-0 bg-white z-10 h-[40px]">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-[#0B1C3F]">
          {fundName} <span className="text-sm text-[#314C7E] font-normal">({vintageYear})</span>
        </h1>

        <span className="text-xs text-gray-500">
          Data cut: {dataCutTimestamp}
        </span>

        {/* LP Share Class Dropdown */}
        {hasShareClasses ? (
          <Select value={selectedShareClass} onValueChange={setSelectedShareClass}>
            <SelectTrigger className="h-7 w-40 text-xs">
              <SelectValue placeholder="LP Share Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default LP Class</SelectItem>
              {results?.lp_share_classes?.map((sc: any) => (
                <SelectItem key={sc.id} value={sc.id}>{sc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select value="default" disabled>
            <SelectTrigger className="h-7 w-40 text-xs">
              <SelectValue placeholder="Default LP Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default LP Class</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="text-xs h-7"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Download Raw CSV
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => alert('FAQ PDF - Coming Soon')}
          className="text-xs h-7"
        >
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          FAQ PDF
        </Button>
      </div>
    </div>
  );
}