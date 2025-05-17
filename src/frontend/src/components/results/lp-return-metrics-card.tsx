import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatMultiple, formatCurrency } from '@/utils/format';
import { TrendingUp, BarChart, Layers, ArrowUpToLine, BarChart3, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LPReturnMetricsCardProps {
  results: any;
  isLoading: boolean;
}

export function LPReturnMetricsCard({ results, isLoading }: LPReturnMetricsCardProps) {
  const [activeTab, setActiveTab] = React.useState('irr');
  
  // Extract metrics from results
  const metrics = React.useMemo(() => {
    if (isLoading || !results || !results.metrics) return {};
    
    return {
      // IRR metrics
      gross_irr: results.metrics.gross_irr || results.metrics.grossIrr,
      fund_irr: results.metrics.fund_irr || results.metrics.fundIrr || results.metrics.irr,
      lp_irr: results.metrics.lp_irr || results.metrics.lpIrr,
      
      // Multiple metrics
      gross_multiple: results.metrics.gross_multiple || results.metrics.grossMultiple,
      fund_multiple: results.metrics.multiple || results.metrics.moic,
      lp_multiple: results.metrics.lp_multiple || results.metrics.lpMultiple,
      
      // ROI metrics
      gross_roi: results.metrics.gross_roi || results.metrics.grossRoi,
      fund_roi: results.metrics.roi || results.metrics.fundRoi,
      lp_roi: results.metrics.lp_roi || results.metrics.lpRoi,
      
      // Distribution metrics
      dpi: results.metrics.dpi,
      rvpi: results.metrics.rvpi,
      tvpi: results.metrics.tvpi,
      
      // Time metrics
      payback_period: results.metrics.payback_period || results.metrics.paybackPeriod,
      time_to_breakeven: results.metrics.time_to_breakeven || results.metrics.timeToBreakeven,
      
      // Fee metrics
      management_fees: results.metrics.management_fees || results.metrics.managementFees,
      carried_interest: results.metrics.carried_interest || results.metrics.carriedInterest,
      total_fees: (results.metrics.management_fees || results.metrics.managementFees || 0) + 
                 (results.metrics.carried_interest || results.metrics.carriedInterest || 0),
      
      // Fund parameters
      hurdle_rate: results.metrics.hurdle_rate || results.metrics.hurdleRate
    };
  }, [results, isLoading]);
  
  // Calculate fee impact on IRR
  const feeImpact = React.useMemo(() => {
    if (!metrics.gross_irr || !metrics.lp_irr) return null;
    
    const totalImpact = metrics.gross_irr - metrics.lp_irr;
    const managementFeeImpact = metrics.gross_irr - (metrics.fund_irr || metrics.gross_irr);
    const carriedInterestImpact = (metrics.fund_irr || metrics.gross_irr) - metrics.lp_irr;
    
    return {
      totalImpact,
      managementFeeImpact,
      carriedInterestImpact,
      managementFeePercentage: managementFeeImpact / totalImpact * 100,
      carriedInterestPercentage: carriedInterestImpact / totalImpact * 100
    };
  }, [metrics]);
  
  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Return Metrics</CardTitle>
            <CardDescription>Comprehensive LP return metrics</CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="irr">IRR</TabsTrigger>
              <TabsTrigger value="multiple">Multiple</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <TabsContent value="irr" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1.5" /> IRR Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Gross IRR</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Pre-Fee)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Return on investments before any fees or carried interest</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold text-green-600">
                    {formatPercentage(metrics.gross_irr)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm">Fund IRR</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Pre-Carry)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Return after management fees but before carried interest</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatPercentage(metrics.fund_irr)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                    <span className="text-sm">LP IRR</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Post-Fee)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Return to limited partners after all fees and carried interest</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold text-indigo-600">
                    {formatPercentage(metrics.lp_irr)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                    <span className="text-sm">Hurdle Rate</span>
                  </div>
                  <span className="text-lg font-semibold text-amber-600">
                    {formatPercentage(metrics.hurdle_rate)}
                  </span>
                </div>
              </div>
            </div>
            
            {feeImpact && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1.5" /> Fee Impact on IRR
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Management Fees</span>
                    <span className="text-lg font-semibold text-red-600">
                      -{formatPercentage(feeImpact.managementFeeImpact)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Carried Interest</span>
                    <span className="text-lg font-semibold text-red-600">
                      -{formatPercentage(feeImpact.carriedInterestImpact)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Fee Drag</span>
                    <span className="text-lg font-semibold text-red-600">
                      -{formatPercentage(feeImpact.totalImpact)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="multiple" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <Layers className="h-4 w-4 mr-1.5" /> Multiple Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Gross Multiple</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Pre-Fee)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total value to paid-in capital before any fees</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold text-green-600">
                    {formatMultiple(metrics.gross_multiple)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm">Fund Multiple</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Pre-Carry)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total value to paid-in capital after management fees</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatMultiple(metrics.fund_multiple)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                    <span className="text-sm">LP Multiple</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Post-Fee)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total value to paid-in capital after all fees</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold text-indigo-600">
                    {formatMultiple(metrics.lp_multiple)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <ArrowUpToLine className="h-4 w-4 mr-1.5" /> Distribution Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm">DPI</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Distributions to Paid-In)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ratio of distributions to paid-in capital</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatMultiple(metrics.dpi)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm">RVPI</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Residual Value to Paid-In)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ratio of remaining value to paid-in capital</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatMultiple(metrics.rvpi)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm">TVPI</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Total Value to Paid-In)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ratio of total value to paid-in capital (DPI + RVPI)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold">
                    {formatMultiple(metrics.tvpi)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="time" className="mt-0 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-1.5" /> Time Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm">Payback Period</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Years)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Time required to recover the initial investment</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold">
                    {metrics.payback_period ? `${metrics.payback_period.toFixed(1)} years` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm">Time to Breakeven</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="ml-1">
                          <span className="text-xs text-muted-foreground">(Years)</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Time until cumulative cash flow becomes positive</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-lg font-semibold">
                    {metrics.time_to_breakeven ? `${metrics.time_to_breakeven.toFixed(1)} years` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm">Fund Term</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {metrics.fund_term ? `${metrics.fund_term} years` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-1.5" /> Fee Metrics
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Management Fees</span>
                  <span className="text-lg font-semibold text-red-600">
                    {formatCurrency(metrics.management_fees)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Carried Interest</span>
                  <span className="text-lg font-semibold text-red-600">
                    {formatCurrency(metrics.carried_interest)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Fees</span>
                  <span className="text-lg font-semibold text-red-600">
                    {formatCurrency(metrics.total_fees)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  );
}
