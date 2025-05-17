import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Info, PieChart, BarChart3, List, Filter } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { TimeGranularity } from '@/types/finance';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define interfaces for loan contribution data
interface LoanContribution {
  loan_id: string;
  exit_value: number;
  proportion: number;
  gp_distribution: number;
  lp_distribution: number;
  is_default: boolean;
  exit_reason: string | null;
  default_reason: string | null;
  zone: string | null;
  loan_amount: number;
  reinvested: boolean;
  ltv: number;
}

interface LoanContributionMap {
  [year: string]: {
    [loan_id: string]: LoanContribution;
  };
}

interface LoanDistributionCardProps {
  results: any; // Full results object from API
  timeGranularity: TimeGranularity;
  isLoading: boolean;
}

export function LoanDistributionCard({ results, timeGranularity, isLoading }: LoanDistributionCardProps) {
  // State management
  const [viewType, setViewType] = useState<'pie' | 'bar' | 'list'>('bar');
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const [exitTypeFilter, setExitTypeFilter] = useState<string | null>(null);

  // Process the loan contribution data from results
  const {
    loanContributionMap,
    years,
    totalDistributions,
    zoneDistributions,
    exitTypeDistributions,
    hasData
  } = useMemo(() => {
    // Default empty values
    const emptyResult = {
      loanContributionMap: {} as LoanContributionMap,
      years: [] as number[],
      totalDistributions: 0,
      zoneDistributions: {} as Record<string, number>,
      exitTypeDistributions: {} as Record<string, number>,
      hasData: false
    };

    if (isLoading || !results) return emptyResult;

    // Extract loan contribution map from results
    const lcMap = results.waterfall_results?.loan_contribution_map || 
                  results.waterfallResults?.loanContributionMap || {};
    
    if (!lcMap || Object.keys(lcMap).length === 0) return emptyResult;

    // Process years, ensure they're numbers
    const yearsArray = Object.keys(lcMap).map(y => parseInt(y)).sort((a, b) => a - b);
    
    // Default to the last year if no year is selected
    if (yearFilter === null && yearsArray.length > 0) {
      setYearFilter(yearsArray[yearsArray.length - 1]);
    }

    // Calculate zone and exit type distributions
    const zoneDistribs: Record<string, number> = {};
    const exitTypeDistribs: Record<string, number> = {};
    let totalDist = 0;

    // Process all contributions
    for (const year in lcMap) {
      for (const loanId in lcMap[year]) {
        const loan = lcMap[year][loanId];
        const zone = loan.zone || 'unknown';
        const exitType = loan.is_default ? 'default' : 
                         loan.exit_reason || (loan.reinvested ? 'reinvested' : 'normal');
        
        // Accumulate distributions by zone
        zoneDistribs[zone] = (zoneDistribs[zone] || 0) + loan.lp_distribution;
        
        // Accumulate distributions by exit type
        exitTypeDistribs[exitType] = (exitTypeDistribs[exitType] || 0) + loan.lp_distribution;
        
        // Add to total
        totalDist += loan.lp_distribution;
      }
    }

    return {
      loanContributionMap: lcMap,
      years: yearsArray,
      totalDistributions: totalDist,
      zoneDistributions: zoneDistribs,
      exitTypeDistributions: exitTypeDistribs,
      hasData: true
    };
  }, [results, isLoading, yearFilter]);

  // Apply filters to get currently visible loans
  const filteredLoans = useMemo(() => {
    if (!hasData) return [];
    
    const selectedYear = yearFilter !== null ? yearFilter.toString() : null;
    let loans: Array<{id: string} & Record<string, any>> = [];
    
    // If year is filtered, only use loans from that year
    if (selectedYear && loanContributionMap[selectedYear]) {
      loans = Object.entries(loanContributionMap[selectedYear]).map(([id, loan]) => ({
        ...(loan as Record<string, any>),
        id
      }));
    } else {
      // Otherwise, use all loans
      Object.entries(loanContributionMap).forEach(([year, yearLoans]) => {
        if (yearLoans && typeof yearLoans === 'object') {
          Object.entries(yearLoans as Record<string, any>).forEach(([id, loan]) => {
            loans.push({ ...(loan as Record<string, any>), id });
          });
        }
      });
    }
    
    // Apply zone filter
    if (zoneFilter) {
      loans = loans.filter(loan => loan.zone === zoneFilter);
    }
    
    // Apply exit type filter
    if (exitTypeFilter) {
      loans = loans.filter(loan => {
        if (exitTypeFilter === 'default') return loan.is_default;
        if (exitTypeFilter === 'reinvested') return loan.reinvested;
        const exitReason = loan.exit_reason || 'normal';
        return exitReason === exitTypeFilter;
      });
    }
    
    // Sort by lp_distribution descending
    return loans.sort((a, b) => b.lp_distribution - a.lp_distribution);
  }, [loanContributionMap, yearFilter, zoneFilter, exitTypeFilter, hasData]);

  // Prepare visualization data
  const chartData = useMemo(() => {
    // For the pie chart - top 5 loans + "Others"
    const pieData = [...filteredLoans]
      .slice(0, 5)
      .map(loan => ({
        name: `Loan ${loan.id.substring(0, 8)}...`,
        value: loan.lp_distribution,
        zone: loan.zone,
        exitType: loan.is_default ? 'default' : loan.exit_reason || 'normal',
        fullId: loan.id
      }));
    
    // Add "Others" if there are more than 5 loans
    if (filteredLoans.length > 5) {
      const othersValue = filteredLoans
        .slice(5)
        .reduce((sum, loan) => sum + loan.lp_distribution, 0);
      
      pieData.push({
        name: 'Others',
        value: othersValue,
        zone: 'multiple',
        exitType: 'multiple',
        fullId: 'others'
      });
    }

    // For the bar chart - distribution by zone
    const zoneData = Object.entries(zoneDistributions)
      .map(([zone, value]) => ({
        name: zone,
        value
      }))
      .sort((a, b) => b.value - a.value);

    // For the bar chart - distribution by exit type
    const exitTypeData = Object.entries(exitTypeDistributions)
      .map(([exitType, value]) => ({
        name: exitType,
        value
      }))
      .sort((a, b) => b.value - a.value);

    return {
      pieData,
      zoneData,
      exitTypeData
    };
  }, [filteredLoans, zoneDistributions, exitTypeDistributions]);

  // Colors for various chart elements
  const zoneColors: Record<string, string> = {
    green: '#10b981',
    orange: '#f97316',
    red: '#ef4444',
    unknown: '#94a3b8',
    multiple: '#8b5cf6'
  };

  const exitTypeColors: Record<string, string> = {
    normal: '#3b82f6',
    default: '#ef4444',
    reinvested: '#10b981',
    'early-exit': '#f59e0b',
    maturity: '#8b5cf6',
    multiple: '#94a3b8'
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-7 w-64 bg-muted animate-pulse rounded"></div>
          </CardTitle>
          <CardDescription>
            <div className="h-5 w-96 bg-muted animate-pulse rounded"></div>
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="h-full w-full bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Render no data state
  if (!hasData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loan Distribution Breakdown</CardTitle>
          <CardDescription>
            See how individual loans contribute to the overall distributions
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No loan contribution data available</p>
            <p className="text-sm text-muted-foreground">
              This data requires loan-to-waterfall correlation tracking to be enabled.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Loan Distribution Breakdown</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewType === 'bar' ? 'default' : 'outline'}
              onClick={() => setViewType('bar')}
              className="h-8 px-2"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewType === 'pie' ? 'default' : 'outline'}
              onClick={() => setViewType('pie')}
              className="h-8 px-2"
            >
              <PieChart className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewType === 'list' ? 'default' : 'outline'}
              onClick={() => setViewType('list')}
              className="h-8 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <div className="text-sm text-muted-foreground flex items-center justify-between">
          <span>
            See how individual loans contribute to the overall distributions
          </span>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-md text-xs px-2 py-1"
              value={yearFilter !== null ? yearFilter : ''}
              onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md text-xs px-2 py-1"
              value={zoneFilter || ''}
              onChange={(e) => setZoneFilter(e.target.value || null)}
            >
              <option value="">All Zones</option>
              {Object.keys(zoneDistributions).map((zone) => (
                <option key={zone} value={zone}>
                  {zone.charAt(0).toUpperCase() + zone.slice(1)}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md text-xs px-2 py-1"
              value={exitTypeFilter || ''}
              onChange={(e) => setExitTypeFilter(e.target.value || null)}
            >
              <option value="">All Exit Types</option>
              {Object.keys(exitTypeDistributions).map((exitType) => (
                <option key={exitType} value={exitType}>
                  {exitType.charAt(0).toUpperCase() + exitType.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Total LP Distributions</div>
            <div className="text-2xl font-semibold">{formatCurrency(totalDistributions)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Filtered Loans</div>
            <div className="text-2xl font-semibold">{filteredLoans.length}</div>
          </div>
        </div>

        {/* Bar Chart View */}
        {viewType === 'bar' && (
          <Tabs defaultValue="loans" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="loans">By Loan</TabsTrigger>
              <TabsTrigger value="zones">By Zone</TabsTrigger>
              <TabsTrigger value="exitTypes">By Exit Type</TabsTrigger>
            </TabsList>
            
            <TabsContent value="loans" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredLoans.slice(0, 10).map(loan => ({
                    name: `Loan ${loan.id.substring(0, 6)}...`,
                    value: loan.lp_distribution,
                    zone: loan.zone,
                    fill: zoneColors[loan.zone || 'unknown']
                  }))}
                  margin={{ top: 5, right: 20, bottom: 30, left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value), 'Distribution']}
                    labelFormatter={(name) => `Loan ${name}`}
                  />
                  <Bar dataKey="value" name="Distribution" fill="#3b82f6">
                    {filteredLoans.slice(0, 10).map((loan, index) => (
                      <Cell key={`cell-${index}`} fill={zoneColors[loan.zone || 'unknown']} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="zones" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.zoneData}
                  margin={{ top: 5, right: 20, bottom: 30, left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value), 'Distribution']}
                    labelFormatter={(name) => `Zone: ${name}`}
                  />
                  <Bar dataKey="value" name="Distribution">
                    {chartData.zoneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={zoneColors[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="exitTypes" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.exitTypeData}
                  margin={{ top: 5, right: 20, bottom: 30, left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value), 'Distribution']}
                    labelFormatter={(name) => `Exit Type: ${name}`}
                  />
                  <Bar dataKey="value" name="Distribution">
                    {chartData.exitTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={exitTypeColors[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Pie Chart View */}
        {viewType === 'pie' && (
          <Tabs defaultValue="loans" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="loans">By Loan</TabsTrigger>
              <TabsTrigger value="zones">By Zone</TabsTrigger>
              <TabsTrigger value="exitTypes">By Exit Type</TabsTrigger>
            </TabsList>
            
            <TabsContent value="loans" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={1}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={zoneColors[entry.zone as keyof typeof zoneColors] || '#94a3b8'} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Distribution']}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="zones" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData.zoneData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={1}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {chartData.zoneData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={zoneColors[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Distribution']}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="exitTypes" className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={chartData.exitTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={1}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {chartData.exitTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={exitTypeColors[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Distribution']}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )}
        
        {/* List View */}
        {viewType === 'list' && (
          <div className="h-[330px]">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr] text-xs font-medium mb-2 p-2 border-b">
                <div>Loan</div>
                <div>Distribution</div>
                <div>Zone</div>
                <div>Exit Type</div>
                <div>Amount</div>
              </div>
              {filteredLoans.map((loan) => (
                <div 
                  key={loan.id}
                  className="grid grid-cols-[2fr,1fr,1fr,1fr,1fr] text-xs p-2 hover:bg-muted/50 border-b"
                >
                  <div className="overflow-hidden text-ellipsis">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{loan.id}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="text-xs space-y-1">
                            <div>LTV: {formatPercentage(loan.ltv)}</div>
                            <div>Reinvested: {loan.reinvested ? 'Yes' : 'No'}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div>{formatCurrency(loan.lp_distribution)}</div>
                  <div>
                    <Badge 
                      className="bg-opacity-80" 
                      style={{ backgroundColor: zoneColors[loan.zone || 'unknown'] }}
                    >
                      {loan.zone || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={
                        loan.is_default
                          ? 'text-red-500 border-red-500'
                          : loan.reinvested
                          ? 'text-green-500 border-green-500'
                          : 'text-blue-500 border-blue-500'
                      }
                    >
                      {loan.is_default
                        ? 'Default'
                        : loan.exit_reason || (loan.reinvested ? 'Reinvested' : 'Normal')}
                    </Badge>
                  </div>
                  <div>{formatCurrency(loan.loan_amount)}</div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 