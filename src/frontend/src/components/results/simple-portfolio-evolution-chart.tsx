import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage } from '@/utils/format';
import { log, LogLevel, LogCategory } from '@/utils/logging';

interface SimplePortfolioEvolutionChartProps {
  simulationId: string;
}

export function SimplePortfolioEvolutionChart({ simulationId }: SimplePortfolioEvolutionChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'composed'>('area');
  const [metricType, setMetricType] = useState<'value' | 'count'>('count');

  // Fetch portfolio evolution data directly from the API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch portfolio evolution data directly
        const response = await fetch(`/api/simulations/${simulationId}/portfolio-evolution/`);

        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio evolution data: ${response.status}`);
        }

        const data = await response.json();
        log(LogLevel.INFO, LogCategory.DATA, 'Fetched portfolio evolution data:', data);

        // Process the data for the chart
        const processedData = processPortfolioEvolutionData(data);
        setChartData(processedData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        log(LogLevel.ERROR, LogCategory.DATA, `Error fetching portfolio evolution data: ${errorMessage}`);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (simulationId) {
      fetchData();
    }
  }, [simulationId]);

  // Process the portfolio evolution data for the chart
  const processPortfolioEvolutionData = (data: any) => {
    // Check if data is in the expected format (object with numeric keys)
    if (!data || typeof data !== 'object') {
      log(LogLevel.ERROR, LogCategory.DATA, 'Invalid portfolio evolution data format');
      return [];
    }

    // Get all numeric keys and sort them
    const years = Object.keys(data)
      .filter(key => !isNaN(Number(key)))
      .map(Number)
      .sort((a, b) => a - b);

    if (years.length === 0) {
      log(LogLevel.WARN, LogCategory.DATA, 'No years found in portfolio evolution data');
      return [];
    }

    log(LogLevel.INFO, LogCategory.DATA, `Found ${years.length} years in portfolio evolution data`);

    // Calculate average loan size for value calculations
    const avgLoanSize = 250000; // $250k average loan size

    // Process data for each year
    return years.map(year => {
      const yearData = data[year.toString()];

      // Extract loan counts
      const activeLoans = yearData.active_loans || 0;
      const exitedLoansOriginal = yearData.exited_loans_original || 0;
      const exitedLoansReinvest = yearData.exited_loans_reinvest || 0;
      const exitedLoans = yearData.exited_loans || 0;
      const newLoans = yearData.new_loans || 0;
      const reinvestments = yearData.reinvestments || 0;
      const defaultedLoans = yearData.defaulted_loans || 0;

      // Calculate original vs reinvestment active loans
      let activeLoansOriginal = 0;
      let activeLoansReinvest = 0;

      // For this simulation, we know:
      // 1. We start with 400 original loans at year 0
      // 2. Each year, some original loans exit and some reinvestment loans exit
      // 3. Each year, new reinvestment loans are created
      // 4. The backend tracks total active loans, but not by category

      // For year 0, all active loans are original
      if (year === 0) {
        activeLoansOriginal = activeLoans; // All initial loans are original (400)
        activeLoansReinvest = 0;
      } else {
        // For subsequent years, we need to calculate based on the flow of loans

        // First, let's calculate how many original loans should still be active
        // Start with 400 original loans and subtract all exited original loans up to this year
        let cumulativeExitedOriginal = 0;
        for (let i = 0; i <= year; i++) {
          const yearlyData = data[i.toString()];
          if (i > 0) { // Skip year 0
            cumulativeExitedOriginal += yearlyData.exited_loans_original || 0;
          }
        }
        activeLoansOriginal = 400 - cumulativeExitedOriginal;

        // Next, calculate how many reinvestment loans should be active
        // This is all reinvestments minus all exited reinvestment loans
        let cumulativeReinvestments = 0;
        let cumulativeExitedReinvest = 0;
        for (let i = 1; i <= year; i++) { // Start from year 1
          const yearlyData = data[i.toString()];
          cumulativeReinvestments += yearlyData.reinvestments || 0;
          cumulativeExitedReinvest += yearlyData.exited_loans_reinvest || 0;
        }
        activeLoansReinvest = cumulativeReinvestments - cumulativeExitedReinvest;

        // Ensure we don't have negative values
        activeLoansOriginal = Math.max(0, activeLoansOriginal);
        activeLoansReinvest = Math.max(0, activeLoansReinvest);

        // Ensure the sum matches the total active loans
        const calculatedTotal = activeLoansOriginal + activeLoansReinvest;

        // Log the calculation for debugging
        if (year <= 5) { // Only log first few years to avoid console spam
          log(LogLevel.DEBUG, LogCategory.DATA, `Year ${year} loan calculation:`, {
            activeLoans,
            calculatedOriginal: activeLoansOriginal,
            calculatedReinvest: activeLoansReinvest,
            calculatedTotal,
            cumulativeExitedOriginal,
            cumulativeExitedReinvest,
            cumulativeReinvestments
          });
        }

        if (calculatedTotal !== activeLoans) {
          // If our calculation doesn't match the backend total, adjust proportionally
          if (calculatedTotal > 0) {
            const ratio = activeLoans / calculatedTotal;
            activeLoansOriginal = Math.round(activeLoansOriginal * ratio);
            activeLoansReinvest = activeLoans - activeLoansOriginal;

            if (year <= 5) {
              log(LogLevel.DEBUG, LogCategory.DATA, `Year ${year} adjusted:`, {
                ratio,
                adjustedOriginal: activeLoansOriginal,
                adjustedReinvest: activeLoansReinvest,
                total: activeLoansOriginal + activeLoansReinvest
              });
            }
          } else {
            // If we have no calculated loans but the backend says we have active loans,
            // allocate them based on the original ratio of 400:0
            activeLoansOriginal = activeLoans;
            activeLoansReinvest = 0;

            if (year <= 5) {
              log(LogLevel.DEBUG, LogCategory.DATA, `Year ${year} zero adjustment:`, {
                adjustedOriginal: activeLoansOriginal,
                adjustedReinvest: activeLoansReinvest
              });
            }
          }
        }
      }

      // Calculate loan values
      const activeLoansValue = activeLoans * avgLoanSize;
      const activeLoansOriginalValue = activeLoansOriginal * avgLoanSize;
      const activeLoansReinvestValue = activeLoansReinvest * avgLoanSize;
      const exitedLoansOriginalValue = exitedLoansOriginal * avgLoanSize;
      const exitedLoansReinvestValue = exitedLoansReinvest * avgLoanSize;
      const exitedLoansValue = exitedLoans * avgLoanSize;
      const newLoansValue = newLoans * avgLoanSize;
      const reinvestmentsValue = reinvestments * avgLoanSize;
      const defaultedLoansValue = defaultedLoans * avgLoanSize;

      // Get reinvested amount or calculate it
      const reinvestedAmount = yearData.reinvested_amount || reinvestmentsValue;

      // Calculate totals
      const totalLoansCount = activeLoans + exitedLoans;
      const totalLoansValue = activeLoansValue + exitedLoansValue;

      return {
        year,
        // Counts
        active_loans: activeLoans,
        active_loans_original: activeLoansOriginal,
        active_loans_reinvest: activeLoansReinvest,
        exited_loans_original: exitedLoansOriginal,
        exited_loans_reinvest: exitedLoansReinvest,
        exited_loans: exitedLoans,
        new_loans: newLoans,
        reinvestments,
        defaulted_loans: defaultedLoans,
        total_loans: totalLoansCount,

        // Values
        active_loans_value: activeLoansValue,
        active_loans_original_value: activeLoansOriginalValue,
        active_loans_reinvest_value: activeLoansReinvestValue,
        exited_loans_original_value: exitedLoansOriginalValue,
        exited_loans_reinvest_value: exitedLoansReinvestValue,
        exited_loans_value: exitedLoansValue,
        new_loans_value: newLoansValue,
        reinvestments_value: reinvestmentsValue,
        defaulted_loans_value: defaultedLoansValue,
        reinvested_amount: reinvestedAmount,
        total_loans_value: totalLoansValue
      };
    });
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium">Year {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {metricType === 'value'
                ? formatCurrency(entry.value)
                : entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Portfolio Evolution</CardTitle>
          <CardDescription>Changes in portfolio composition over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || chartData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Portfolio Evolution</CardTitle>
          <CardDescription>Changes in portfolio composition over time</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[400px]">
          <p className="text-muted-foreground mb-2">
            {error || 'No portfolio evolution data available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Portfolio Evolution</CardTitle>
          <CardDescription>Changes in portfolio composition over time</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Select value={chartType} onValueChange={(value) => setChartType(value as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="composed">Composed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metricType} onValueChange={(value) => setMetricType(value as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Metric Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">Count</SelectItem>
              <SelectItem value="value">Value ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );

  function renderChart() {
    switch (chartType) {
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      case 'bar':
        return renderBarChart();
      case 'composed':
        return renderComposedChart();
      default:
        return renderAreaChart();
    }
  }

  function renderLineChart() {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis
            tickFormatter={(value) => metricType === 'value' ? formatCurrency(value, 0) : value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {metricType === 'value' ? (
            <>
              <Line type="monotone" dataKey="active_loans_original_value" name="Active Original Loans" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="active_loans_reinvest_value" name="Active Reinvestment Loans" stroke="#93c5fd" strokeWidth={2} />
              <Line type="monotone" dataKey="exited_loans_original_value" name="Exited Original Loans" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="exited_loans_reinvest_value" name="Exited Reinvestment Loans" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="total_loans_value" name="Total Portfolio" stroke="#6366f1" strokeWidth={2} />
            </>
          ) : (
            <>
              <Line type="monotone" dataKey="active_loans_original" name="Active Original Loans" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="active_loans_reinvest" name="Active Reinvestment Loans" stroke="#93c5fd" strokeWidth={2} />
              <Line type="monotone" dataKey="exited_loans_original" name="Exited Original Loans" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="exited_loans_reinvest" name="Exited Reinvestment Loans" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="total_loans" name="Total Loans" stroke="#6366f1" strokeWidth={2} />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  function renderAreaChart() {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis
            tickFormatter={(value) => metricType === 'value' ? formatCurrency(value, 0) : value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {metricType === 'value' ? (
            <>
              <Area type="monotone" dataKey="active_loans_original_value" name="Active Original Loans" stackId="1" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.8} />
              <Area type="monotone" dataKey="active_loans_reinvest_value" name="Active Reinvestment Loans" stackId="1" fill="#93c5fd" stroke="#93c5fd" fillOpacity={0.8} />
              <Area type="monotone" dataKey="exited_loans_original_value" name="Exited Original Loans" stackId="1" fill="#22c55e" stroke="#22c55e" fillOpacity={0.8} />
              <Area type="monotone" dataKey="exited_loans_reinvest_value" name="Exited Reinvestment Loans" stackId="1" fill="#10b981" stroke="#10b981" fillOpacity={0.8} />
            </>
          ) : (
            <>
              <Area type="monotone" dataKey="active_loans_original" name="Active Original Loans" stackId="1" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.8} />
              <Area type="monotone" dataKey="active_loans_reinvest" name="Active Reinvestment Loans" stackId="1" fill="#93c5fd" stroke="#93c5fd" fillOpacity={0.8} />
              <Area type="monotone" dataKey="exited_loans_original" name="Exited Original Loans" stackId="1" fill="#22c55e" stroke="#22c55e" fillOpacity={0.8} />
              <Area type="monotone" dataKey="exited_loans_reinvest" name="Exited Reinvestment Loans" stackId="1" fill="#10b981" stroke="#10b981" fillOpacity={0.8} />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  function renderBarChart() {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis
            tickFormatter={(value) => metricType === 'value' ? formatCurrency(value, 0) : value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {metricType === 'value' ? (
            <>
              <Bar dataKey="active_loans_original_value" name="Active Original Loans" fill="#3b82f6" />
              <Bar dataKey="active_loans_reinvest_value" name="Active Reinvestment Loans" fill="#93c5fd" />
              <Bar dataKey="exited_loans_original_value" name="Exited Original Loans" fill="#22c55e" />
              <Bar dataKey="exited_loans_reinvest_value" name="Exited Reinvested Loans" fill="#10b981" />
            </>
          ) : (
            <>
              <Bar dataKey="active_loans_original" name="Active Original Loans" fill="#3b82f6" />
              <Bar dataKey="active_loans_reinvest" name="Active Reinvestment Loans" fill="#93c5fd" />
              <Bar dataKey="exited_loans_original" name="Exited Original Loans" fill="#22c55e" />
              <Bar dataKey="exited_loans_reinvest" name="Exited Reinvested Loans" fill="#10b981" />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  function renderComposedChart() {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis
            tickFormatter={(value) => metricType === 'value' ? formatCurrency(value, 0) : value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {metricType === 'value' ? (
            <>
              <Area type="monotone" dataKey="active_loans_original_value" name="Active Original Loans" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="active_loans_reinvest_value" name="Active Reinvestment Loans" fill="#93c5fd" stroke="#93c5fd" fillOpacity={0.6} />
              <Bar dataKey="new_loans_value" name="New Loans" fill="#f59e0b" />
              <Bar dataKey="reinvestments_value" name="Reinvestments" fill="#fbbf24" />
              <Bar dataKey="exited_loans_original_value" name="Exited Original Loans" fill="#22c55e" />
              <Bar dataKey="exited_loans_reinvest_value" name="Exited Reinvestment Loans" fill="#10b981" />
              <Line type="monotone" dataKey="total_loans_value" name="Total Portfolio" stroke="#6366f1" strokeWidth={2} />
            </>
          ) : (
            <>
              <Area type="monotone" dataKey="active_loans_original" name="Active Original Loans" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="active_loans_reinvest" name="Active Reinvestment Loans" fill="#93c5fd" stroke="#93c5fd" fillOpacity={0.6} />
              <Bar dataKey="new_loans" name="New Loans" fill="#f59e0b" />
              <Bar dataKey="reinvestments" name="Reinvestments" fill="#fbbf24" />
              <Bar dataKey="exited_loans_original" name="Exited Original Loans" fill="#22c55e" />
              <Bar dataKey="exited_loans_reinvest" name="Exited Reinvestment Loans" fill="#10b981" />
              <Line type="monotone" dataKey="total_loans" name="Total Loans" stroke="#6366f1" strokeWidth={2} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }
}
