import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LogLevel, LogCategory, log } from '@/utils/logging';
import { formatPercentage, formatMultiple, formatCurrency, formatNumber } from '@/utils/format';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ZoneAnalyticsProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

export function ZoneAnalytics({
  simulation,
  results,
  isLoading
}: ZoneAnalyticsProps) {
  // Extract zone distribution data
  const zoneDistribution = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from portfolio_snapshot
    if (results.portfolio_snapshot?.zone_distribution) {
      const zoneData = results.portfolio_snapshot.zone_distribution;

      return [
        { name: 'Green', value: zoneData.green || 0, color: '#4ade80' },
        { name: 'Orange', value: zoneData.orange || 0, color: '#f59e0b' },
        { name: 'Red', value: zoneData.red || 0, color: '#ef4444' }
      ];
    }

    // Try to get from zone_allocation
    if (results.zone_allocation) {
      return [
        { name: 'Green', value: results.zone_allocation.green || 0, color: '#4ade80' },
        { name: 'Orange', value: results.zone_allocation.orange || 0, color: '#f59e0b' },
        { name: 'Red', value: results.zone_allocation.red || 0, color: '#ef4444' }
      ];
    }

    // Try to calculate from loans (either directly or from portfolio.loans)
    const loansArray = Array.isArray(results.loans) ? results.loans :
                      (results.portfolio && Array.isArray(results.portfolio.loans) ? results.portfolio.loans : null);

    if (loansArray) {
      const zoneCounts = {
        green: 0,
        orange: 0,
        red: 0
      };

      loansArray.forEach((loan: any) => {
        const zone = loan.zone?.toLowerCase();
        if (zone === 'green' || zone === 'orange' || zone === 'red') {
          zoneCounts[zone]++;
        }
      });

      const total = zoneCounts.green + zoneCounts.orange + zoneCounts.red;

      if (total > 0) {
        return [
          { name: 'Green', value: zoneCounts.green / total, color: '#4ade80' },
          { name: 'Orange', value: zoneCounts.orange / total, color: '#f59e0b' },
          { name: 'Red', value: zoneCounts.red / total, color: '#ef4444' }
        ];
      }
    }

    // No fallbacks - return empty array if no real data is available

    return [];
  }, [results, simulation, isLoading]);

  // Extract zone performance metrics
  const zoneMetrics = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from zone_performance
    if (results.zone_performance) {
      return [
        {
          zone: 'Green',
          irr: results.zone_performance.green?.irr,
          multiple: results.zone_performance.green?.multiple,
          defaultRate: results.zone_performance.green?.default_rate,
          color: '#4ade80'
        },
        {
          zone: 'Orange',
          irr: results.zone_performance.orange?.irr,
          multiple: results.zone_performance.orange?.multiple,
          defaultRate: results.zone_performance.orange?.default_rate,
          color: '#f59e0b'
        },
        {
          zone: 'Red',
          irr: results.zone_performance.red?.irr,
          multiple: results.zone_performance.red?.multiple,
          defaultRate: results.zone_performance.red?.default_rate,
          color: '#ef4444'
        }
      ];
    }

    // Try to get from monte_carlo_results.zone_irrs
    if (results.monte_carlo_results?.zone_irrs) {
      const zoneIrrs = results.monte_carlo_results.zone_irrs;

      return [
        {
          zone: 'Green',
          irr: zoneIrrs.green?.mean,
          multiple: null,
          defaultRate: null,
          color: '#4ade80'
        },
        {
          zone: 'Orange',
          irr: zoneIrrs.orange?.mean,
          multiple: null,
          defaultRate: null,
          color: '#f59e0b'
        },
        {
          zone: 'Red',
          irr: zoneIrrs.red?.mean,
          multiple: null,
          defaultRate: null,
          color: '#ef4444'
        }
      ];
    }

    return [];
  }, [results, isLoading]);

  // Extract top suburbs data
  const topSuburbs = React.useMemo(() => {
    if (!results || isLoading) return [];

    // Try to get from loans (either directly or from portfolio.loans)
    const loansArray = Array.isArray(results.loans) ? results.loans :
                      (results.portfolio && Array.isArray(results.portfolio.loans) ? results.portfolio.loans : null);

    if (loansArray) {
      // Group loans by suburb
      const suburbMap = new Map();

      loansArray.forEach((loan: any) => {
        // Get suburb from suburb_id or suburb property
        const suburb = loan.suburb || (loan.suburb_id ? `Suburb ${loan.suburb_id}` : null);
        if (!suburb) return; // Skip if no suburb

        const zone = loan.zone;
        if (!zone) return; // Skip if no zone

        // Use loan IRR if available, otherwise use zone's average IRR
        let irr = loan.irr;
        if (irr === undefined || irr === null) {
          // Try to get from zone performance
          if (results.zone_performance && results.zone_performance[zone.toLowerCase()]?.irr !== undefined) {
            irr = results.zone_performance[zone.toLowerCase()].irr;
          } else {
            // Use default IRR based on zone
            irr = zone.toLowerCase() === 'green' ? 0.12 :
                  zone.toLowerCase() === 'orange' ? 0.15 :
                  zone.toLowerCase() === 'red' ? 0.18 : 0.10;
          }
        }

        const amount = loan.loan_amount;
        if (amount === undefined || amount === null) return; // Skip if no loan amount

        if (!suburbMap.has(suburb)) {
          suburbMap.set(suburb, {
            suburb,
            zone,
            loanCount: 0,
            totalAmount: 0,
            avgIrr: 0,
            irrSum: 0
          });
        }

        const suburbData = suburbMap.get(suburb);
        suburbData.loanCount++;
        suburbData.totalAmount += amount;
        suburbData.irrSum += irr;
        suburbData.avgIrr = suburbData.irrSum / suburbData.loanCount;
      });

      // Convert to array and sort by total amount
      const suburbArray = Array.from(suburbMap.values());
      suburbArray.sort((a, b) => b.totalAmount - a.totalAmount);

      // Return top 10
      return suburbArray.slice(0, 10);
    }

    return [];
  }, [results, isLoading]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TLS Donut */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Traffic Light System Distribution</CardTitle>
            <CardDescription>Capital distribution by zone</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : zoneDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={zoneDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {zoneDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatPercentage(value, { maximumFractionDigits: 1 })}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No zone distribution data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zone KPI Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Zone Performance Metrics</CardTitle>
            <CardDescription>Key metrics by traffic light zone</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : zoneMetrics.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zone</TableHead>
                    <TableHead>IRR</TableHead>
                    <TableHead>Multiple</TableHead>
                    <TableHead>Default Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zoneMetrics.map((zone) => (
                    <TableRow key={zone.zone}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: zone.color }}></div>
                          {zone.zone}
                        </div>
                      </TableCell>
                      <TableCell>{zone.irr !== null ? formatPercentage(zone.irr) : 'N/A'}</TableCell>
                      <TableCell>{zone.multiple !== null ? formatMultiple(zone.multiple) : 'N/A'}</TableCell>
                      <TableCell>{zone.defaultRate !== null ? formatPercentage(zone.defaultRate) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No zone metrics available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Suburbs Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Top Suburbs by Capital Deployed</CardTitle>
          <CardDescription>Suburbs with the highest capital allocation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-[300px]" />
          ) : topSuburbs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suburb</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Loan Count</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Avg IRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSuburbs.map((suburb) => (
                  <TableRow key={suburb.suburb}>
                    <TableCell className="font-medium">{suburb.suburb}</TableCell>
                    <TableCell>{suburb.zone}</TableCell>
                    <TableCell>{formatNumber(suburb.loanCount)}</TableCell>
                    <TableCell>{formatCurrency(suburb.totalAmount)}</TableCell>
                    <TableCell>{formatPercentage(suburb.avgIrr)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No suburb data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
