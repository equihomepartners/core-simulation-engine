import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/formatters';
import { LogLevel, LogCategory, log } from '@/utils/logging';

// Define color constants
const COLORS = {
  midnight: '#0B1C3F',
  steel: '#314C7E',
  aqua: '#00A0B0',
  green: '#4CAF50',
  yellow: '#FFC107',
  orange: '#FF9800',
  red: '#F44336',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
  gridLines: '#E5E7EB'
};

interface ZoneData {
  name: string;
  value: number;
  color: string;
  medianIRR?: number;
}

interface VintageData {
  vintage: string;
  green: number;
  yellow: number;
  red: number;
  total: number;
}

interface LoanData {
  id: string;
  zone: string; // Allow any zone type (green, yellow, orange, red)
  vintage: string;
  amount: number;
  ltv: number;
  irr: number;
  risk: number;
  suburb?: string;
}

interface ZoneVintageBreakdownFProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

// Custom tooltip for pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
        <p className="font-semibold">{data.name}</p>
        <p>Allocation: {formatPercentage(data.value / 100)}</p>
        {data.medianIRR !== undefined && <p>Median IRR: {formatPercentage(data.medianIRR)}</p>}
      </div>
    );
  }
  return null;
};

// Custom tooltip for marimekko chart
const CustomMarimekkoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dataKey = payload[0].dataKey;
    const value = payload[0].value;

    let zoneName = '';
    if (dataKey === 'green') zoneName = 'Green Zone';
    if (dataKey === 'yellow') zoneName = 'Yellow Zone';
    if (dataKey === 'orange') zoneName = 'Orange Zone';
    if (dataKey === 'red') zoneName = 'Red Zone';

    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
        <p className="font-semibold">{data.vintage} - {zoneName}</p>
        <p>Capital: {formatCurrency(value)}</p>
        <p>% of Vintage: {formatPercentage(value / data.total)}</p>
      </div>
    );
  }
  return null;
};

