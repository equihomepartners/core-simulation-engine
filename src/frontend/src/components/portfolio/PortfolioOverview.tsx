import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage, formatNumber, formatDecimal } from '../../lib/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BadgeCheck, Banknote, Building, Calculator, ChevronUp, Clock, Percent, PieChart as PieChartIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PortfolioOverviewProps {
  data: any;
  isLoading: boolean;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ data, isLoading }) => {
  // Extract portfolio metrics from data
  const portfolioMetrics = data?.portfolio?.metrics || {};
  const zoneDistribution = portfolioMetrics?.zone_distribution || portfolioMetrics?.zoneDistribution || {};
  const portfolioEvolution = data?.portfolio_evolution || data?.portfolioEvolution || {};
  const loans = data?.portfolio?.loans || [];
  const config = data?.config || {};

  // Get the last year with data for current portfolio state
  const years = Object.keys(portfolioEvolution).map(Number).sort((a, b) => b - a);
  const lastYear = years[0]?.toString();
  const lastYearData = lastYear ? portfolioEvolution[lastYear] : null;

  // Calculate additional metrics
  const avgLoanSize = portfolioMetrics?.total_loan_amount && portfolioMetrics?.loan_count
    ? portfolioMetrics.total_loan_amount / portfolioMetrics.loan_count
    : portfolioMetrics?.average_loan_size || portfolioMetrics?.averageLoanSize;

  const avgPropertyValue = portfolioMetrics?.total_property_value && portfolioMetrics?.loan_count
    ? portfolioMetrics.total_property_value / portfolioMetrics.loan_count
    : portfolioMetrics?.average_property_value || portfolioMetrics?.averagePropertyValue;

  // Calculate average loan term (use config as fallback)
  const avgLoanTerm = loans.length > 0
    ? loans.reduce((sum: number, loan: any) => sum + (loan.term || 0), 0) / loans.length
    : config?.avg_loan_term || config?.avgLoanTerm || 0;

  // Get the configured loan term for display when actual data is missing
  const configuredLoanTerm = config?.avg_loan_term || config?.avgLoanTerm;

  const activeLoans = lastYearData?.active_loans || lastYearData?.activeLoans || 0;
  const exitedLoans = lastYearData?.exited_loans || lastYearData?.exitedLoans || 0;
  const defaultedLoans = lastYearData?.defaulted_loans || lastYearData?.defaultedLoans || 0;
  const totalLoans = activeLoans + exitedLoans;
  const exitRate = totalLoans > 0 ? exitedLoans / totalLoans : 0;
  const defaultRate = totalLoans > 0 ? defaultedLoans / totalLoans : 0;

  // Prepare zone distribution data for pie chart
  const zoneData = Object.entries(zoneDistribution).map(([zone, info]: [string, any]) => {
    // Get zone color from backend if available, otherwise use default colors
    let zoneColor = info.color;
    if (!zoneColor) {
      // Use default colors only as fallback
      zoneColor = zone === 'green' ? '#10b981' : zone === 'orange' ? '#f59e0b' : '#ef4444';
    }

    return {
      name: zone.charAt(0).toUpperCase() + zone.slice(1),
      value: info.amount || 0,
      count: info.count || 0,
      percentage: info.percentage || 0,
      color: zoneColor,
      description: info.description || `${zone.charAt(0).toUpperCase() + zone.slice(1)} risk zone loans`
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-primary/70" />
            Portfolio Summary
          </CardTitle>
          <CardDescription>Key metrics and characteristics</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Portfolio Metrics */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <PieChartIcon className="h-4 w-4 mr-1" /> Portfolio Composition
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <Calculator className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Total Loans:</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatNumber(portfolioMetrics?.loan_count || portfolioMetrics?.loanCount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <Banknote className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Total Loan Amount:</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatCurrency(portfolioMetrics?.total_loan_amount || portfolioMetrics?.totalLoanAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Total Property Value:</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatCurrency(portfolioMetrics?.total_property_value || portfolioMetrics?.totalPropertyValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <Percent className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Portfolio Coverage:</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatPercentage(portfolioMetrics?.portfolio_coverage || portfolioMetrics?.portfolioCoverage ||
                        (data?.fund_size && portfolioMetrics?.total_loan_amount
                          ? portfolioMetrics.total_loan_amount / data.fund_size
                          : 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <BadgeCheck className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Reinvestment Status:</span>
                    </div>
                    <Badge variant={config?.enable_reinvestments === false ? "outline" : "default"} className={config?.enable_reinvestments === false ? "bg-muted" : ""}>
                      {config?.enable_reinvestments === false ? 'Disabled' : 'Enabled'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Loan Characteristics */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <Banknote className="h-4 w-4 mr-1" /> Loan Characteristics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <Calculator className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Avg Loan Size:</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatCurrency(avgLoanSize || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Avg Property Value:</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatCurrency(avgPropertyValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <Percent className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Avg Loan-to-Value:</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatPercentage(portfolioMetrics?.weighted_average_ltv || portfolioMetrics?.weightedAverageLtv || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <Percent className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Avg Interest Rate:</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatPercentage(portfolioMetrics?.weighted_average_interest_rate || portfolioMetrics?.weightedAverageInterestRate || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/40 group hover:bg-muted/30 p-1 rounded transition-colors">
                    <div className="flex items-center">
                      <ChevronUp className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium">Expected Default Rate:</span>
                    </div>
                    <span className="text-lg font-semibold">
                      {formatPercentage(portfolioMetrics?.expected_default_rate || portfolioMetrics?.expectedDefaultRate || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loan Lifecycle */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> Loan Lifecycle Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col p-3 border rounded-md hover:bg-muted/30 transition-colors">
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium text-sm">Avg Exit Year:</span>
                    </div>
                    {portfolioMetrics?.average_exit_year || portfolioMetrics?.averageExitYear ? (
                      <>
                        <span className="text-xl font-semibold">
                          {formatDecimal(portfolioMetrics?.average_exit_year || portfolioMetrics?.averageExitYear)}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Based on actual portfolio data
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-semibold text-muted">N/A</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          No exit year data available
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col p-3 border rounded-md hover:bg-muted/30 transition-colors">
                    <div className="flex items-center mb-1">
                      <Percent className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium text-sm">Early Exit Rate:</span>
                    </div>
                    {(portfolioMetrics?.early_exit_rate !== undefined || portfolioMetrics?.earlyExitRate !== undefined) ? (
                      <>
                        <span className="text-xl font-semibold">
                          {formatPercentage(portfolioMetrics?.early_exit_rate || portfolioMetrics?.earlyExitRate)}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Percentage of loans exiting before term
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-semibold text-muted">N/A</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          No early exit data available
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col p-3 border rounded-md hover:bg-muted/30 transition-colors">
                    <div className="flex items-center mb-1">
                      <Clock className="h-4 w-4 mr-2 text-primary/70" />
                      <span className="font-medium text-sm">Avg Loan Term:</span>
                    </div>
                    {avgLoanTerm > 0 ? (
                      <>
                        <span className="text-xl font-semibold">
                          {formatDecimal(avgLoanTerm)} years
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Based on actual portfolio data
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-semibold text-muted">N/A</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          No loan term data available
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <PieChartIcon className="h-5 w-5 mr-2 text-primary/70" />
            Risk Zone Distribution
          </CardTitle>
          <CardDescription>Allocation of loans by risk category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-[250px] w-[250px] rounded-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-[280px]">
                {zoneData.length > 0 && zoneData.some(zone => zone.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={zoneData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={2}
                        label={({ name, percentage }) => `${name} (${(percentage * 100).toFixed(1)}%)`}
                      >
                        {zoneData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0'
                        }}
                        formatter={(value: number, name, entry) => {
                          const item = entry.payload;
                          return [
                            <div className="space-y-1">
                              <div className="font-semibold">{formatCurrency(value)}</div>
                              <div className="text-sm">{`${item.count} loans (${(item.percentage * 100).toFixed(1)}%)`}</div>
                            </div>,
                            name
                          ];
                        }}
                        labelFormatter={(name) => `Zone: ${name}`}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={10}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <PieChartIcon className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-center">No zone distribution data available</p>
                    <p className="text-sm text-center mt-2">Run a simulation to generate portfolio data</p>
                  </div>
                )}
              </div>

              {zoneData.length > 0 && zoneData.some(zone => zone.value > 0) ? (
                <div className="grid grid-cols-3 gap-4">
                  {zoneData.map((zone, index) => {
                    const zoneClass = zone.name.toLowerCase();
                    return (
                      <div
                        key={index}
                        className={cn(
                          "border rounded-md p-4 transition-all hover:shadow-md",
                          zoneClass === 'green' && "border-green-200 bg-green-50/30",
                          zoneClass === 'orange' && "border-orange-200 bg-orange-50/30",
                          zoneClass === 'red' && "border-red-200 bg-red-50/30"
                        )}
                      >
                        <div className="flex items-center mb-2">
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: zone.color }}
                          ></div>
                          <div className="font-medium" style={{ color: zone.color }}>{zone.name}</div>
                        </div>
                        <div className="text-2xl font-bold mb-1">{formatNumber(zone.count)}</div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {zone.count === 1 ? 'loan' : 'loans'}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium",
                              zoneClass === 'green' && "bg-green-100/50 text-green-700",
                              zoneClass === 'orange' && "bg-orange-100/50 text-orange-700",
                              zoneClass === 'red' && "bg-red-100/50 text-red-700"
                            )}
                          >
                            {formatPercentage(zone.percentage)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {zone.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
