import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { formatCurrency, formatPercentage, formatNumber } from '../../lib/formatters';

interface LoanPerformanceProps {
  data: any;
  isLoading: boolean;
}

const LoanPerformance: React.FC<LoanPerformanceProps> = ({ data, isLoading }) => {
  const [performanceView, setPerformanceView] = useState<'exits' | 'defaults' | 'zones'>('exits');

  // Extract loan data
  const loans = data?.portfolio?.loans || [];

  // Process exit timing data
  const exitYearData = Array.from({ length: 16 }, (_, i) => ({
    year: i,
    expected: 0,
    actual: 0,
  }));

  loans.forEach((loan: any) => {
    const expectedYear = loan.expected_exit_year || loan.expectedExitYear;
    const actualYear = loan.actual_exit_year || loan.actualExitYear;
    const isExited = loan.is_exited || loan.isExited;

    if (expectedYear !== undefined && expectedYear < 16) {
      exitYearData[expectedYear].expected += 1;
    }

    if (isExited && actualYear !== undefined && actualYear < 16) {
      exitYearData[actualYear].actual += 1;
    }
  });

  // Process default data
  const defaultData = Array.from({ length: 16 }, (_, i) => ({
    year: i,
    defaults: 0,
    defaultRate: 0,
    cumulativeDefaults: 0,
    cumulativeDefaultRate: 0,
  }));

  let cumulativeDefaults = 0;
  const portfolioEvolution = data?.portfolio_evolution || data?.portfolioEvolution || {};

  Object.entries(portfolioEvolution).forEach(([year, yearData]: [string, any]) => {
    const yearNum = parseInt(year);
    if (yearNum < 16) {
      const defaults = yearData.defaulted_loans || yearData.defaultedLoans || 0;
      const activeLoans = yearData.active_loans || yearData.activeLoans || 0;
      const totalLoans = activeLoans + (yearData.exited_loans || yearData.exitedLoans || 0);

      cumulativeDefaults += defaults;

      defaultData[yearNum].defaults = defaults;
      defaultData[yearNum].defaultRate = totalLoans > 0 ? defaults / totalLoans : 0;
      defaultData[yearNum].cumulativeDefaults = cumulativeDefaults;
      defaultData[yearNum].cumulativeDefaultRate = totalLoans > 0 ? cumulativeDefaults / totalLoans : 0;
    }
  });

  // Process zone performance data
  const zonePerformanceData = loans.map((loan: any) => ({
    id: loan.id,
    loanAmount: parseFloat(loan.loan_amount || loan.loanAmount),
    ltv: parseFloat(loan.ltv),
    zone: loan.zone,
    isDefault: loan.is_default || loan.isDefault,
    isExited: loan.is_exited || loan.isExited,
    expectedExitYear: loan.expected_exit_year || loan.expectedExitYear,
    actualExitYear: loan.actual_exit_year || loan.actualExitYear,
    color: loan.zone === 'green' ? '#10b981' : loan.zone === 'orange' ? '#f59e0b' : '#ef4444',
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Loan Performance</CardTitle>
            <CardDescription>Analysis of loan exits, defaults, and zone performance</CardDescription>
          </div>
          <Tabs
            value={performanceView}
            onValueChange={(value) => setPerformanceView(value as 'exits' | 'defaults' | 'zones')}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exits">Exit Timing</TabsTrigger>
              <TabsTrigger value="defaults">Defaults</TabsTrigger>
              <TabsTrigger value="zones">Zone Analysis</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="h-[400px]">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : performanceView === 'exits' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={exitYearData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Number of Loans', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: number, name) => [formatNumber(value), name === 'expected' ? 'Expected Exits' : 'Actual Exits']}
                labelFormatter={(year) => `Year ${year}`}
              />
              <Legend />
              <Bar dataKey="expected" name="Expected Exits" fill="#3b82f6" />
              <Bar dataKey="actual" name="Actual Exits" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        ) : performanceView === 'defaults' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={defaultData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis yAxisId="left" label={{ value: 'Number of Loans', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${(value * 100).toFixed(1)}%`} label={{ value: 'Default Rate', angle: 90, position: 'insideRight' }} />
              <Tooltip
                formatter={(value: number, name) => {
                  if (name === 'defaults' || name === 'cumulativeDefaults') {
                    return [formatNumber(value), name === 'defaults' ? 'Defaults' : 'Cumulative Defaults'];
                  } else {
                    return [`${(value * 100).toFixed(2)}%`, name === 'defaultRate' ? 'Default Rate' : 'Cumulative Default Rate'];
                  }
                }}
                labelFormatter={(year) => `Year ${year}`}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="defaults" name="Defaults" stroke="#ef4444" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="cumulativeDefaults" name="Cumulative Defaults" stroke="#f59e0b" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="defaultRate" name="Default Rate" stroke="#3b82f6" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="cumulativeDefaultRate" name="Cumulative Default Rate" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="ltv"
                name="LTV"
                label={{ value: 'Loan-to-Value Ratio', position: 'insideBottom', offset: -5 }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                domain={['dataMin', 'dataMax']}
                type="number"
              />
              <YAxis
                dataKey="loanAmount"
                name="Loan Amount"
                label={{ value: 'Loan Amount', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={['dataMin', 'dataMax']}
              />
              <ZAxis range={[50, 500]} />
              <Tooltip
                formatter={(value: number, name) => {
                  if (name === 'loanAmount') {
                    return [formatCurrency(value), 'Loan Amount'];
                  } else if (name === 'ltv') {
                    return [formatPercentage(value), 'LTV'];
                  }
                  return [value, name];
                }}
                labelFormatter={(index) => `Loan ${zonePerformanceData[index]?.id}`}
              />
              <Legend />
              <Scatter
                name="Green Zone"
                data={zonePerformanceData.filter((loan: any) => loan.zone === 'green')}
                fill="#10b981"
              />
              <Scatter
                name="Orange Zone"
                data={zonePerformanceData.filter((loan: any) => loan.zone === 'orange')}
                fill="#f59e0b"
              />
              <Scatter
                name="Red Zone"
                data={zonePerformanceData.filter((loan: any) => loan.zone === 'red')}
                fill="#ef4444"
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanPerformance;