export function ZoneVintageBreakdownF({ simulation, results, isLoading }: ZoneVintageBreakdownFProps) {
  const [sortColumn, setSortColumn] = useState<string>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [chartView, setChartView] = useState<'vintage' | 'zone' | 'combined'>('combined');

  // Debug: Log the results to see what data is available
  console.log("Zone & Vintage Breakdown - Results:", results);
  console.log("Zone & Vintage Breakdown - Simulation:", simulation);

  // Debug: Log specific sections we're looking for
  console.log("Zone & Vintage Breakdown - Metrics:", results?.metrics);
  console.log("Zone & Vintage Breakdown - Zone Allocation:", results?.metrics?.zone_allocation);
  console.log("Zone & Vintage Breakdown - Simulation Zone Allocations:", simulation?.zone_allocations);
  console.log("Zone & Vintage Breakdown - Simulation Parameters:", simulation?.parameters);
  console.log("Zone & Vintage Breakdown - Zone IRRs:", results?.zone_irrs);
  console.log("Zone & Vintage Breakdown - Vintage Breakdown:", results?.vintage_breakdown);
  console.log("Zone & Vintage Breakdown - Top Loans:", results?.top_loans);
  console.log("Zone & Vintage Breakdown - All Loans:", results?.loans);

  // Process loan data for table first (we need this for zone allocation)
  const loanData = useMemo(() => {
    // Try different possible locations for loan data, prioritizing top_loans
    const loans = results?.top_loans || results?.loans || [];
    if (!loans || !loans.length) return [];

    try {
      // Create a map to deduplicate loans by ID
      const loanMap = new Map();

      loans.forEach((loan: any) => {
        // Generate a unique ID for each loan
        const loanId = loan.loan_id || loan.id || loan.loanId;

        // Skip if no valid ID
        if (!loanId) return;

        // Create a standardized loan object
        const processedLoan = {
          id: loanId,
          zone: loan.zone,
          vintage: loan.vintage || loan.origination_year,
          amount: loan.loan_amount !== undefined ? loan.loan_amount : loan.amount,
          ltv: loan.ltv,
          // Get IRR from all possible sources without fallbacks
          irr: typeof loan.irr !== 'undefined' ? loan.irr :
               typeof loan.loan_irr !== 'undefined' ? loan.loan_irr :
               typeof loan.internal_rate_of_return !== 'undefined' ? loan.internal_rate_of_return : undefined,
          risk: typeof loan.risk !== 'undefined' ? loan.risk :
               typeof loan.volatility !== 'undefined' ? loan.volatility : undefined,
          suburb: loan.suburb
        };

        // Debug log to see what IRR values we're getting
        console.log(`Loan ${loanId} IRR:`, loan.irr, 'Full loan:', loan);

        // Only add if not already in the map
        if (!loanMap.has(loanId)) {
          loanMap.set(loanId, processedLoan);
        }
      });

      // Convert map to array and sort by amount (descending)
      const uniqueLoans = Array.from(loanMap.values());

      // Sort by amount (descending) by default
      return uniqueLoans
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10); // Limit to top 10 loans
    } catch (error) {
      console.error('Error processing loan data:', error);
      return [];
    }
  }, [results]);

  // Process zone data for pie chart
  const zoneData = useMemo(() => {
    if (!results) return [];

    try {
      // Get zone allocation from metrics - no fallbacks
      const metrics = results.metrics || {};
      const zoneAllocation = metrics.zone_allocation || {};

      // If no zone allocation data, return empty array
      if (Object.keys(zoneAllocation).length === 0) {
        console.log("No zone allocation data available");
        return [];
      }

      // Debug zone allocation data
      console.log("Final Zone Allocation Data:", zoneAllocation);

      // Extract zone percentages
      const greenPct = zoneAllocation.green || 0;
      const yellowPct = zoneAllocation.yellow || 0;
      const orangePct = zoneAllocation.orange || 0; // Support for orange zone
      const redPct = zoneAllocation.red || 0;

      // Extract median IRRs by zone if available - no fallbacks
      const zoneIRRs = results.zone_irrs || {};
      console.log("Zone IRRs:", zoneIRRs);

      // Calculate total to ensure percentages add up to 100%
      const total = greenPct + yellowPct + orangePct + redPct;
      const normalizer = total > 0 ? 100 / total : 0;

      // Create data array with all possible zones - only include IRR if available
      const data: ZoneData[] = [];

      // Only add zones that have allocation
      if (greenPct > 0) {
        const greenZone: ZoneData = {
          name: 'Green Zone',
          value: greenPct * normalizer,
          color: COLORS.green
        };
        if (zoneIRRs.green !== undefined) {
          greenZone.medianIRR = zoneIRRs.green;
        }
        data.push(greenZone);
      }

      if (yellowPct > 0) {
        const yellowZone: ZoneData = {
          name: 'Yellow Zone',
          value: yellowPct * normalizer,
          color: COLORS.yellow
        };
        if (zoneIRRs.yellow !== undefined) {
          yellowZone.medianIRR = zoneIRRs.yellow;
        }
        data.push(yellowZone);
      }

      if (orangePct > 0) {
        const orangeZone: ZoneData = {
          name: 'Orange Zone',
          value: orangePct * normalizer,
          color: COLORS.orange
        };
        if (zoneIRRs.orange !== undefined) {
          orangeZone.medianIRR = zoneIRRs.orange;
        }
        data.push(orangeZone);
      }

      if (redPct > 0) {
        const redZone: ZoneData = {
          name: 'Red Zone',
          value: redPct * normalizer,
          color: COLORS.red
        };
        if (zoneIRRs.red !== undefined) {
          redZone.medianIRR = zoneIRRs.red;
        }
        data.push(redZone);
      }

      // Only include zones with non-zero allocation
      const filteredData = data.filter(zone => zone.value > 0);
      console.log("Filtered Zone Data for Pie Chart:", filteredData);
      return filteredData;
    } catch (error) {
      console.error('Error processing zone data:', error);
      return [];
    }
  }, [results, simulation, loanData]);

  // Process vintage data for marimekko chart - no fallbacks
  const vintageData = useMemo(() => {
    if (!results || !results.vintage_breakdown) {
      console.log("No vintage_breakdown data available:", results?.vintage_breakdown);
      return [];
    }

    try {
      const vintageBreakdown = results.vintage_breakdown;
      console.log("Vintage Breakdown Raw Data:", vintageBreakdown);

      // Map vintage breakdown to chart data format
      const data = Object.entries(vintageBreakdown).map(([vintage, data]: [string, any]) => {
        // Only include values that exist in the data
        const entry: any = { vintage };
        let total = 0;

        // Add zone values only if they exist
        if (typeof data.green === 'number') {
          entry.green = data.green;
          total += data.green;
        }

        if (typeof data.yellow === 'number') {
          entry.yellow = data.yellow;
          total += data.yellow;
        }

        if (typeof data.orange === 'number') {
          entry.orange = data.orange;
          total += data.orange;
        }

        if (typeof data.red === 'number') {
          entry.red = data.red;
          total += data.red;
        }

        // Add total
        entry.total = total;

        return entry;
      });

      // Sort by vintage year and filter out empty vintages
      const filteredData = data
        .filter(item => item.total > 0)
        .sort((a, b) => a.vintage.localeCompare(b.vintage));

      console.log("Processed Vintage Data for Chart:", filteredData);
      return filteredData;
    } catch (error) {
      console.error('Error processing vintage data:', error);
      return [];
    }
  }, [results]);
  // Sort loans based on current sort settings
  const sortedLoans = useMemo(() => {
    return [...loanData].sort((a, b) => {
      const aValue = a[sortColumn as keyof LoanData];
      const bValue = b[sortColumn as keyof LoanData];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }).slice(0, 10); // Limit to top 10
  }, [loanData, sortColumn, sortDirection]);

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  // Check if we have any data to display
  const hasZoneData = zoneData.length > 0;
  const hasVintageData = vintageData.length > 0;
  const hasLoanData = sortedLoans.length > 0;

  // Additional debug for zone data
  console.log("Zone & Vintage Breakdown - Zone Data for Pie Chart:", zoneData);
  console.log("Zone & Vintage Breakdown - Has Zone Data:", hasZoneData);
  console.log("Zone & Vintage Breakdown - Zone Allocation in Metrics:", results?.metrics?.zone_allocation);

  if (!hasZoneData && !hasVintageData && !hasLoanData) {
    return (
      <Card className="border border-gray-200">
        <CardHeader className="py-3 px-4 border-b border-gray-200">
          <CardTitle className="text-base font-semibold text-[#0B1C3F]">Zone & Vintage Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-gray-500">No zone and vintage data available for this simulation.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="py-3 px-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold text-[#0B1C3F]">Zone & Vintage Breakdown</CardTitle>
          <div className="flex space-x-2">
            <button
              onClick={() => setChartView('vintage')}
              className={`px-3 py-1 text-xs rounded-md ${
                chartView === 'vintage'
                  ? 'bg-[#0B1C3F] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vintage Chart
            </button>
            <button
              onClick={() => setChartView('zone')}
              className={`px-3 py-1 text-xs rounded-md ${
                chartView === 'zone'
                  ? 'bg-[#0B1C3F] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Zone Chart
            </button>
            <button
              onClick={() => setChartView('combined')}
              className={`px-3 py-1 text-xs rounded-md ${
                chartView === 'combined'
                  ? 'bg-[#0B1C3F] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Combined View
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Vintage Chart View */}
        {chartView === 'vintage' && (
          <div className="grid grid-cols-1 gap-4">
            <div className="h-[350px]">
              {hasVintageData ? (
                <>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Capital by Vintage Year vs TLS Decile</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={vintageData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      stackOffset="expand"
                      barSize={40}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLines} />
                      <XAxis
                        dataKey="vintage"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickFormatter={(value) => formatPercentage(value)}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomMarimekkoTooltip />} />
                      <Legend />
                      <Bar dataKey="green" name="Green Zone" stackId="a" fill={COLORS.green} />
                      <Bar dataKey="yellow" name="Yellow Zone" stackId="a" fill={COLORS.yellow} />
                      <Bar dataKey="orange" name="Orange Zone" stackId="a" fill={COLORS.orange} />
                      <Bar dataKey="red" name="Red Zone" stackId="a" fill={COLORS.red} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No vintage breakdown data available.</p>
                </div>
              )}
            </div>

            {/* Top loans table */}
            {hasLoanData && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Top Loans</h3>
                <div className="max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort('id')}>ID</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('zone')}>Zone</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>Amount</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('ltv')}>LTV</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('irr')}>IRR</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('risk')}>Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{loan.id.substring(0, 8)}</TableCell>
                          <TableCell>{loan.zone}</TableCell>
                          <TableCell>{formatCurrency(loan.amount)}</TableCell>
                          <TableCell>{formatPercentage(loan.ltv)}</TableCell>
                          <TableCell>
                            {console.log(`Rendering IRR for loan ${loan.id}:`, loan.irr)}
                            {loan.irr !== undefined && loan.irr !== null ? formatPercentage(loan.irr) : 'N/A'}
                          </TableCell>
                          <TableCell>{loan.risk !== undefined && loan.risk !== null ? formatPercentage(loan.risk) : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Zone Chart View */}
        {chartView === 'zone' && (
          <div className="grid grid-cols-1 gap-4">
            {/* Zone Pie Chart */}
            {hasZoneData ? (
              <div className="h-[350px]">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Zone Allocation with Median IRR</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={zoneData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={160}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${formatPercentage(value / 100)}`}
                      labelLine={true}
                    >
                      {zoneData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-gray-500">No zone allocation data available.</p>
              </div>
            )}

            {/* Top loans table */}
            {hasLoanData && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Top Loans</h3>
                <div className="max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort('id')}>ID</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('zone')}>Zone</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>Amount</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('ltv')}>LTV</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('irr')}>IRR</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('risk')}>Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLoans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{loan.id.substring(0, 8)}</TableCell>
                          <TableCell>{loan.zone}</TableCell>
                          <TableCell>{formatCurrency(loan.amount)}</TableCell>
                          <TableCell>{formatPercentage(loan.ltv)}</TableCell>
                          <TableCell>
                            {console.log(`Rendering IRR for loan ${loan.id}:`, loan.irr)}
                            {loan.irr !== undefined && loan.irr !== null ? formatPercentage(loan.irr) : 'N/A'}
                          </TableCell>
                          <TableCell>{loan.risk !== undefined && loan.risk !== null ? formatPercentage(loan.risk) : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Combined View */}
        {chartView === 'combined' && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {/* Left column - Marimekko chart (70%) */}
            <div className={`${hasVintageData ? 'lg:col-span-5' : 'lg:col-span-7'} h-[350px]`}>
              {hasVintageData ? (
                <>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Capital by Vintage Year vs TLS Decile</h3>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={vintageData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      stackOffset="expand"
                      barSize={40}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLines} />
                      <XAxis
                        dataKey="vintage"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickFormatter={(value) => formatPercentage(value)}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomMarimekkoTooltip />} />
                      <Legend />
                      <Bar dataKey="green" name="Green Zone" stackId="a" fill={COLORS.green} />
                      <Bar dataKey="yellow" name="Yellow Zone" stackId="a" fill={COLORS.yellow} />
                      <Bar dataKey="orange" name="Orange Zone" stackId="a" fill={COLORS.orange} />
                      <Bar dataKey="red" name="Red Zone" stackId="a" fill={COLORS.red} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No vintage breakdown data available.</p>
                </div>
              )}
            </div>

            {/* Right column - Donut chart and table (30%) */}
            {(hasZoneData || hasLoanData) && (
              <div className="lg:col-span-2 space-y-4">
                {/* Donut chart */}
                {hasZoneData && (
                  <div className="h-[200px]">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Zone Weight</h3>
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={zoneData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name.split(' ')[0]}`}
                          labelLine={false}
                        >
                          {zoneData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top loans table */}
                {hasLoanData && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Top Loans</h3>
                    <div className="max-h-[200px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px] cursor-pointer" onClick={() => handleSort('id')}>ID</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('zone')}>Zone</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>Amount</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('ltv')}>LTV</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('irr')}>IRR</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('risk')}>Risk</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedLoans.map((loan) => (
                            <TableRow key={loan.id}>
                              <TableCell className="font-medium">{loan.id.substring(0, 8)}</TableCell>
                              <TableCell>{loan.zone}</TableCell>
                              <TableCell>{formatCurrency(loan.amount)}</TableCell>
                              <TableCell>{formatPercentage(loan.ltv)}</TableCell>
                              <TableCell>
                                {console.log(`Rendering IRR for loan ${loan.id}:`, loan.irr)}
                                {loan.irr !== undefined && loan.irr !== null ? formatPercentage(loan.irr) : 'N/A'}
                              </TableCell>
                              <TableCell>{loan.risk !== undefined && loan.risk !== null ? formatPercentage(loan.risk) : 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
