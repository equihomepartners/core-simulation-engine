import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { formatPercentage, formatCurrency } from '@/lib/formatters';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface IRRComponentsCardProps {
  results: any;
  isLoading: boolean;
}

export function IRRComponentsCard({ results, isLoading }: IRRComponentsCardProps) {
  const [activeTab, setActiveTab] = useState<'gross' | 'fund' | 'lp'>('gross');
  const [showDollarValues, setShowDollarValues] = useState(false);

  // Extract IRR component data from results
  const irrComponentData = React.useMemo(() => {
    if (isLoading || !results || !results.metrics) return null;

    const metrics = results.metrics;

    // Get waterfall results
    const waterfallResults = results.waterfall_results || results.waterfallResults || {};

    // Extract LP IRR from waterfall results or metrics
    const lpIrr = waterfallResults.lp_irr || waterfallResults.lpIrr ||
                 waterfallResults.lp_net_irr || waterfallResults.lpNetIrr ||
                 metrics.lp_irr || metrics.lpIrr || 0;

    // For Fund IRR, use metrics without estimation
    const fundIrr = (metrics.fund_irr !== null && metrics.fund_irr !== undefined) ? metrics.fund_irr :
                   (metrics.fundIrr !== null && metrics.fundIrr !== undefined) ? metrics.fundIrr :
                   (metrics.irr !== null && metrics.irr !== undefined) ? metrics.irr : 0;

    // For Gross IRR, use metrics without estimation
    const grossIrr = (metrics.gross_irr !== null && metrics.gross_irr !== undefined) ? metrics.gross_irr :
                    (metrics.grossIrr !== null && metrics.grossIrr !== undefined) ? metrics.grossIrr : 0;

    // Log IRR values
    console.log('IRR Components Card - IRR values:', { lpIrr, fundIrr, grossIrr });

    // Get IRR components
    const irrComponents = metrics.irr_components || metrics.irrComponents || {};

    // Use actual IRR components if available, otherwise use conservative estimates
    const appreciation = irrComponents.appreciation !== undefined ? irrComponents.appreciation :
                        (grossIrr > 0 ? grossIrr * 0.5 : 0); // More conservative estimate
    const interest = irrComponents.interest !== undefined ? irrComponents.interest :
                    (grossIrr > 0 ? grossIrr * 0.5 : 0); // More conservative estimate

    // Get fund size for dollar value calculations
    const fundSize = metrics.fund_size || metrics.fundSize || results.config?.fund_size || 100000000; // Default to $100M
    const fundTerm = metrics.fund_term || metrics.fundTerm || results.config?.fund_term || 10; // Default to 10 years

    // Calculate dollar values (approximate)
    const appreciationDollar = fundSize * appreciation * fundTerm / 10;
    const interestDollar = fundSize * interest * fundTerm / 10;

    // Calculate management fee impact
    // Management fee impact is typically about 20% of Gross IRR
    const managementFeeImpact = grossIrr > 0 && fundIrr > 0 ? grossIrr - fundIrr : grossIrr * 0.2;
    const managementFeesDollar = managementFeeImpact * fundSize * fundTerm / 10;

    // Calculate carried interest impact
    // Carried interest impact is typically about 10% of Fund IRR
    const carriedInterestImpact = fundIrr > 0 && lpIrr > 0 ? fundIrr - lpIrr : fundIrr * 0.1;
    const carriedInterestDollar = carriedInterestImpact * fundSize * fundTerm / 10;

    // Prepare data for each IRR type
    const grossIrrData = [
      {
        name: 'Interest',
        value: interest * 100,
        dollarValue: interestDollar,
        color: '#22c55e', // green
      },
      {
        name: 'Appreciation',
        value: appreciation * 100,
        dollarValue: appreciationDollar,
        color: '#3b82f6', // blue
      }
    ];

    const fundIrrData = [
      {
        name: 'Interest',
        value: interest * 100,
        dollarValue: interestDollar,
        color: '#22c55e', // green
      },
      {
        name: 'Appreciation',
        value: appreciation * 100,
        dollarValue: appreciationDollar,
        color: '#3b82f6', // blue
      },
      {
        name: 'Management Fees',
        value: -managementFeeImpact * 100,
        dollarValue: -managementFeesDollar,
        color: '#ef4444', // red
      }
    ];

    const lpIrrData = [
      {
        name: 'Interest',
        value: interest * 100,
        dollarValue: interestDollar,
        color: '#22c55e', // green
      },
      {
        name: 'Appreciation',
        value: appreciation * 100,
        dollarValue: appreciationDollar,
        color: '#3b82f6', // blue
      },
      {
        name: 'Management Fees',
        value: -managementFeeImpact * 100,
        dollarValue: -managementFeesDollar,
        color: '#ef4444', // red
      },
      {
        name: 'Carried Interest',
        value: -carriedInterestImpact * 100,
        dollarValue: -carriedInterestDollar,
        color: '#f97316', // orange
      }
    ];

    return {
      grossIrr,
      fundIrr,
      lpIrr,
      grossIrrData,
      fundIrrData,
      lpIrrData,
      fundSize,
      fundTerm
    };
  }, [results, isLoading]);

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string, props: any) => {
    const item = props.payload;
    if (showDollarValues) {
      return [`$${(Math.abs(value) / 1000000).toFixed(1)}M`, item.name];
    }
    return [`${Math.abs(value).toFixed(1)}%`, item.name];
  };

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!irrComponentData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No IRR component data available</p>
      </div>
    );
  }

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              IRR Component Breakdown
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>
                      This chart breaks down the components of each IRR type, showing how interest income,
                      property appreciation, management fees, and carried interest contribute to the final returns.
                      Use the tabs to view the breakdown for each IRR type.
                    </p>
                    <p className="mt-2">
                      Toggle the "Dollar Values" switch to see the impact in dollar terms instead of percentages.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Detailed component analysis of Gross, Fund, and LP IRR
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Dollar Values</span>
              <button
                onClick={() => setShowDollarValues(!showDollarValues)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full ${showDollarValues ? 'bg-green-100' : 'bg-muted'}`}
              >
                <div
                  className={`absolute mx-0.5 h-4 w-4 rounded-full transition-transform ${
                    showDollarValues ? 'translate-x-5 bg-green-500' : 'translate-x-0 bg-gray-400'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)]">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'gross' | 'fund' | 'lp')} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="gross" className="flex items-center justify-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm">
              <span className="h-3 w-3 rounded-full bg-green-600"></span>
              Gross IRR
            </TabsTrigger>
            <TabsTrigger value="fund" className="flex items-center justify-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm">
              <span className="h-3 w-3 rounded-full bg-blue-600"></span>
              Fund IRR
            </TabsTrigger>
            <TabsTrigger value="lp" className="flex items-center justify-center gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm">
              <span className="h-3 w-3 rounded-full bg-indigo-600"></span>
              LP IRR
            </TabsTrigger>
          </TabsList>

          <div className="h-[calc(100%-50px)]">
            <TabsContent value="gross" className="h-full mt-0">
              <div className="flex flex-col h-full">
                <div className="text-center mb-4">
                  <div className="text-sm text-muted-foreground">Gross IRR</div>
                  <div className="text-2xl font-bold text-green-600">{formatPercentage(irrComponentData.grossIrr)}</div>
                  <div className="text-xs text-muted-foreground">Pre-fee return on investments</div>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={irrComponentData.grossIrrData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                      />
                      <YAxis type="category" dataKey="name" width={90} />
                      <Tooltip formatter={tooltipFormatter} />
                      <Legend />
                      <Bar
                        dataKey={showDollarValues ? "dollarValue" : "value"}
                        name={showDollarValues ? "Dollar Value" : "Contribution to IRR"}
                      >
                        {irrComponentData.grossIrrData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey={showDollarValues ? "dollarValue" : "value"}
                          position="right"
                          formatter={(value: number) => showDollarValues
                            ? `$${(value / 1000000).toFixed(1)}M`
                            : `${value.toFixed(1)}%`
                          }
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fund" className="h-full mt-0">
              <div className="flex flex-col h-full">
                <div className="text-center mb-4">
                  <div className="text-sm text-muted-foreground">Fund IRR</div>
                  <div className="text-2xl font-bold text-blue-600">{formatPercentage(irrComponentData.fundIrr)}</div>
                  <div className="text-xs text-muted-foreground">Return after management fees</div>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={irrComponentData.fundIrrData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                      />
                      <YAxis type="category" dataKey="name" width={90} />
                      <Tooltip formatter={tooltipFormatter} />
                      <Legend />
                      <Bar
                        dataKey={showDollarValues ? "dollarValue" : "value"}
                        name={showDollarValues ? "Dollar Value" : "Contribution to IRR"}
                      >
                        {irrComponentData.fundIrrData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey={showDollarValues ? "dollarValue" : "value"}
                          position="right"
                          formatter={(value: number) => showDollarValues
                            ? `$${(value / 1000000).toFixed(1)}M`
                            : `${value.toFixed(1)}%`
                          }
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lp" className="h-full mt-0">
              <div className="flex flex-col h-full">
                <div className="text-center mb-4">
                  <div className="text-sm text-muted-foreground">LP IRR</div>
                  <div className="text-2xl font-bold text-indigo-600">{formatPercentage(irrComponentData.lpIrr)}</div>
                  <div className="text-xs text-muted-foreground">Final return to limited partners</div>
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={irrComponentData.lpIrrData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => showDollarValues ? `$${(value / 1000000).toFixed(0)}M` : `${value}%`}
                      />
                      <YAxis type="category" dataKey="name" width={90} />
                      <Tooltip formatter={tooltipFormatter} />
                      <Legend />
                      <Bar
                        dataKey={showDollarValues ? "dollarValue" : "value"}
                        name={showDollarValues ? "Dollar Value" : "Contribution to IRR"}
                      >
                        {irrComponentData.lpIrrData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey={showDollarValues ? "dollarValue" : "value"}
                          position="right"
                          formatter={(value: number) => showDollarValues
                            ? `$${(value / 1000000).toFixed(1)}M`
                            : `${value.toFixed(1)}%`
                          }
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
