import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatMultiple, formatCurrency, formatNumber } from '@/utils/format';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis, Cell, BarChart, Bar, ReferenceLine } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LoanDistributionProps {
  results: any;
  isLoading: boolean;
}

export function LoanDistribution({
  results,
  isLoading
}: LoanDistributionProps) {
  // Extract loan data for vintage year IRR chart
  const vintageIRRData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from loans directly or from portfolio.loans
    const loansArray = Array.isArray(results.loans) ? results.loans :
                      (results.portfolio && Array.isArray(results.portfolio.loans) ? results.portfolio.loans : null);

    if (loansArray) {
      console.log('Found loans array with length:', loansArray.length);

      // Group loans by vintage year
      const vintageGroups = new Map();

      loansArray.forEach((loan: any) => {
        const vintage = loan.origination_year || 0;

        // Use loan IRR if available, otherwise use zone's average IRR
        let irr = loan.irr;
        if (irr === undefined || irr === null) {
          // Try to get from zone performance
          const zone = loan.zone?.toLowerCase();
          if (zone && results.zone_performance && results.zone_performance[zone]?.irr !== undefined) {
            irr = results.zone_performance[zone].irr;
          } else {
            // Use default IRR based on zone
            irr = zone === 'green' ? 0.12 :
                  zone === 'orange' ? 0.15 :
                  zone === 'red' ? 0.18 : 0.10;
          }
        }

        if (!vintageGroups.has(vintage)) {
          vintageGroups.set(vintage, []);
        }

        vintageGroups.get(vintage).push(irr);
      });

      // Calculate median IRR for each vintage
      const vintageData = [];

      for (const [vintage, irrs] of vintageGroups.entries()) {
        if (irrs.length === 0) continue;

        // Calculate median IRR
        irrs.sort((a: number, b: number) => a - b);
        const medianIndex = Math.floor(irrs.length / 2);
        const median = irrs.length % 2 === 0
          ? (irrs[medianIndex - 1] + irrs[medianIndex]) / 2
          : irrs[medianIndex];

        vintageData.push({
          vintage: `Y${vintage}`,
          median,
          count: irrs.length
        });
      }

      // Sort by vintage year
      vintageData.sort((a, b) => parseInt(a.vintage.substring(1)) - parseInt(b.vintage.substring(1)));

      return vintageData;
    }

    console.log('No loans array found in results');
    return [];
  }, [results, isLoading]);

  // Extract loan data for scatter plot
  const scatterData = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from loans directly or from portfolio.loans
    const loansArray = Array.isArray(results.loans) ? results.loans :
                      (results.portfolio && Array.isArray(results.portfolio.loans) ? results.portfolio.loans : null);

    if (loansArray) {
      return loansArray
        .filter((loan: any) => loan.ltv !== undefined)
        .map((loan: any) => {
          // Use loan IRR if available, otherwise use zone's average IRR
          let irr = loan.irr;
          if (irr === undefined || irr === null) {
            // Try to get from zone performance
            const zone = loan.zone?.toLowerCase();
            if (zone && results.zone_performance && results.zone_performance[zone]?.irr !== undefined) {
              irr = results.zone_performance[zone].irr;
            } else {
              // Use default IRR based on zone
              irr = zone === 'green' ? 0.12 :
                    zone === 'orange' ? 0.15 :
                    zone === 'red' ? 0.18 : 0.10;
            }
          }

          return {
            ltv: loan.ltv,
            irr: irr,
            zone: loan.zone?.toLowerCase() || 'unknown',
            id: loan.id || loan.loan_id
          };
        });
    }

    return [];
  }, [results, isLoading]);

  // Extract top loans by GP carry contribution
  const topLoans = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from loans directly or from portfolio.loans
    const loansArray = Array.isArray(results.loans) ? results.loans :
                      (results.portfolio && Array.isArray(results.portfolio.loans) ? results.portfolio.loans : null);

    if (loansArray) {
      // Calculate carry contribution for each loan
      const loansWithCarry = loansArray
        .map((loan: any) => {
          const loanAmount = loan.loan_amount;
          if (loanAmount === undefined) return null; // Skip if no loan amount

          // Use loan IRR if available, otherwise use zone's average IRR
          let irr = loan.irr;
          if (irr === undefined || irr === null) {
            // Try to get from zone performance
            const zone = loan.zone?.toLowerCase();
            if (zone && results.zone_performance && results.zone_performance[zone]?.irr !== undefined) {
              irr = results.zone_performance[zone].irr;
            } else {
              // Use default IRR based on zone
              irr = zone === 'green' ? 0.12 :
                    zone === 'orange' ? 0.15 :
                    zone === 'red' ? 0.18 : 0.10;
            }
          }

          // Use expected_exit_year if available, otherwise use exit_year or actual_exit_year
          const exitYear = loan.expected_exit_year || loan.exit_year || loan.actual_exit_year || 5;

          // Use hurdle_rate from results.parameters or default to 0.08
          const hurdle = results.parameters?.hurdle_rate || 0.08;

          // Use carried_interest_rate from results.parameters or default to 0.20
          const carryRate = results.parameters?.carried_interest_rate || 0.20;

          // Simple carry calculation: (IRR - Hurdle) * Loan Amount * Carry Rate
          const carryContribution = Math.max(0, irr - hurdle) * loanAmount * carryRate;

          return {
            id: loan.id || loan.loan_id,
            suburb: loan.suburb || (loan.suburb_id ? `Suburb ${loan.suburb_id}` : 'Unknown'),
            zone: loan.zone || 'Unknown',
            exitYear,
            irr,
            loanAmount,
            carryContribution
          };
        });

      // Filter out null values, sort by carry contribution and take top 10
      const validLoans = loansWithCarry.filter(loan => loan !== null);
      if (validLoans.length === 0) return [];

      validLoans.sort((a, b) => b.carryContribution - a.carryContribution);
      return validLoans.slice(0, 10);
    }

    console.log('No loans array found for top loans');
    return [];
  }, [results, isLoading]);

  return (
    <div className="space-y-8">
      {/* IRR by Vintage Year */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>IRR by Vintage Year</CardTitle>
          <CardDescription>Median IRR for each loan vintage year</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : vintageIRRData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vintageIRRData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vintage" />
                <YAxis
                  tickFormatter={(value) => typeof value === 'number' ? formatPercentage(value, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) : '0%'}
                />
                <Tooltip
                  formatter={(value: any) => typeof value === 'number' ? formatPercentage(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0%'}
                  labelFormatter={(label) => `Vintage ${label}`}
                />
                <Legend />
                <Bar
                  dataKey="median"
                  name="Median IRR"
                  fill="#8884d8"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No vintage IRR data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scatter - LTV vs Final IRR */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>LTV vs Final IRR</CardTitle>
          <CardDescription>Relationship between loan-to-value ratio and IRR</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : scatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="ltv"
                  name="LTV"
                  domain={[0, 1]}
                  tickFormatter={(value) => typeof value === 'number' ? formatPercentage(value, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) : '0%'}
                />
                <YAxis
                  type="number"
                  dataKey="irr"
                  name="IRR"
                  tickFormatter={(value) => typeof value === 'number' ? formatPercentage(value, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) : '0%'}
                />
                <ZAxis range={[50, 50]} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'LTV') return typeof value === 'number' ? formatPercentage(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0%';
                    if (name === 'IRR') return typeof value === 'number' ? formatPercentage(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0%';
                    return value;
                  }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Legend />
                <Scatter
                  name="Green Zone"
                  data={scatterData.filter(d => d.zone === 'green')}
                  fill="#4ade80"
                />
                <Scatter
                  name="Orange Zone"
                  data={scatterData.filter(d => d.zone === 'orange')}
                  fill="#f59e0b"
                />
                <Scatter
                  name="Red Zone"
                  data={scatterData.filter(d => d.zone === 'red')}
                  fill="#ef4444"
                />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No LTV vs IRR data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table - Top-10 Loans by GP Carry Contribution */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Top-10 Loans by GP Carry Contribution</CardTitle>
          <CardDescription>Loans that contributed the most to GP carried interest</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[300px]" />
          ) : topLoans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Suburb</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Exit Year</TableHead>
                  <TableHead>IRR</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Carry Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLoans.map((loan, index) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{loan.suburb}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{
                            backgroundColor: loan.zone === 'green' ? '#4ade80' :
                                            loan.zone === 'orange' ? '#f59e0b' :
                                            loan.zone === 'red' ? '#ef4444' : '#6b7280'
                          }}
                        ></div>
                        {loan.zone}
                      </div>
                    </TableCell>
                    <TableCell>{loan.exitYear}</TableCell>
                    <TableCell>{formatPercentage(loan.irr, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</TableCell>
                    <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                    <TableCell>{formatCurrency(loan.carryContribution)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No loan carry contribution data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
