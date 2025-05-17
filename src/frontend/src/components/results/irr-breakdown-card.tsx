import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedIRRBreakdownChart } from './enhanced-irr-breakdown-chart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface IRRBreakdownCardProps {
  results: any;
  isLoading: boolean;
}

export function IRRBreakdownCard({ results, isLoading }: IRRBreakdownCardProps) {
  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              IRR Waterfall Analysis
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      This waterfall chart shows how the Gross IRR is reduced by management fees and carried interest
                      to arrive at the LP Net IRR. It visualizes the progression from Gross IRR
                      to Fund IRR (after management fees) to LP IRR (after carried interest).
                    </p>
                    <p className="mt-2">
                      Toggle the "Detailed Breakdown" switch to see additional information about fee impact.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              How fees impact investment returns from Gross to LP Net IRR
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <EnhancedIRRBreakdownChart data={results} isLoading={isLoading} />
        )}
      </CardContent>
    </Card>
  );
}
