import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatCurrency, formatPercentage, formatMultiple } from '@/utils/format';

// Import visualization components
import { LPCashFlowChart } from './lp-cash-flow-chart';

// Placeholder components for now
const LPCashFlowWaterfall = ({ results, isLoading }: any) => (
  <div className="flex items-center justify-center h-full">
    <p className="text-muted-foreground">Cash Flow Waterfall Chart (Coming Soon)</p>
  </div>
);

const LPCashFlowTableView = ({ results, isLoading, timeGranularity }: any) => (
  <div className="flex items-center justify-center h-full">
    <p className="text-muted-foreground">Cash Flow Table View (Coming Soon)</p>
  </div>
);

interface LPCashFlowsTabProps {
  simulation: any;
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'quarterly' | 'monthly';
  cumulativeMode: boolean;
}

export function LPCashFlowsTab({ 
  simulation, 
  results, 
  isLoading,
  timeGranularity,
  cumulativeMode
}: LPCashFlowsTabProps) {
  const [viewType, setViewType] = useState<'chart' | 'table' | 'waterfall'>('chart');
  
  return (
    <div className="space-y-8">
      {/* Top Row - Cash Flow Chart/Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Cash Flow Analysis</CardTitle>
              <CardDescription>Detailed analysis of LP cash flows</CardDescription>
            </div>
            <Tabs value={viewType} onValueChange={(value) => setViewType(value as 'chart' | 'table' | 'waterfall')} className="w-[300px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="h-[500px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <>
              {viewType === 'chart' && (
                <LPCashFlowChart
                  results={results}
                  isLoading={isLoading}
                  timeGranularity={timeGranularity}
                  cumulativeMode={cumulativeMode}
                  expanded={true}
                />
              )}
              {viewType === 'table' && (
                <LPCashFlowTableView
                  results={results}
                  isLoading={isLoading}
                  timeGranularity={timeGranularity}
                />
              )}
              {viewType === 'waterfall' && (
                <LPCashFlowWaterfall
                  results={results}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Middle Row - Investment Journey and Cash Flow Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Investment Journey */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Investment Journey</CardTitle>
            <CardDescription>LP investment value over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[450px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Investment Journey Chart (Coming Soon)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Sources */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Cash Flow Sources</CardTitle>
            <CardDescription>Breakdown of cash flow sources</CardDescription>
          </CardHeader>
          <CardContent className="h-[450px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Cash Flow Sources Chart (Coming Soon)</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Cash Flow Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Capital Calls */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Capital Calls</CardTitle>
            <CardDescription>Analysis of capital calls</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total Called</span>
                  <span className="text-xl font-semibold text-red-600">
                    {formatCurrency(results?.metrics?.total_capital_calls || results?.metrics?.totalCapitalCalls || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Uncalled Capital</span>
                  <span className="text-xl font-semibold">
                    {formatCurrency(results?.metrics?.uncalled_capital || results?.metrics?.uncalledCapital || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">PIC Ratio</span>
                  <span className="text-xl font-semibold">
                    {formatPercentage(results?.metrics?.pic || 0)}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600 rounded-full"
                      style={{ width: `${(results?.metrics?.pic || 0) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distributions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Distributions</CardTitle>
            <CardDescription>Analysis of distributions</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total Distributed</span>
                  <span className="text-xl font-semibold text-green-600">
                    {formatCurrency(results?.metrics?.total_distributions || results?.metrics?.totalDistributions || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">DPI Ratio</span>
                  <span className="text-xl font-semibold">
                    {formatMultiple(results?.metrics?.dpi || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Distribution Yield</span>
                  <span className="text-xl font-semibold">
                    {formatPercentage(results?.metrics?.distribution_yield || results?.metrics?.distributionYield || 0)}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${Math.min((results?.metrics?.dpi || 0) * 50, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>0.0x</span>
                    <span>2.0x+</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Net Cash Flow */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Net Cash Flow</CardTitle>
            <CardDescription>Analysis of net cash flow</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Net Cash Flow</span>
                  <span className={`text-xl font-semibold ${(results?.metrics?.net_cash_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results?.metrics?.net_cash_flow || results?.metrics?.netCashFlow || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Breakeven Year</span>
                  <span className="text-xl font-semibold">
                    {results?.metrics?.breakeven_year || results?.metrics?.breakevenYear || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Payback Period</span>
                  <span className="text-xl font-semibold">
                    {results?.metrics?.payback_period ? `${results.metrics.payback_period.toFixed(1)} years` : 'N/A'}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${(results?.metrics?.net_cash_flow || 0) >= 0 ? 'bg-green-600' : 'bg-red-600'} rounded-full`}
                      style={{ width: `${Math.min(Math.abs((results?.metrics?.net_cash_flow || 0) / (results?.metrics?.total_capital_calls || 1) * 100), 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>-100%</span>
                    <span>0%</span>
                    <span>+100%</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
