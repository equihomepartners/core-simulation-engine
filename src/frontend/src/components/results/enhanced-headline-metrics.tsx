import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricCard } from '@/components/ui/metric-card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatCurrency, formatPercentage, formatMultiple } from '@/utils/format';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Users,
  Briefcase
} from 'lucide-react';

interface EnhancedHeadlineMetricsProps {
  data: any;
  simulation?: any;
  isLoading?: boolean;
}

export function EnhancedHeadlineMetrics({ data, simulation, isLoading = false }: EnhancedHeadlineMetricsProps) {
  // Extract metrics from results or simulation with camelCase/snake_case handling
  const metrics = React.useMemo(() => {
    if (isLoading) return null;

    // Try to get metrics from results first, then fall back to simulation
    // Handle both camelCase and snake_case property names
    const metricsData = data?.metrics || data?.metricsData || simulation?.metrics || simulation?.metricsData;

    if (!metricsData) {
      log(LogLevel.WARN, LogCategory.DATA, 'Missing metrics data in EnhancedHeadlineMetrics');
      return null;
    }

    // Create a normalized metrics object that handles both camelCase and snake_case
    const normalizedMetrics = {
      // IRR metrics
      irr: metricsData.irr,
      fund_irr: metricsData.fund_irr || metricsData.fundIrr || metricsData.irr,
      gross_irr: metricsData.gross_irr || metricsData.grossIrr,
      lp_irr: metricsData.lp_irr || metricsData.lpIrr,

      // Multiple metrics
      multiple: metricsData.multiple || metricsData.moic,
      gross_multiple: metricsData.gross_multiple || metricsData.grossMultiple || metricsData.gross_moic || metricsData.grossMoic,
      lp_multiple: metricsData.lp_multiple || metricsData.lpMultiple,

      // Distribution metrics
      dpi: metricsData.dpi,
      rvpi: metricsData.rvpi,
      pic: metricsData.pic,

      // Cash flow metrics
      total_distributions: metricsData.total_distributions || metricsData.totalDistributions,
      total_capital_calls: metricsData.total_capital_calls || metricsData.totalCapitalCalls,
      net_cash_flow: metricsData.net_cash_flow || metricsData.netCashFlow,
      uncalled_capital: metricsData.uncalled_capital || metricsData.uncalledCapital,

      // Return metrics
      realized_return: metricsData.realized_return || metricsData.realizedReturn,
      unrealized_return: metricsData.unrealized_return || metricsData.unrealizedReturn,

      // Portfolio metrics
      total_loans: metricsData.total_loans || metricsData.totalLoans,
      active_loans: metricsData.active_loans || metricsData.activeLoans,
      exited_loans: metricsData.exited_loans || metricsData.exitedLoans,
      avg_loan_size: metricsData.avg_loan_size || metricsData.avgLoanSize,
    };

    return normalizedMetrics;
  }, [data, simulation, isLoading]);

  // Extract fund size from different possible locations
  const fundSize = React.useMemo(() => {
    if (isLoading) return null;

    // Try different possible locations for fund size with camelCase/snake_case handling
    return data?.fund_size || data?.fundSize ||
           simulation?.config?.fund_size || simulation?.config?.fundSize ||
           data?.config?.fund_size || data?.config?.fundSize ||
           simulation?.fund_size || simulation?.fundSize;
  }, [data, simulation, isLoading]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(8).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[100px]" />
              <Skeleton className="h-4 w-[60px] mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>LP Economics</CardTitle>
          <CardDescription>Key performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">No metrics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-sm border-0">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">LP Economics</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Key performance metrics for limited partners</CardDescription>
          </div>
          {metrics.lp_irr !== undefined ? (
            <div className="flex items-center bg-muted/30 px-3 py-1.5 rounded-lg">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              <div>
                <span className="text-xs text-muted-foreground mr-1.5">LP Net IRR:</span>
                <span className="text-base font-semibold text-primary">{formatPercentage(metrics.lp_irr)}</span>
              </div>
            </div>
          ) : metrics.fund_irr !== undefined ? (
            <div className="flex items-center bg-muted/30 px-3 py-1.5 rounded-lg">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
              <div>
                <span className="text-xs text-muted-foreground mr-1.5">Fund IRR:</span>
                <span className="text-base font-semibold text-blue-600">{formatPercentage(metrics.fund_irr)}</span>
              </div>
            </div>
          ) : metrics.irr !== undefined && (
            <div className="flex items-center bg-muted/30 px-3 py-1.5 rounded-lg">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
              <div>
                <span className="text-xs text-muted-foreground mr-1.5">Fund IRR:</span>
                <span className="text-base font-semibold text-blue-600">{formatPercentage(metrics.irr)}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 w-full justify-start border-b pb-0 pt-0 h-auto">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 font-medium">
              Overview
            </TabsTrigger>
            <TabsTrigger value="returns" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 font-medium">
              Returns
            </TabsTrigger>
            <TabsTrigger value="cashflows" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 font-medium">
              Cash Flows
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 font-medium">
              Portfolio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="LP IRR"
                value={metrics.lp_irr}
                description="LP Net Internal Rate of Return"
                icon={<TrendingUp className="h-5 w-5 text-primary/70" />}
                formatter={formatPercentage}
                valueClassName="text-xl font-bold text-primary"
              />

              <MetricCard
                title="LP Multiple"
                value={metrics.lp_multiple}
                description="LP Total Value to Paid-In"
                icon={<BarChart className="h-5 w-5 text-primary/70" />}
                formatter={formatMultiple}
                valueClassName="text-xl font-bold text-primary"
              />

              <MetricCard
                title="Fund Size"
                value={fundSize}
                description="Total committed capital"
                icon={<DollarSign className="h-5 w-5 text-primary/70" />}
                formatter={formatCurrency}
                valueClassName="text-xl font-bold"
              />

              <MetricCard
                title="Fund Term"
                value={data?.config?.fund_term || simulation?.config?.fund_term}
                description="Investment period duration"
                icon={<Calendar className="h-5 w-5 text-primary/70" />}
                formatter={(val) => `${val} years`}
                valueClassName="text-xl font-bold"
              />
            </div>
          </TabsContent>

          <TabsContent value="returns" className="space-y-6 mt-0">
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
              <MetricCard
                title="Gross IRR"
                value={metrics.gross_irr}
                description="Before any fees or carried interest"
                icon={<TrendingUp className="h-5 w-5 text-green-600/70" />}
                formatter={formatPercentage}
                valueClassName="text-xl font-bold text-green-600"
              />

              <MetricCard
                title="Fund IRR"
                value={metrics.fund_irr}
                description="After management fees, before carried interest"
                icon={<TrendingUp className="h-5 w-5 text-blue-600/70" />}
                formatter={formatPercentage}
                valueClassName="text-xl font-bold text-blue-600"
              />

              <MetricCard
                title="LP IRR"
                value={metrics.lp_irr}
                description="After all fees and carried interest"
                icon={<TrendingUp className="h-5 w-5 text-primary/70" />}
                formatter={formatPercentage}
                valueClassName="text-xl font-bold text-primary"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
              <MetricCard
                title="Gross Multiple"
                value={metrics.gross_multiple}
                description="Before any fees or carried interest"
                icon={<BarChart className="h-5 w-5 text-green-600/70" />}
                formatter={formatMultiple}
                valueClassName="text-xl font-bold text-green-600"
              />

              <MetricCard
                title="Fund Multiple"
                value={metrics.multiple}
                description="After management fees, before carried interest"
                icon={<BarChart className="h-5 w-5 text-blue-600/70" />}
                formatter={formatMultiple}
                valueClassName="text-xl font-bold text-blue-600"
              />

              <MetricCard
                title="LP Multiple"
                value={metrics.lp_multiple}
                description="After all fees and carried interest"
                icon={<BarChart className="h-5 w-5 text-primary/70" />}
                formatter={formatMultiple}
                valueClassName="text-xl font-bold text-primary"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="DPI"
                value={metrics.dpi}
                description="Distributions to Paid-In"
                icon={<ArrowUpRight className="h-5 w-5 text-primary/70" />}
                formatter={formatMultiple}
                valueClassName="text-xl font-bold"
              />

              <MetricCard
                title="RVPI"
                value={metrics.rvpi}
                description="Residual Value to Paid-In"
                icon={<PieChart className="h-5 w-5 text-primary/70" />}
                formatter={formatMultiple}
                valueClassName="text-xl font-bold"
              />

              <MetricCard
                title="PIC"
                value={metrics.pic}
                description="Paid-In Capital Ratio"
                icon={<ArrowDownRight className="h-5 w-5 text-primary/70" />}
                formatter={formatPercentage}
                valueClassName="text-xl font-bold"
              />

              <MetricCard
                title="Realized Return"
                value={metrics.realized_return}
                description="Return on exited investments"
                icon={<TrendingUp className="h-5 w-5 text-primary/70" />}
                formatter={formatPercentage}
                valueClassName="text-xl font-bold"
              />
            </div>
          </TabsContent>

          <TabsContent value="cashflows" className="space-y-6 mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Distributions"
                value={metrics.total_distributions}
                description="Total cash returned to LPs"
                icon={<ArrowUpRight className="h-5 w-5 text-green-600/70" />}
                formatter={formatCurrency}
                valueClassName="text-xl font-bold text-green-600"
              />

              <MetricCard
                title="Total Capital Calls"
                value={metrics.total_capital_calls}
                description="Total capital invested"
                icon={<ArrowDownRight className="h-5 w-5 text-red-600/70" />}
                formatter={formatCurrency}
                valueClassName="text-xl font-bold text-red-600"
              />

              <MetricCard
                title="Net Cash Flow"
                value={metrics.net_cash_flow}
                description="Distributions minus capital calls"
                icon={<DollarSign className="h-5 w-5 text-primary/70" />}
                formatter={formatCurrency}
                valueClassName={`text-xl font-bold ${metrics.net_cash_flow >= 0 ? "text-green-600" : "text-red-600"}`}
              />

              <MetricCard
                title="Uncalled Capital"
                value={metrics.uncalled_capital}
                description="Remaining capital to be called"
                icon={<Landmark className="h-5 w-5 text-primary/70" />}
                formatter={formatCurrency}
                valueClassName="text-xl font-bold"
              />
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6 mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Loans"
                value={metrics.total_loans}
                description="Number of loans in portfolio"
                icon={<Briefcase className="h-5 w-5 text-primary/70" />}
                formatter={(val) => val.toLocaleString()}
                valueClassName="text-xl font-bold"
              />

              <MetricCard
                title="Active Loans"
                value={metrics.active_loans}
                description="Current loans in portfolio"
                icon={<Briefcase className="h-5 w-5 text-green-600/70" />}
                formatter={(val) => val.toLocaleString()}
                valueClassName="text-xl font-bold text-green-600"
              />

              <MetricCard
                title="Exited Loans"
                value={metrics.exited_loans}
                description="Loans that have been repaid"
                icon={<Briefcase className="h-5 w-5 text-blue-600/70" />}
                formatter={(val) => val.toLocaleString()}
                valueClassName="text-xl font-bold text-blue-600"
              />

              <MetricCard
                title="Average Loan Size"
                value={metrics.avg_loan_size}
                description="Average size of loans in portfolio"
                icon={<DollarSign className="h-5 w-5 text-primary/70" />}
                formatter={formatCurrency}
                valueClassName="text-xl font-bold"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
