import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, ComposedChart,
  Brush, ReferenceArea, TooltipProps
} from 'recharts';
import { sdkWrapper } from '@/utils/sdkWrapper';
import { useMonteCarloResults } from '@/hooks/use-montecarlo-results';
import { simulationSDK } from '@/sdk';

interface PortfolioReturnsTabProps {
  simulation: any;
  results: any;
  isLoading: boolean;
  timeGranularity: 'yearly' | 'quarterly' | 'monthly';
  cumulativeMode: boolean;
}

// Define color constants for consistent styling
const CHART_COLORS = {
  // Zone colors
  green: '#10b981', // emerald-500
  yellow: '#f59e0b', // amber-500
  red: '#ef4444', // red-500

  // Cash flow colors
  drawdowns: '#ef4444', // red-500
  interest: '#10b981', // emerald-500
  appreciation: '#3b82f6', // blue-500
  distributions: '#8b5cf6', // violet-500

  // Percentile colors
  p10: '#94a3b8', // slate-400
  p50: '#1e293b', // slate-800
  p90: '#475569', // slate-600

  // Reference line colors
  deploymentEnd: '#f97316', // orange-500
  reinvestmentEnd: '#8b5cf6', // violet-500
};

// Custom tooltip component for better hover information
const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">{entry.name}:</span>
            <span className="text-sm font-medium">{entry.value !== undefined ? entry.value.toLocaleString() : 'N/A'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function PortfolioReturnsTab({
  simulation,
  results,
  isLoading,
  timeGranularity,
  cumulativeMode
}: PortfolioReturnsTabProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedLtvBucket, setSelectedLtvBucket] = useState<number[] | null>(null);
  const [selectedExitPeriod, setSelectedExitPeriod] = useState<number[] | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);

  // Fetch Monte Carlo data for cash flow fan chart
  const [monteCarloData, setMonteCarloData] = React.useState<any>(null);
  const [varianceData, setVarianceData] = React.useState<any>(null);
  const [isLoadingMonteCarlo, setIsLoadingMonteCarlo] = React.useState<boolean>(false);

  // Use the Monte Carlo results hook
  const { data: monteCarloQueryData, isLoading: isLoadingMonteCarloQuery } = useMonteCarloResults(
    simulation?.id || '',
    'distribution',
    'irr'
  );

  // Update state when query data changes
  React.useEffect(() => {
    if (monteCarloQueryData) {
      console.log('Monte Carlo Data from hook:', monteCarloQueryData);
      setMonteCarloData(monteCarloQueryData);
    }
  }, [monteCarloQueryData]);

  // Update loading state
  React.useEffect(() => {
    setIsLoadingMonteCarlo(isLoadingMonteCarloQuery);
  }, [isLoadingMonteCarloQuery]);

  // Directly run the inner Monte Carlo simulation using the SDK
  React.useEffect(() => {
    if (!simulation?.id) return;

    const runInnerMonteCarloSimulation = async () => {
      try {
        console.log('Running inner Monte Carlo simulation using SDK...');

        // Use the SDK to get Monte Carlo visualization data for IRR distribution
        const irrData = await simulationSDK.getMonteCarloVisualization(
          simulation.id,
          'distribution',
          'irr'
        );

        console.log('Monte Carlo IRR distribution from SDK:', irrData);

        // Get cash flow fan chart data
        const cashFlowData = await simulationSDK.getMonteCarloVisualization(
          simulation.id,
          'cash_flow',
          'irr'
        );

        console.log('Monte Carlo cash flow fan chart data from SDK:', cashFlowData);

        // Combine the data from SDK
        const combinedData = {
          ...irrData,
          cash_flow_fan_chart: cashFlowData
        };

        // If we got data and it has the expected structure, use it
        if (combinedData && combinedData.datasets) {
          setMonteCarloData(combinedData);
        }
      } catch (error) {
        console.error('Error running inner Monte Carlo simulation:', error);
      }
    };

    // Only run this if we don't have data from the hook
    if (!monteCarloQueryData) {
      runInnerMonteCarloSimulation();
    }
  }, [simulation?.id, monteCarloQueryData]);

  // Fetch variance analysis data as a backup using the SDK
  React.useEffect(() => {
    if (!simulation?.id) return;

    const fetchVarianceData = async () => {
      try {
        console.log('Fetching variance analysis data using SDK...');

        // Use the SDK to get variance analysis data
        const data = await simulationSDK.getVarianceAnalysis(
          simulation.id,
          100,
          false
        );

        console.log('Variance Analysis Data from SDK:', data);
        setVarianceData(data);
      } catch (error) {
        console.error('Error fetching variance data:', error);
      }
    };

    // Only run this if we don't have Monte Carlo data
    if (!monteCarloData && !monteCarloQueryData) {
      fetchVarianceData();
    }
  }, [simulation?.id, monteCarloData, monteCarloQueryData]);

  // Debug: Log the structure of the results
  React.useEffect(() => {
    if (results) {
      console.log('Portfolio Returns Tab - Results Structure:', results);
      console.log('Portfolio Returns Tab - Results Keys:', Object.keys(results));

      if (results.portfolio_evolution) {
        console.log('Portfolio Evolution Structure:', results.portfolio_evolution);
        // Log the first year to see the structure
        const firstYear = Object.keys(results.portfolio_evolution).find(key => !isNaN(Number(key)));
        if (firstYear) {
          console.log(`Portfolio Evolution Year ${firstYear}:`, results.portfolio_evolution[firstYear]);
        }
      }

      if (results.cash_flows) {
        console.log('Cash Flows Structure:', results.cash_flows);
        // Log the first year to see the structure
        const firstYear = Object.keys(results.cash_flows).find(key => !isNaN(Number(key)));
        if (firstYear) {
          console.log(`Cash Flows Year ${firstYear}:`, results.cash_flows[firstYear]);
        }
      }

      if (results.metrics) {
        console.log('Metrics Structure:', results.metrics);
      }

      if (results.portfolio) {
        console.log('Portfolio Structure:', results.portfolio);
      }

      if (results.loans) {
        console.log('Loans Structure:', results.loans);
        // Log the first few loans to see their structure
        if (Array.isArray(results.loans) && results.loans.length > 0) {
          console.log('First Loan Example:', results.loans[0]);

          // Check for reinvestment loans
          const reinvestmentLoans = results.loans.filter(loan =>
            loan.is_reinvestment === true ||
            loan.is_reinvestment === 'true' ||
            loan.reinvestment === true ||
            loan.reinvestment === 'true'
          );
          console.log('Reinvestment Loans Count:', reinvestmentLoans.length);
          if (reinvestmentLoans.length > 0) {
            console.log('Reinvestment Loan Example:', reinvestmentLoans[0]);
          }

          // Check for other potential reinvestment indicators
          const loanProperties = new Set();
          results.loans.slice(0, 5).forEach(loan => {
            Object.keys(loan).forEach(key => loanProperties.add(key));
          });
          console.log('Loan Properties:', Array.from(loanProperties));
        }
      }
    }

    if (simulation) {
      console.log('Portfolio Returns Tab - Simulation Structure:', simulation);
    }
  }, [results, simulation]);

  // Extract key metrics from results
  const portfolioMetrics = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Safely extract data from results with proper type checking
    const metrics = typeof results.metrics === 'object' ? results.metrics || {} : {};
    const portfolioSnapshot = typeof results.portfolio_snapshot === 'object' ? results.portfolio_snapshot || {} : {};
    const loans = Array.isArray(results.loans) ? results.loans : [];
    const cashFlows = typeof results.cash_flows === 'object' ? results.cash_flows || {} : {};
    const parameters = typeof results.parameters === 'object' ? results.parameters || {} : {};

    // Calculate loan count - use the most reliable source
    const loanCount = loans.length > 0 ?
                      loans.length :
                      typeof portfolioSnapshot.total_loans === 'number' ? portfolioSnapshot.total_loans : 0;

    // Calculate total capital deployed with proper validation
    let totalCapital = 0;
    if (typeof portfolioSnapshot.total_capital === 'number' && !isNaN(portfolioSnapshot.total_capital)) {
      totalCapital = portfolioSnapshot.total_capital;
    } else if (typeof metrics.total_capital_deployed === 'number' && !isNaN(metrics.total_capital_deployed)) {
      totalCapital = metrics.total_capital_deployed;
    } else if (loans.length > 0) {
      // Calculate from loan amounts if no aggregate value is available
      totalCapital = loans.reduce((sum: number, loan: any) => {
        const loanAmount = typeof loan.loan_amount === 'number' ?
                          loan.loan_amount :
                          typeof loan.loan_amount === 'string' ?
                          parseFloat(loan.loan_amount) : 0;
        return sum + (isNaN(loanAmount) ? 0 : loanAmount);
      }, 0);
    }

    // Calculate median LTV with proper validation
    const validLtvs = loans
      .map((loan: any) => {
        const ltv = typeof loan.ltv === 'number' ?
                   loan.ltv :
                   typeof loan.ltv === 'string' ?
                   parseFloat(loan.ltv) : null;
        return isNaN(ltv) ? null : ltv;
      })
      .filter((ltv: number | null): ltv is number => ltv !== null)
      .sort((a: number, b: number) => a - b);

    let medianLtv = 0;
    if (validLtvs.length > 0) {
      const mid = Math.floor(validLtvs.length / 2);
      medianLtv = validLtvs.length % 2 === 0 ?
                 (validLtvs[mid - 1] + validLtvs[mid]) / 2 :
                 validLtvs[mid];
    }

    // Get IRR metrics with proper validation
    let netIrr = 0;
    if (metrics.lp_irr && typeof metrics.lp_irr.irr === 'number' && !isNaN(metrics.lp_irr.irr)) {
      netIrr = metrics.lp_irr.irr;
    } else if (metrics.net_irr && typeof metrics.net_irr.irr === 'number' && !isNaN(metrics.net_irr.irr)) {
      netIrr = metrics.net_irr.irr;
    }

    // Calculate weighted average life with proper validation
    let wal = 0;
    if (typeof metrics.weighted_average_life === 'number' && !isNaN(metrics.weighted_average_life)) {
      wal = metrics.weighted_average_life;
    } else if (loans.length > 0 && totalCapital > 0) {
      // Calculate from loan data if no aggregate value is available
      const weightedSum = loans.reduce((sum: number, loan: any) => {
        const exitYear = typeof loan.expected_exit_year === 'number' ?
                        loan.expected_exit_year :
                        typeof loan.expected_exit_year === 'string' ?
                        parseFloat(loan.expected_exit_year) : 0;

        const originationYear = typeof loan.origination_year === 'number' ?
                               loan.origination_year :
                               typeof loan.origination_year === 'string' ?
                               parseFloat(loan.origination_year) : 0;

        const term = isNaN(exitYear) || isNaN(originationYear) ? 0 : exitYear - originationYear;

        const amount = typeof loan.loan_amount === 'number' ?
                      loan.loan_amount :
                      typeof loan.loan_amount === 'string' ?
                      parseFloat(loan.loan_amount) : 0;

        return sum + (isNaN(term) || isNaN(amount) ? 0 : term * amount);
      }, 0);

      wal = totalCapital > 0 ? weightedSum / totalCapital : 0;
    }

    // Calculate liquidity buffer with proper validation
    let liquidityBuffer = 0;
    if (typeof metrics.liquidity_buffer === 'number' && !isNaN(metrics.liquidity_buffer)) {
      liquidityBuffer = metrics.liquidity_buffer;
    } else if (typeof metrics.peak_drawdown === 'number' && !isNaN(metrics.peak_drawdown)) {
      liquidityBuffer = metrics.peak_drawdown;
    } else if (Object.keys(cashFlows).length > 0) {
      // Calculate from cash flows if no aggregate value is available
      liquidityBuffer = Object.values(cashFlows).reduce((max: number, cf: any) => {
        if (typeof cf !== 'object') return max;

        const cashBalance = typeof cf.cash_balance === 'number' ? cf.cash_balance : 0;
        const portfolioValue = typeof cf.portfolio_value === 'number' ? cf.portfolio_value : 1;

        const drawdown = portfolioValue > 0 ? Math.abs(cashBalance / portfolioValue) : 0;
        return drawdown > max ? drawdown : max;
      }, 0);
    }

    // Calculate LTV distribution with proper validation and dynamic buckets
    // First, find the min and max LTV values to create appropriate buckets
    let minLtvPercent = 100;
    let maxLtvPercent = 0;

    if (validLtvs.length > 0) {
      // Convert to percentages for easier bucketing
      const ltvPercents = validLtvs.map(ltv => ltv * 100);
      minLtvPercent = Math.max(0, Math.floor(Math.min(...ltvPercents) / 5) * 5); // Round down to nearest 5%
      maxLtvPercent = Math.min(100, Math.ceil(Math.max(...ltvPercents) / 5) * 5); // Round up to nearest 5%

      // Ensure we have at least 4 buckets for visualization
      if (maxLtvPercent - minLtvPercent < 20) {
        minLtvPercent = Math.max(0, minLtvPercent - 10);
        maxLtvPercent = Math.min(100, maxLtvPercent + 10);
      }
    }

    // Create buckets based on the actual data range
    const numBuckets = Math.ceil((maxLtvPercent - minLtvPercent) / 5);
    const ltvDistribution = Array(numBuckets).fill(0).map((_, i) => ({
      bucket: minLtvPercent + (i * 5),
      range: `${minLtvPercent + (i * 5)}% - ${minLtvPercent + ((i + 1) * 5)}%`,
      count: 0,
      loans: [] as any[], // Store loan IDs for each bucket for drill-down
      zoneBreakdown: { green: 0, yellow: 0, red: 0 } // Track zone distribution within each bucket
    }));

    // Create a map of loan IDs to their LTV values for faster lookup
    const loanLtvMap = new Map();
    loans.forEach((loan: any, index: number) => {
      if (loan.id) {
        const ltv = typeof loan.ltv === 'number' ?
                   loan.ltv :
                   typeof loan.ltv === 'string' ?
                   parseFloat(loan.ltv) : null;

        if (ltv !== null && !isNaN(ltv)) {
          loanLtvMap.set(loan.id, {
            ltv,
            zone: typeof loan.zone === 'string' && ['green', 'yellow', 'red'].includes(loan.zone) ?
                 loan.zone : 'green'
          });
        }
      }
    });

    // Use validLtvs instead of ltvs to ensure we only count valid LTV values
    validLtvs.forEach((ltv: number, index: number) => {
      // Convert LTV to percentage and find the appropriate bucket
      const ltvPercent = ltv * 100;

      // Skip if outside our bucket range (shouldn't happen with proper min/max calculation)
      if (ltvPercent < minLtvPercent || ltvPercent >= maxLtvPercent) {
        return;
      }

      const bucketIndex = Math.min(Math.floor((ltvPercent - minLtvPercent) / 5), numBuckets - 1);

      // Get the loan ID
      const loanId = loans[index]?.id;
      if (!loanId) return;

      // Get loan data from the map
      const loanData = loanLtvMap.get(loanId);
      if (!loanData) return;

      // Increment count and store loan ID
      ltvDistribution[bucketIndex].count++;
      ltvDistribution[bucketIndex].loans.push(loanId);

      // Increment zone count
      ltvDistribution[bucketIndex].zoneBreakdown[loanData.zone]++;
    });

    // Calculate exit timing distribution with proper validation and separate original/reinvestment loans
    // Create a map to track loan data by ID for proper indexing
    const loanMap = new Map();
    loans.forEach((loan: any) => {
      if (loan.id) {
        loanMap.set(loan.id, loan);
      }
    });

    // Extract exit months with loan type information
    const exitData = loans
      .map((loan: any) => {
        // Skip loans without ID
        if (!loan.id) return null;

        const exitYear = typeof loan.expected_exit_year === 'number' ?
                        loan.expected_exit_year :
                        typeof loan.expected_exit_year === 'string' ?
                        parseFloat(loan.expected_exit_year) : null;

        const originationYear = typeof loan.origination_year === 'number' ?
                               loan.origination_year :
                               typeof loan.origination_year === 'string' ?
                               parseFloat(loan.origination_year) : null;

        // Skip invalid values
        if (exitYear === null || originationYear === null || isNaN(exitYear) || isNaN(originationYear)) {
          return null;
        }

        // Determine if this is a reinvestment loan - check multiple possible field names
        const isReinvestment =
          // Check is_reinvestment field
          (typeof loan.is_reinvestment === 'boolean' && loan.is_reinvestment) ||
          (typeof loan.is_reinvestment === 'string' && loan.is_reinvestment.toLowerCase() === 'true') ||
          // Check reinvestment field
          (typeof loan.reinvestment === 'boolean' && loan.reinvestment) ||
          (typeof loan.reinvestment === 'string' && loan.reinvestment.toLowerCase() === 'true') ||
          // Check loan_type field
          (typeof loan.loan_type === 'string' && loan.loan_type.toLowerCase().includes('reinvest')) ||
          // Check source field
          (typeof loan.source === 'string' && loan.source.toLowerCase().includes('reinvest')) ||
          // Check for reinvestment in the loan ID
          (typeof loan.id === 'string' && loan.id.toLowerCase().includes('reinvest'));

        return {
          id: loan.id,
          months: (exitYear - originationYear) * 12,
          isReinvestment,
          exitYear,
          originationYear
        };
      })
      .filter((data): data is any => data !== null && data.months >= 0);

    // Count original and reinvestment loans
    const originalLoanCount = exitData.filter(data => !data.isReinvestment).length;
    const reinvestmentLoanCount = exitData.filter(data => data.isReinvestment).length;

    // Try to get reinvestment data from portfolio evolution if available
    let portfolioEvolutionReinvestments = 0;
    if (results.portfolio_evolution) {
      // Sum up reinvestments across all years
      Object.keys(results.portfolio_evolution)
        .filter(key => !isNaN(Number(key)))
        .forEach(year => {
          const yearData = results.portfolio_evolution[year];
          if (yearData && typeof yearData === 'object') {
            // Check different possible field names for reinvestments
            if (typeof yearData.reinvestments === 'number') {
              portfolioEvolutionReinvestments += yearData.reinvestments;
            } else if (typeof yearData.reinvestment_loans === 'number') {
              portfolioEvolutionReinvestments += yearData.reinvestment_loans;
            } else if (typeof yearData.reinvestment_count === 'number') {
              portfolioEvolutionReinvestments += yearData.reinvestment_count;
            }
          }
        });

      // If we found reinvestments in portfolio evolution but not in loans, update the counts
      if (portfolioEvolutionReinvestments > 0 && reinvestmentLoanCount === 0) {
        console.log(`Found ${portfolioEvolutionReinvestments} reinvestments in portfolio evolution data`);
        // Estimate original loans by subtracting reinvestments from total
        const estimatedOriginalLoans = Math.max(0, loans.length - portfolioEvolutionReinvestments);
        // Update counts if the estimates seem reasonable
        if (estimatedOriginalLoans > 0 && portfolioEvolutionReinvestments < loans.length) {
          // We'll use these values later
          console.log(`Using portfolio evolution data: ${estimatedOriginalLoans} original loans, ${portfolioEvolutionReinvestments} reinvestment loans`);
        }
      }
    }

    // Sort by exit months for statistics
    const validExitMonths = exitData.map(data => data.months).sort((a: number, b: number) => a - b);

    // Calculate mean and median exit time with proper validation
    let meanExit = 0;
    if (validExitMonths.length > 0) {
      const sum = validExitMonths.reduce((acc: number, month: number) => acc + month, 0);
      meanExit = sum / validExitMonths.length / 12;
    }

    // Calculate median exit time in months with proper validation
    let medianExitMonths = 0;
    if (validExitMonths.length > 0) {
      const mid = Math.floor(validExitMonths.length / 2);
      medianExitMonths = validExitMonths.length % 2 === 0 ?
                        (validExitMonths[mid - 1] + validExitMonths[mid]) / 2 :
                        validExitMonths[mid];
    }

    // Convert to years
    const medianExit = medianExitMonths / 12;

    // Determine the min and max exit years from the data to create appropriate buckets
    let minExitYear = 0;
    let maxExitYear = 10;

    if (validExitMonths.length > 0) {
      minExitYear = Math.floor(Math.min(...validExitMonths) / 12);
      maxExitYear = Math.ceil(Math.max(...validExitMonths) / 12);

      // Ensure we have at least 5 years for visualization
      if (maxExitYear - minExitYear < 5) {
        minExitYear = Math.max(0, minExitYear - 1);
        maxExitYear = maxExitYear + (5 - (maxExitYear - minExitYear));
      }
    }

    // Create exit distribution buckets based on actual data range
    const numYearBuckets = maxExitYear - minExitYear + 1;
    const exitDistribution = Array(numYearBuckets).fill(0).map((_, i) => {
      const year = minExitYear + i;
      return {
        year,
        range: `Year ${year}`,
        count: 0,
        originalCount: 0,
        reinvestmentCount: 0,
        loans: [] as any[], // Store loan IDs for each bucket for drill-down
        originalLoans: [] as any[],
        reinvestmentLoans: [] as any[]
      };
    });

    // Populate exit distribution from loan data
    exitData.forEach((data) => {
      const yearIndex = Math.min(Math.max(0, Math.floor(data.months / 12) - minExitYear), numYearBuckets - 1);

      // Skip if outside our bucket range (shouldn't happen with proper min/max calculation)
      if (yearIndex < 0 || yearIndex >= exitDistribution.length) {
        return;
      }

      // Increment total count
      exitDistribution[yearIndex].count++;

      // Increment type-specific count
      if (data.isReinvestment) {
        exitDistribution[yearIndex].reinvestmentCount++;
        exitDistribution[yearIndex].reinvestmentLoans.push(data.id);
      } else {
        exitDistribution[yearIndex].originalCount++;
        exitDistribution[yearIndex].originalLoans.push(data.id);
      }

      // Store the loan ID for drill-down functionality
      exitDistribution[yearIndex].loans.push(data.id);
    });

    // If we have portfolio evolution data with reinvestments but no reinvestment loans identified,
    // try to estimate the distribution from portfolio evolution data
    if (portfolioEvolutionReinvestments > 0 && reinvestmentLoanCount === 0 && results.portfolio_evolution) {
      console.log('Using portfolio evolution data to estimate reinvestment distribution');

      // Get years from portfolio evolution
      const evolutionYears = Object.keys(results.portfolio_evolution)
        .filter(key => !isNaN(Number(key)))
        .map(Number)
        .sort((a, b) => a - b);

      // Track how many reinvestments we've allocated
      let allocatedReinvestments = 0;

      // Distribute reinvestments based on portfolio evolution data
      evolutionYears.forEach(year => {
        const yearData = results.portfolio_evolution[year];
        if (!yearData || typeof yearData !== 'object') return;

        // Get reinvestments for this year
        let yearReinvestments = 0;
        if (typeof yearData.reinvestments === 'number') {
          yearReinvestments = yearData.reinvestments;
        } else if (typeof yearData.reinvestment_loans === 'number') {
          yearReinvestments = yearData.reinvestment_loans;
        } else if (typeof yearData.reinvestment_count === 'number') {
          yearReinvestments = yearData.reinvestment_count;
        }

        if (yearReinvestments <= 0) return;

        // Find the corresponding exit year (assuming average exit time)
        const exitYear = year + Math.round(meanExit);
        const exitYearIndex = Math.min(Math.max(0, exitYear - minExitYear), numYearBuckets - 1);

        if (exitYearIndex >= 0 && exitYearIndex < exitDistribution.length) {
          // Update the exit distribution
          exitDistribution[exitYearIndex].reinvestmentCount += yearReinvestments;
          exitDistribution[exitYearIndex].count += yearReinvestments;
          allocatedReinvestments += yearReinvestments;

          console.log(`Allocated ${yearReinvestments} reinvestments from year ${year} to exit in year ${exitYear}`);
        }
      });

      // If we couldn't allocate all reinvestments based on portfolio evolution,
      // distribute the remaining ones proportionally to the existing exit distribution
      const remainingReinvestments = portfolioEvolutionReinvestments - allocatedReinvestments;
      if (remainingReinvestments > 0) {
        console.log(`Distributing ${remainingReinvestments} remaining reinvestments proportionally`);

        // Calculate total exits for proportional distribution
        const totalExits = exitDistribution.reduce((sum, bucket) => sum + bucket.originalCount, 0);

        if (totalExits > 0) {
          // Distribute proportionally
          exitDistribution.forEach((bucket, index) => {
            if (bucket.originalCount > 0) {
              const proportion = bucket.originalCount / totalExits;
              const additionalReinvestments = Math.round(remainingReinvestments * proportion);

              bucket.reinvestmentCount += additionalReinvestments;
              bucket.count += additionalReinvestments;

              console.log(`Added ${additionalReinvestments} proportional reinvestments to year ${bucket.year}`);
            }
          });
        } else {
          // If no original exits to base proportion on, distribute evenly
          const perBucket = Math.ceil(remainingReinvestments / exitDistribution.length);
          exitDistribution.forEach((bucket, index) => {
            bucket.reinvestmentCount += perBucket;
            bucket.count += perBucket;
          });
        }
      }
    }



    // Calculate zone distribution with proper validation
    const zoneDistribution = {
      green: 0,
      yellow: 0,
      red: 0
    };

    // Calculate total capital by zone for weighted metrics
    const zoneTotalCapital = {
      green: 0,
      yellow: 0,
      red: 0
    };

    // Group loans by zone with proper validation
    const loansByZone = {
      green: [] as any[],
      yellow: [] as any[],
      red: [] as any[]
    };

    // Process loans for zone distribution
    loans.forEach((loan: any) => {
      // Validate zone value
      const zone = typeof loan.zone === 'string' && ['green', 'yellow', 'red'].includes(loan.zone) ?
                  loan.zone : 'green';

      // Increment zone count
      zoneDistribution[zone]++;

      // Add loan to zone group
      loansByZone[zone].push(loan);

      // Add loan amount to zone total capital
      const loanAmount = typeof loan.loan_amount === 'number' ?
                        loan.loan_amount :
                        typeof loan.loan_amount === 'string' ?
                        parseFloat(loan.loan_amount) : 0;

      if (!isNaN(loanAmount)) {
        zoneTotalCapital[zone] += loanAmount;
      }
    });

    // Initialize zone metrics with more detailed structure
    const zoneMetrics = {
      green: {
        loans: 0,
        totalCapital: 0,
        medianIrr: 0,
        avgIrr: 0,
        minIrr: 0,
        maxIrr: 0,
        p10Irr: 0,
        p90Irr: 0,
        avgLtv: 0,
        medianLtv: 0,
        defaultRate: 0,
        var99: 0,
        avgExitYear: 0,
        medianExitYear: 0
      },
      yellow: {
        loans: 0,
        totalCapital: 0,
        medianIrr: 0,
        avgIrr: 0,
        minIrr: 0,
        maxIrr: 0,
        p10Irr: 0,
        p90Irr: 0,
        avgLtv: 0,
        medianLtv: 0,
        defaultRate: 0,
        var99: 0,
        avgExitYear: 0,
        medianExitYear: 0
      },
      red: {
        loans: 0,
        totalCapital: 0,
        medianIrr: 0,
        avgIrr: 0,
        minIrr: 0,
        maxIrr: 0,
        p10Irr: 0,
        p90Irr: 0,
        avgLtv: 0,
        medianLtv: 0,
        defaultRate: 0,
        var99: 0,
        avgExitYear: 0,
        medianExitYear: 0
      }
    };

    // Calculate zone metrics with proper validation
    Object.keys(zoneMetrics).forEach((zone) => {
      const zoneLoans = loansByZone[zone];
      if (zoneLoans.length === 0) return;

      // Basic metrics
      zoneMetrics[zone].loans = zoneLoans.length;
      zoneMetrics[zone].totalCapital = zoneTotalCapital[zone];

      // Extract and validate IRR values
      const validZoneIrrs = zoneLoans
        .map((loan: any) => {
          const irr = typeof loan.irr === 'number' ?
                     loan.irr :
                     typeof loan.irr === 'string' ?
                     parseFloat(loan.irr) : null;
          return isNaN(irr) ? null : irr;
        })
        .filter((irr: number | null): irr is number => irr !== null)
        .sort((a: number, b: number) => a - b);

      // Calculate IRR statistics
      if (validZoneIrrs.length > 0) {
        // Median IRR
        const midIrr = Math.floor(validZoneIrrs.length / 2);
        zoneMetrics[zone].medianIrr = validZoneIrrs.length % 2 === 0 ?
                                     (validZoneIrrs[midIrr - 1] + validZoneIrrs[midIrr]) / 2 :
                                     validZoneIrrs[midIrr];

        // Average IRR
        zoneMetrics[zone].avgIrr = validZoneIrrs.reduce((sum, irr) => sum + irr, 0) / validZoneIrrs.length;

        // Min/Max IRR
        zoneMetrics[zone].minIrr = validZoneIrrs[0];
        zoneMetrics[zone].maxIrr = validZoneIrrs[validZoneIrrs.length - 1];

        // Percentile IRRs
        const p10Index = Math.floor(validZoneIrrs.length * 0.1);
        const p90Index = Math.floor(validZoneIrrs.length * 0.9);
        zoneMetrics[zone].p10Irr = validZoneIrrs[p10Index];
        zoneMetrics[zone].p90Irr = validZoneIrrs[p90Index];
      }

      // Extract and validate LTV values
      const validZoneLtvs = zoneLoans
        .map((loan: any) => {
          const ltv = typeof loan.ltv === 'number' ?
                     loan.ltv :
                     typeof loan.ltv === 'string' ?
                     parseFloat(loan.ltv) : null;
          return isNaN(ltv) ? null : ltv;
        })
        .filter((ltv: number | null): ltv is number => ltv !== null)
        .sort((a: number, b: number) => a - b);

      // Calculate LTV statistics
      if (validZoneLtvs.length > 0) {
        // Average LTV
        zoneMetrics[zone].avgLtv = validZoneLtvs.reduce((sum, ltv) => sum + ltv, 0) / validZoneLtvs.length;

        // Median LTV
        const midLtv = Math.floor(validZoneLtvs.length / 2);
        zoneMetrics[zone].medianLtv = validZoneLtvs.length % 2 === 0 ?
                                     (validZoneLtvs[midLtv - 1] + validZoneLtvs[midLtv]) / 2 :
                                     validZoneLtvs[midLtv];
      }

      // Calculate default rate with proper validation
      const defaultedLoans = zoneLoans.filter((loan: any) => {
        return typeof loan.is_default === 'boolean' ? loan.is_default :
               typeof loan.is_default === 'string' ? loan.is_default.toLowerCase() === 'true' : false;
      });

      zoneMetrics[zone].defaultRate = zoneLoans.length > 0 ? defaultedLoans.length / zoneLoans.length : 0;

      // Get VaR 99% from metrics if available, otherwise use zone-specific default
      zoneMetrics[zone].var99 = typeof metrics.var_99 === 'number' && !isNaN(metrics.var_99) ?
                               metrics.var_99 :
                               zone === 'green' ? 0.05 :
                               zone === 'yellow' ? 0.08 : 0.12;

      // Extract and validate exit years
      const validZoneExitYears = zoneLoans
        .map((loan: any) => {
          const exitYear = typeof loan.expected_exit_year === 'number' ?
                          loan.expected_exit_year :
                          typeof loan.expected_exit_year === 'string' ?
                          parseFloat(loan.expected_exit_year) : null;

          const originationYear = typeof loan.origination_year === 'number' ?
                                 loan.origination_year :
                                 typeof loan.origination_year === 'string' ?
                                 parseFloat(loan.origination_year) : null;

          if (exitYear === null || originationYear === null || isNaN(exitYear) || isNaN(originationYear)) {
            return null;
          }

          return exitYear - originationYear;
        })
        .filter((years: number | null): years is number => years !== null && years >= 0)
        .sort((a: number, b: number) => a - b);

      // Calculate exit year statistics
      if (validZoneExitYears.length > 0) {
        // Average exit year
        zoneMetrics[zone].avgExitYear = validZoneExitYears.reduce((sum, years) => sum + years, 0) / validZoneExitYears.length;

        // Median exit year
        const midExit = Math.floor(validZoneExitYears.length / 2);
        zoneMetrics[zone].medianExitYear = validZoneExitYears.length % 2 === 0 ?
                                          (validZoneExitYears[midExit - 1] + validZoneExitYears[midExit]) / 2 :
                                          validZoneExitYears[midExit];
      }
    });

    // Get top 10 loans by IRR with proper validation
    const validLoansForRanking = loans
      .map((loan: any) => {
        // Validate all required fields
        const id = loan.id;
        if (!id) return null;

        const irr = typeof loan.irr === 'number' ?
                   loan.irr :
                   typeof loan.irr === 'string' ?
                   parseFloat(loan.irr) : null;
        if (irr === null || isNaN(irr)) return null;

        // Extract and validate other fields
        const suburb = typeof loan.suburb === 'string' ? loan.suburb : 'Unknown';

        const exitYear = typeof loan.expected_exit_year === 'number' ?
                        loan.expected_exit_year :
                        typeof loan.expected_exit_year === 'string' ?
                        parseFloat(loan.expected_exit_year) : null;
        const exitMonth = exitYear !== null && !isNaN(exitYear) ? exitYear * 12 : 0;

        const gpCarry = typeof loan.gp_carry === 'number' ?
                       loan.gp_carry :
                       typeof loan.gp_carry === 'string' ?
                       parseFloat(loan.gp_carry) : 0;

        const tlsRiskScore = typeof loan.tls_risk_score === 'number' ?
                            loan.tls_risk_score :
                            typeof loan.tls_risk_score === 'string' ?
                            parseFloat(loan.tls_risk_score) : 0;

        const zone = typeof loan.zone === 'string' && ['green', 'yellow', 'red'].includes(loan.zone) ?
                    loan.zone : 'green';

        const loanAmount = typeof loan.loan_amount === 'number' ?
                          loan.loan_amount :
                          typeof loan.loan_amount === 'string' ?
                          parseFloat(loan.loan_amount) : 0;

        return {
          id,
          suburb,
          irr,
          exitMonth,
          gpCarry: isNaN(gpCarry) ? 0 : gpCarry,
          tlsRiskScore: isNaN(tlsRiskScore) ? 0 : tlsRiskScore,
          zone,
          loanAmount: isNaN(loanAmount) ? 0 : loanAmount
        };
      })
      .filter((loan): loan is any => loan !== null);

    // Sort by IRR and take top 10
    const topLoans = [...validLoansForRanking]
      .sort((a, b) => b.irr - a.irr)
      .slice(0, 10);

    // Prepare scatter plot data with proper validation
    const scatterData = loans
      .map((loan: any) => {
        // Validate all required fields
        const id = loan.id;
        if (!id) return null;

        const loanAmount = typeof loan.loan_amount === 'number' ?
                          loan.loan_amount :
                          typeof loan.loan_amount === 'string' ?
                          parseFloat(loan.loan_amount) : null;
        if (loanAmount === null || isNaN(loanAmount) || loanAmount <= 0) return null;

        const irr = typeof loan.irr === 'number' ?
                   loan.irr :
                   typeof loan.irr === 'string' ?
                   parseFloat(loan.irr) : null;
        if (irr === null || isNaN(irr)) return null;

        const zone = typeof loan.zone === 'string' && ['green', 'yellow', 'red'].includes(loan.zone) ?
                    loan.zone : 'green';

        const exitYear = typeof loan.expected_exit_year === 'number' ?
                        loan.expected_exit_year :
                        typeof loan.expected_exit_year === 'string' ?
                        parseFloat(loan.expected_exit_year) : null;

        const originationYear = typeof loan.origination_year === 'number' ?
                               loan.origination_year :
                               typeof loan.origination_year === 'string' ?
                               parseFloat(loan.origination_year) : null;

        let exitMonth = 0;
        if (exitYear !== null && originationYear !== null && !isNaN(exitYear) && !isNaN(originationYear)) {
          exitMonth = (exitYear - originationYear) * 12;
        }

        return {
          id,
          size: loanAmount,
          irr,
          zone,
          exitMonth,
          suburb: typeof loan.suburb === 'string' ? loan.suburb : 'Unknown',
          tlsRiskScore: typeof loan.tls_risk_score === 'number' ?
                       loan.tls_risk_score :
                       typeof loan.tls_risk_score === 'string' ?
                       parseFloat(loan.tls_risk_score) : 0
        };
      })
      .filter((data): data is any => data !== null);

    // If we have portfolio evolution reinvestments but no reinvestment loans identified,
    // update the counts to use the portfolio evolution data
    const finalOriginalLoanCount =
      portfolioEvolutionReinvestments > 0 && reinvestmentLoanCount === 0 ?
      Math.max(0, loans.length - portfolioEvolutionReinvestments) :
      originalLoanCount;

    const finalReinvestmentLoanCount =
      portfolioEvolutionReinvestments > 0 && reinvestmentLoanCount === 0 ?
      portfolioEvolutionReinvestments :
      reinvestmentLoanCount;

    // Calculate deployment and reinvestment periods from parameters or portfolio evolution
    let deploymentPeriod = null;
    let reinvestmentPeriod = null;

    // Try to get from parameters
    if (results.parameters) {
      if (typeof results.parameters.deployment_period === 'number') {
        deploymentPeriod = results.parameters.deployment_period;
      }

      if (typeof results.parameters.reinvestment_period === 'number') {
        reinvestmentPeriod = results.parameters.reinvestment_period;
      }
    }

    // Try to get from config if not found in parameters
    if (deploymentPeriod === null && simulation?.config) {
      if (typeof simulation.config.deployment_period === 'number') {
        deploymentPeriod = simulation.config.deployment_period;
      }
    }

    if (reinvestmentPeriod === null && simulation?.config) {
      if (typeof simulation.config.reinvestment_period === 'number') {
        reinvestmentPeriod = simulation.config.reinvestment_period;
      }
    }

    // Try to infer from portfolio evolution data if still not found
    if ((deploymentPeriod === null || reinvestmentPeriod === null) && results.portfolio_evolution) {
      const years = Object.keys(results.portfolio_evolution)
        .filter(year => !isNaN(Number(year)))
        .map(Number)
        .sort((a, b) => a - b);

      if (years.length > 0) {
        // If deployment period is not set, estimate it as 1/3 of the total years
        if (deploymentPeriod === null) {
          deploymentPeriod = Math.ceil(years.length / 3);
        }

        // If reinvestment period is not set, estimate it as 2/3 of the total years
        if (reinvestmentPeriod === null) {
          reinvestmentPeriod = Math.ceil(years.length * 2 / 3);
        }
      }
    }

    return {
      loanCount,
      totalCapital,
      medianLtv,
      netIrr,
      wal,
      liquidityBuffer,
      ltvDistribution,
      exitDistribution,
      meanExit,
      medianExit,
      zoneDistribution,
      zoneMetrics,
      topLoans,
      scatterData,
      // Add new properties for dynamic charts
      minLtvPercent,
      maxLtvPercent,
      originalLoanCount: finalOriginalLoanCount,
      reinvestmentLoanCount: finalReinvestmentLoanCount,
      // Add portfolio evolution data
      portfolioEvolutionReinvestments,
      // Add deployment and reinvestment periods
      deploymentPeriod,
      reinvestmentPeriod
    };
  }, [results, isLoading]);

  // Extract portfolio lifecycle data with proper validation
  const lifecycleData = React.useMemo(() => {
    if (!results || isLoading) return null;

    // Safely extract cash flows with type checking
    const cashFlows = typeof results.cash_flows === 'object' ? results.cash_flows || {} : {};

    // Get years from cash flows with validation
    const years = Object.keys(cashFlows)
      .filter(year => !isNaN(Number(year)) && Number(year) >= 0)
      .map(Number)
      .sort((a, b) => a - b);

    if (years.length === 0) return null;

    // Create data points for each year with proper validation
    const data = years.map(year => {
      const yearStr = year.toString();
      const yearData = typeof cashFlows[yearStr] === 'object' ? cashFlows[yearStr] || {} : {};

      // Extract and validate cash flow components
      const capitalCalled = typeof yearData.capital_called === 'number' && !isNaN(yearData.capital_called) ?
                           yearData.capital_called : 0;

      const interestIncome = typeof yearData.interest_income === 'number' && !isNaN(yearData.interest_income) ?
                            yearData.interest_income : 0;

      const appreciation = typeof yearData.appreciation === 'number' && !isNaN(yearData.appreciation) ?
                          yearData.appreciation : 0;

      const distributions = typeof yearData.distributions === 'number' && !isNaN(yearData.distributions) ?
                           yearData.distributions : 0;

      const netCashFlow = typeof yearData.net_cash_flow === 'number' && !isNaN(yearData.net_cash_flow) ?
                         yearData.net_cash_flow : 0;

      // Extract and validate percentiles from the year data
      const percentiles = typeof yearData.percentiles === 'object' ? yearData.percentiles || {} : {};

      // Default values for percentiles
      let p10 = 0;
      let p50 = netCashFlow; // Default to the actual net cash flow
      let p90 = 0;

      // Try to get percentiles from the year data
      if (typeof percentiles.p10 === 'number' && !isNaN(percentiles.p10)) {
        p10 = percentiles.p10;
      }

      if (typeof percentiles.p50 === 'number' && !isNaN(percentiles.p50)) {
        p50 = percentiles.p50;
      }

      if (typeof percentiles.p90 === 'number' && !isNaN(percentiles.p90)) {
        p90 = percentiles.p90;
      }

      // Extract portfolio value and cash balance for additional metrics
      const portfolioValue = typeof yearData.portfolio_value === 'number' && !isNaN(yearData.portfolio_value) ?
                            yearData.portfolio_value : 0;

      const cashBalance = typeof yearData.cash_balance === 'number' && !isNaN(yearData.cash_balance) ?
                         yearData.cash_balance : 0;

      return {
        year,
        yearLabel: `Year ${year}`,
        drawdowns: Math.abs(capitalCalled),
        interest: interestIncome,
        appreciation: appreciation,
        distributions: distributions,
        netCashFlow: netCashFlow,
        p10: p10,
        p50: p50,
        p90: p90,
        portfolioValue: portfolioValue,
        cashBalance: cashBalance,
        totalValue: portfolioValue + Math.max(0, cashBalance),
        cumulativeDrawdowns: 0, // Will be calculated in a second pass
        cumulativeDistributions: 0, // Will be calculated in a second pass
        cumulativeNetCashFlow: 0 // Will be calculated in a second pass
      };
    });

    // Calculate cumulative values
    let cumulativeDrawdowns = 0;
    let cumulativeDistributions = 0;
    let cumulativeNetCashFlow = 0;

    data.forEach((item, index) => {
      cumulativeDrawdowns += item.drawdowns;
      cumulativeDistributions += item.distributions;
      cumulativeNetCashFlow += item.netCashFlow;

      data[index].cumulativeDrawdowns = cumulativeDrawdowns;
      data[index].cumulativeDistributions = cumulativeDistributions;
      data[index].cumulativeNetCashFlow = cumulativeNetCashFlow;
    });

    return data;
  }, [results, isLoading]);



  // Enhance lifecycle data with Monte Carlo or variance analysis data
  const enhancedLifecycleData = React.useMemo(() => {
    if (!lifecycleData) return null;

    try {
      // Create a copy of the lifecycle data to enhance
      const enhancedData = [...lifecycleData];

      // Check if we have Monte Carlo data from the visualization endpoint
      if (monteCarloData && monteCarloData.datasets) {
        console.log('Enhancing lifecycle data with Monte Carlo visualization data');

        // Find the percentile datasets
        const p10Dataset = monteCarloData.datasets.find((d: any) =>
          d.label === 'P10' || d.label === 'p10' || d.label === '10th Percentile');
        const p50Dataset = monteCarloData.datasets.find((d: any) =>
          d.label === 'P50' || d.label === 'p50' || d.label === 'Median' || d.label === '50th Percentile');
        const p90Dataset = monteCarloData.datasets.find((d: any) =>
          d.label === 'P90' || d.label === 'p90' || d.label === '90th Percentile');

        if (p10Dataset && p50Dataset && p90Dataset) {
          console.log('Found percentile datasets in Monte Carlo data');

          // Apply the percentiles to each year's cash flow
          enhancedData.forEach((item, index) => {
            // Only apply if we have data for this year
            if (index < p10Dataset.data.length &&
                index < p50Dataset.data.length &&
                index < p90Dataset.data.length) {

              // Get the percentile values
              const p10Value = p10Dataset.data[index];
              const p50Value = p50Dataset.data[index];
              const p90Value = p90Dataset.data[index];

              // Apply the percentiles
              if (p10Value !== undefined && p50Value !== undefined && p90Value !== undefined) {
                item.p10 = p10Value;
                item.p50 = p50Value;
                item.p90 = p90Value;

                console.log(`Year ${item.year} - Monte Carlo Visualization: P10: ${item.p10.toFixed(2)}, P50: ${item.p50.toFixed(2)}, P90: ${item.p90.toFixed(2)}`);
              }
            }
          });

          return enhancedData;
        }
      }

      // Check if we have Monte Carlo data with cash flow fan chart
      if (monteCarloData && monteCarloData.cash_flow_fan_chart) {
        console.log('Enhancing lifecycle data with Monte Carlo cash flow fan chart data');
        console.log('Monte Carlo data structure:', Object.keys(monteCarloData));

        // Check if we have zone IRRs
        if (monteCarloData.zone_irrs) {
          console.log('Zone IRRs available in Monte Carlo results:', Object.keys(monteCarloData.zone_irrs));
        } else {
          console.log('[DATA] No zone IRRs available in Monte Carlo results');
        }

        // Extract cash flow fan chart data
        const fanChartData = monteCarloData.cash_flow_fan_chart;
        console.log('Cash Flow Fan Chart data:', fanChartData);

        if (fanChartData && fanChartData.years && fanChartData.median && fanChartData.p10 && fanChartData.p90) {
          console.log('Using real Monte Carlo cash flow fan chart data');

          // Map the fan chart data to the lifecycle data
          enhancedData.forEach((item) => {
            // Find the matching year in the fan chart data
            const yearIndex = fanChartData.years.indexOf(item.year);
            if (yearIndex !== -1) {
              // Apply the fan chart values
              item.p10 = fanChartData.p10[yearIndex];
              item.p50 = fanChartData.median[yearIndex];
              item.p90 = fanChartData.p90[yearIndex];

              console.log(`Year ${item.year} - Monte Carlo Fan Chart: P10: ${item.p10.toFixed(2)}, P50: ${item.p50.toFixed(2)}, P90: ${item.p90.toFixed(2)}`);
            }
          });

          return enhancedData;
        }
      }

      // No fallback - we only use real Monte Carlo data
      console.log('No Monte Carlo fan chart data available - not using fallbacks');

      // We don't use variance analysis as a fallback - only real Monte Carlo data
      console.log('No variance analysis data will be used - only real Monte Carlo data');

      // If we don't have Monte Carlo or variance analysis data, log this and return null
      console.log('No Monte Carlo or variance analysis data available');
      console.log('monteCarloData:', monteCarloData);
      console.log('varianceData:', varianceData);
      return null;

    } catch (error) {
      console.error('Error enhancing lifecycle data:', error);
      return null;
    }
  }, [lifecycleData, monteCarloData, varianceData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No results data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Portfolio & Returns Analysis</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Loan CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Portfolio JSON</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Variance Bundle</span>
          </Button>
        </div>
      </div>

      {/* 1. Portfolio-Level Overview */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Portfolio-Level Overview</h2>

        {/* 1A. Headline KPI Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Loan Count */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Loan Count</div>
              <div className="text-2xl font-bold">{formatNumber(portfolioMetrics?.loanCount || 0)}</div>
              <div className="h-8 mt-2">
                {lifecycleData && lifecycleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lifecycleData}>
                      <Line
                        type="monotone"
                        dataKey="year"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm text-xs">
                                <p>Year {payload[0].payload.year}: {formatNumber(payload[0].payload.year)} loans</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>P10: {formatNumber(portfolioMetrics?.loanCount * 0.9 || 0)}</span>
                <span>P90: {formatNumber(portfolioMetrics?.loanCount * 1.1 || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Capital Deployed */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Total Capital Deployed</div>
              <div className="text-2xl font-bold">{formatCurrency(portfolioMetrics?.totalCapital || 0, { notation: 'compact' })}</div>
              <div className="h-8 mt-2">
                {lifecycleData && lifecycleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lifecycleData}>
                      <Line
                        type="monotone"
                        dataKey="cumulativeDrawdowns"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm text-xs">
                                <p>Year {payload[0].payload.year}: {formatCurrency(payload[0].payload.cumulativeDrawdowns)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>P10: {formatCurrency(portfolioMetrics?.totalCapital * 0.9 || 0, { notation: 'compact' })}</span>
                <span>P90: {formatCurrency(portfolioMetrics?.totalCapital * 1.1 || 0, { notation: 'compact' })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Median LTV */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Median LTV</div>
              <div className="text-2xl font-bold">{formatPercent(portfolioMetrics?.medianLtv || 0)}</div>
              <div className="h-8 mt-2">
                {portfolioMetrics?.ltvDistribution && portfolioMetrics.ltvDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={portfolioMetrics.ltvDistribution}>
                      <Bar
                        dataKey="count"
                        fill="#10b981"
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm text-xs">
                                <p>{payload[0].payload.range}: {formatNumber(payload[0].payload.count)} loans</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>Min: {formatPercent(portfolioMetrics?.zoneMetrics?.green?.minIrr || 0)}</span>
                <span>Max: {formatPercent(portfolioMetrics?.zoneMetrics?.red?.maxIrr || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Net IRR (Median) */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Net IRR (Median)</div>
              <div className="text-2xl font-bold">{formatPercent(portfolioMetrics?.netIrr || 0)}</div>
              <div className="h-8 mt-2">
                {portfolioMetrics?.zoneMetrics ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { zone: 'Green', irr: portfolioMetrics.zoneMetrics.green.medianIrr },
                        { zone: 'Yellow', irr: portfolioMetrics.zoneMetrics.yellow.medianIrr },
                        { zone: 'Red', irr: portfolioMetrics.zoneMetrics.red.medianIrr }
                      ]}
                    >
                      <Bar
                        dataKey="irr"
                        fill={(entry) => entry.zone === 'Green' ? '#10b981' : entry.zone === 'Yellow' ? '#f59e0b' : '#ef4444'}
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm text-xs">
                                <p>{payload[0].payload.zone}: {formatPercent(payload[0].payload.irr)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>P10: {formatPercent(portfolioMetrics?.netIrr * 0.8 || 0)}</span>
                <span>P90: {formatPercent(portfolioMetrics?.netIrr * 1.2 || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Weighted-Average Life (WAL) */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Weighted-Average Life</div>
              <div className="text-2xl font-bold">{(portfolioMetrics?.wal || 0).toFixed(1)} yrs</div>
              <div className="h-8 mt-2">
                {portfolioMetrics?.exitDistribution && portfolioMetrics.exitDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={portfolioMetrics.exitDistribution}>
                      <Bar
                        dataKey="count"
                        fill="#8b5cf6"
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm text-xs">
                                <p>{payload[0].payload.range}: {formatNumber(payload[0].payload.count)} loans</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>Mean: {portfolioMetrics?.meanExit.toFixed(1) || 0} yrs</span>
                <span>Median: {portfolioMetrics?.medianExit.toFixed(1) || 0} yrs</span>
              </div>
            </CardContent>
          </Card>

          {/* Liquidity Buffer (Peak Draw-down) */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 mb-1">Liquidity Buffer</div>
              <div className="text-2xl font-bold">{formatPercent(portfolioMetrics?.liquidityBuffer || 0)} NAV</div>
              <div className="h-8 mt-2">
                {lifecycleData && lifecycleData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lifecycleData}>
                      <Line
                        type="monotone"
                        dataKey="cashBalance"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm text-xs">
                                <p>Year {payload[0].payload.year}: {formatCurrency(payload[0].payload.cashBalance)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>Min: {formatPercent(portfolioMetrics?.liquidityBuffer * 0.8 || 0)}</span>
                <span>Max: {formatPercent(portfolioMetrics?.liquidityBuffer * 1.2 || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 1B. LTV Bell Curve */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>LTV Distribution</CardTitle>
                <CardDescription>Histogram of all loan-level LTVs</CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                <span>Min LTV: {portfolioMetrics?.minLtvPercent ? `${portfolioMetrics.minLtvPercent}%` : 'N/A'}</span>
                <span className="mx-2">|</span>
                <span>Max LTV: {portfolioMetrics?.maxLtvPercent ? `${portfolioMetrics.maxLtvPercent}%` : 'N/A'}</span>
                <span className="mx-2">|</span>
                <span>Median: {portfolioMetrics?.medianLtv ? `${(portfolioMetrics.medianLtv * 100).toFixed(1)}%` : 'N/A'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {portfolioMetrics?.ltvDistribution && portfolioMetrics.ltvDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={portfolioMetrics.ltvDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 12, fill: '#4b5563' }}
                      stroke="#9ca3af"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tickFormatter={(value) => formatNumber(value)}
                      stroke="#9ca3af"
                      tick={{ fill: '#4b5563' }}
                      domain={[0, 'auto']} // Dynamic Y-axis scaling
                      allowDecimals={false} // Prevent decimal ticks for loan counts
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const bucketData = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg">
                              <p className="font-medium text-gray-900 mb-2">{label}</p>
                              <div className="space-y-1">
                                {payload.map((entry, index) => (
                                  <div key={`tooltip-${index}`} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm text-gray-700">{entry.name}:</span>
                                    <span className="text-sm font-medium">{entry.value !== undefined ? entry.value.toLocaleString() : 'N/A'}</span>
                                  </div>
                                ))}
                                <div className="text-xs text-gray-500 mt-1">
                                  {bucketData.loans?.length > 0 ? (
                                    <>
                                      <div>{bucketData.loans.length} loans in this bucket</div>
                                      <div>
                                        {bucketData.loans.length > 0 && bucketData.zoneBreakdown ? (
                                          <div className="flex flex-col mt-1">
                                            {Object.entries(bucketData.zoneBreakdown).map(([zone, count]) => (
                                              <div key={zone} className="flex items-center gap-1">
                                                <div
                                                  className={`w-2 h-2 rounded-full ${
                                                    zone === 'green' ? 'bg-emerald-500' :
                                                    zone === 'yellow' ? 'bg-amber-500' :
                                                    'bg-red-500'
                                                  }`}
                                                />
                                                <span>{zone.charAt(0).toUpperCase() + zone.slice(1)}: {count}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : null}
                                      </div>
                                    </>
                                  ) : (
                                    'No loans in this bucket'
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Loans"
                      fill="#10b981"
                      onClick={(data) => setSelectedLtvBucket([data.bucket, data.bucket + 5])}
                    />
                    {/* Add a curve line to show the distribution shape */}
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                    {/* Add median LTV reference line */}
                    {portfolioMetrics?.medianLtv && (
                      <ReferenceLine
                        x={`${Math.floor(portfolioMetrics.medianLtv * 100 / 5) * 5}% - ${Math.floor(portfolioMetrics.medianLtv * 100 / 5) * 5 + 5}%`}
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        label={{
                          value: 'Median',
                          position: 'top',
                          fill: '#8b5cf6',
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No LTV distribution data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 1C. Exit-Timing Bell Curve */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Exit Timing Distribution</CardTitle>
                <CardDescription>Histogram of exit years with mean and median lines</CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Original Loans: {portfolioMetrics?.originalLoanCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Reinvestment Loans: {portfolioMetrics?.reinvestmentLoanCount || 0}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {portfolioMetrics?.exitDistribution && portfolioMetrics.exitDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={portfolioMetrics.exitDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 12, fill: '#4b5563' }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tickFormatter={(value) => formatNumber(value)}
                      stroke="#9ca3af"
                      tick={{ fill: '#4b5563' }}
                      domain={[0, 'auto']} // Dynamic Y-axis scaling
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg">
                              <p className="font-medium text-gray-900 mb-2">{label}</p>
                              <div className="space-y-1">
                                {payload.map((entry, index) => (
                                  <div key={`tooltip-${index}`} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm text-gray-700">{entry.name}:</span>
                                    <span className="text-sm font-medium">{entry.value !== undefined ? entry.value.toLocaleString() : 'N/A'}</span>
                                  </div>
                                ))}
                                <div className="text-xs text-gray-500 mt-1">
                                  Click to filter by this year
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="originalCount"
                      name="Original Loans"
                      stackId="a"
                      fill="#3b82f6" // Blue
                      onClick={(data) => setSelectedExitPeriod([data.year, data.year + 1])}
                    />
                    <Bar
                      dataKey="reinvestmentCount"
                      name="Reinvestment Loans"
                      stackId="a"
                      fill="#8b5cf6" // Purple
                      onClick={(data) => setSelectedExitPeriod([data.year, data.year + 1])}
                    />
                    <ReferenceLine
                      x={portfolioMetrics.meanExit ? `Year ${Math.round(portfolioMetrics.meanExit)}` : undefined}
                      stroke="#ef4444" // Red
                      strokeWidth={2}
                      label={{
                        value: 'Mean',
                        position: 'top',
                        fill: '#ef4444',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}
                    />
                    <ReferenceLine
                      x={portfolioMetrics.medianExit ? `Year ${Math.round(portfolioMetrics.medianExit)}` : undefined}
                      stroke="#10b981" // Green
                      strokeWidth={2}
                      label={{
                        value: 'Median',
                        position: 'top',
                        fill: '#10b981',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}
                    />
                    <Brush
                      dataKey="range"
                      height={30}
                      stroke="#8884d8"
                      onChange={(brushData) => {
                        if (brushData.startIndex !== brushData.endIndex) {
                          setSelectedExitPeriod([
                            portfolioMetrics.exitDistribution[brushData.startIndex].year,
                            portfolioMetrics.exitDistribution[brushData.endIndex].year
                          ]);
                        }
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No exit timing data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 1D. Portfolio Life-Cycle Area Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Portfolio Life-Cycle</CardTitle>
                <CardDescription>Stacked area chart showing capital flow over time</CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                <span>Years: {lifecycleData ? lifecycleData.length : 0}</span>
                <span className="mx-2">|</span>
                <span>Total Capital: {formatCurrency(portfolioMetrics?.totalCapital || 0, { notation: 'compact' })}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {lifecycleData && lifecycleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={lifecycleData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="yearLabel"
                      tick={{ fontSize: 12, fill: '#4b5563' }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                      stroke="#9ca3af"
                      tick={{ fill: '#4b5563' }}
                      domain={['auto', 'auto']} // Dynamic Y-axis scaling
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const yearData = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg">
                              <p className="font-medium text-gray-900 mb-2">{label}</p>
                              <div className="space-y-1">
                                {payload.map((entry, index) => (
                                  <div key={`tooltip-${index}`} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm text-gray-700">{entry.name}:</span>
                                    <span className="text-sm font-medium">{formatCurrency(entry.value)}</span>
                                  </div>
                                ))}
                                <div className="border-t border-gray-200 mt-2 pt-2">
                                  <div className="flex justify-between text-xs">
                                    <span>Portfolio Value:</span>
                                    <span className="font-medium">{formatCurrency(yearData.portfolioValue)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>Cash Balance:</span>
                                    <span className="font-medium">{formatCurrency(yearData.cashBalance)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs font-medium">
                                    <span>Total Value:</span>
                                    <span>{formatCurrency(yearData.totalValue)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="drawdowns"
                      name="Draw-downs"
                      stackId="1"
                      fill={CHART_COLORS.drawdowns}
                      stroke={CHART_COLORS.drawdowns}
                      fillOpacity={0.6}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="interest"
                      name="Interest"
                      stackId="1"
                      fill={CHART_COLORS.interest}
                      stroke={CHART_COLORS.interest}
                      fillOpacity={0.6}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="appreciation"
                      name="Appreciation"
                      stackId="1"
                      fill={CHART_COLORS.appreciation}
                      stroke={CHART_COLORS.appreciation}
                      fillOpacity={0.6}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="distributions"
                      name="Distributions"
                      stackId="1"
                      fill={CHART_COLORS.distributions}
                      stroke={CHART_COLORS.distributions}
                      fillOpacity={0.6}
                      isAnimationActive={false}
                    />
                    {/* Add reference lines for deployment and reinvestment periods if available */}
                    {portfolioMetrics?.deploymentPeriod && (
                      <ReferenceLine
                        x={`Year ${portfolioMetrics.deploymentPeriod}`}
                        stroke={CHART_COLORS.deploymentEnd}
                        strokeDasharray="3 3"
                        strokeWidth={2}
                        label={{
                          value: 'Deployment End',
                          position: 'top',
                          fill: CHART_COLORS.deploymentEnd,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                    {portfolioMetrics?.reinvestmentPeriod && (
                      <ReferenceLine
                        x={`Year ${portfolioMetrics.reinvestmentPeriod}`}
                        stroke={CHART_COLORS.reinvestmentEnd}
                        strokeDasharray="3 3"
                        strokeWidth={2}
                        label={{
                          value: 'Reinvestment End',
                          position: 'top',
                          fill: CHART_COLORS.reinvestmentEnd,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No portfolio lifecycle data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 1E. Cash-Flow Fan Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Cash-Flow Fan Chart</CardTitle>
                <CardDescription>Showing P10, median, and P90 net cash-flow bands from Monte Carlo simulation</CardDescription>
              </div>
              <div className="flex gap-2">
                {isLoadingMonteCarlo ? (
                  <Badge variant="outline" className="bg-slate-100 text-slate-700">
                    Loading Monte Carlo Data...
                  </Badge>
                ) : monteCarloData && monteCarloData.statistics ? (
                  <Badge variant="outline" className="bg-green-100 text-green-700">
                    Monte Carlo Visualization Data
                  </Badge>
                ) : varianceData && varianceData.irr_percentiles ? (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700">
                    Variance Analysis Data
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-100 text-amber-700">
                    No Monte Carlo Data Available
                  </Badge>
                )}
                <Badge variant="outline" className="bg-slate-100 text-slate-700">
                  P10/P50/P90 Bands
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {enhancedLifecycleData && enhancedLifecycleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={enhancedLifecycleData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="yearLabel"
                      tick={{ fontSize: 12, fill: '#4b5563' }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                      stroke="#9ca3af"
                      tick={{ fill: '#4b5563' }}
                      domain={['auto', 'auto']} // Dynamic Y-axis scaling
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const yearData = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-md shadow-lg">
                              <p className="font-medium text-gray-900 mb-2">{label}</p>
                              <div className="space-y-1">
                                {payload.map((entry, index) => (
                                  <div key={`tooltip-${index}`} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-sm text-gray-700">{entry.name}:</span>
                                    <span className="text-sm font-medium">{formatCurrency(entry.value)}</span>
                                  </div>
                                ))}
                                <div className="border-t border-gray-200 mt-2 pt-2">
                                  <div className="flex justify-between text-xs">
                                    <span>Net Cash Flow:</span>
                                    <span className="font-medium">{formatCurrency(yearData.netCashFlow)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span>Cumulative:</span>
                                    <span className="font-medium">{formatCurrency(yearData.cumulativeNetCashFlow)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    {/* P10-P90 Range Area */}
                    <Area
                      type="monotone"
                      dataKey="p10"
                      name="P10"
                      stroke={CHART_COLORS.p10}
                      fill={CHART_COLORS.p10}
                      fillOpacity={0.2}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="p90"
                      name="P90"
                      stroke={CHART_COLORS.p90}
                      fill={CHART_COLORS.p90}
                      fillOpacity={0.2}
                      isAnimationActive={false}
                    />
                    {/* Median Line */}
                    <Line
                      type="monotone"
                      dataKey="p50"
                      name="Median (P50)"
                      stroke={CHART_COLORS.p50}
                      strokeWidth={2}
                      dot={{ r: 4, fill: CHART_COLORS.p50 }}
                      isAnimationActive={false}
                    />
                    {/* Net Cash Flow Line */}
                    <Line
                      type="monotone"
                      dataKey="netCashFlow"
                      name="Net Cash Flow"
                      stroke="#10b981" // emerald-500
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#10b981" }}
                      isAnimationActive={false}
                    />
                    {/* Add reference lines for deployment and reinvestment periods if available */}
                    {portfolioMetrics?.deploymentPeriod && (
                      <ReferenceLine
                        x={`Year ${portfolioMetrics.deploymentPeriod}`}
                        stroke={CHART_COLORS.deploymentEnd}
                        strokeDasharray="3 3"
                        strokeWidth={2}
                        label={{
                          value: 'Deployment End',
                          position: 'top',
                          fill: CHART_COLORS.deploymentEnd,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                    {portfolioMetrics?.reinvestmentPeriod && (
                      <ReferenceLine
                        x={`Year ${portfolioMetrics.reinvestmentPeriod}`}
                        stroke={CHART_COLORS.reinvestmentEnd}
                        strokeDasharray="3 3"
                        strokeWidth={2}
                        label={{
                          value: 'Reinvestment End',
                          position: 'top',
                          fill: CHART_COLORS.reinvestmentEnd,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                    {/* Add zero reference line */}
                    <ReferenceLine
                      y={0}
                      stroke="#9ca3af"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No cash flow fan data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Zone-Level Analytics */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Zone-Level Analytics</h2>

        {/* 2A. Traffic-Light Donut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Traffic-Light Zone Distribution</CardTitle>
              <CardDescription>Portfolio allocation by traffic light zones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {portfolioMetrics?.zoneDistribution ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Green Zone', value: portfolioMetrics.zoneDistribution.green || 0, color: CHART_COLORS.green },
                          { name: 'Yellow Zone', value: portfolioMetrics.zoneDistribution.yellow || 0, color: CHART_COLORS.yellow },
                          { name: 'Red Zone', value: portfolioMetrics.zoneDistribution.red || 0, color: CHART_COLORS.red }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Green Zone', value: portfolioMetrics.zoneDistribution.green || 0, color: CHART_COLORS.green },
                          { name: 'Yellow Zone', value: portfolioMetrics.zoneDistribution.yellow || 0, color: CHART_COLORS.yellow },
                          { name: 'Red Zone', value: portfolioMetrics.zoneDistribution.red || 0, color: CHART_COLORS.red }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatNumber(value), 'Loans']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No zone distribution data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 2B. Zone KPI Table */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Zone KPI Table</CardTitle>
              <CardDescription>Key performance indicators by zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zone</TableHead>
                      <TableHead>Loans</TableHead>
                      <TableHead>Median IRR</TableHead>
                      <TableHead>Avg LTV</TableHead>
                      <TableHead>Default Rate</TableHead>
                      <TableHead>VaR 99%</TableHead>
                      <TableHead>Avg Exit Yr</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioMetrics?.zoneMetrics ? (
                      <>
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedZone('green')}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              Green
                            </div>
                          </TableCell>
                          <TableCell>{formatNumber(portfolioMetrics.zoneMetrics.green.loans)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.green.medianIrr)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.green.avgLtv)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.green.defaultRate)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.green.var99)}</TableCell>
                          <TableCell>{portfolioMetrics.zoneMetrics.green.avgExitYear.toFixed(1)}</TableCell>
                        </TableRow>
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedZone('yellow')}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                              Yellow
                            </div>
                          </TableCell>
                          <TableCell>{formatNumber(portfolioMetrics.zoneMetrics.yellow.loans)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.yellow.medianIrr)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.yellow.avgLtv)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.yellow.defaultRate)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.yellow.var99)}</TableCell>
                          <TableCell>{portfolioMetrics.zoneMetrics.yellow.avgExitYear.toFixed(1)}</TableCell>
                        </TableRow>
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedZone('red')}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              Red
                            </div>
                          </TableCell>
                          <TableCell>{formatNumber(portfolioMetrics.zoneMetrics.red.loans)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.red.medianIrr)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.red.avgLtv)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.red.defaultRate)}</TableCell>
                          <TableCell>{formatPercent(portfolioMetrics.zoneMetrics.red.var99)}</TableCell>
                          <TableCell>{portfolioMetrics.zoneMetrics.red.avgExitYear.toFixed(1)}</TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">No zone metrics data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2C. Sydney Heat-Map */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Sydney Suburb Heat-Map</CardTitle>
            <CardDescription>Geographic distribution of IRR by suburb</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Sydney heat map visualization would be displayed here</p>
              <p className="text-muted-foreground ml-2">(Requires geographic data integration)</p>
            </div>
          </CardContent>
        </Card>

        {/* 2D. Zone Comparison Violin Plots */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Zone IRR Distribution</CardTitle>
            <CardDescription>Comparison of IRR distributions across zones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {portfolioMetrics?.scatterData && portfolioMetrics.scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="category"
                      dataKey="zone"
                      name="Zone"
                      tick={{ fontSize: 12, fill: '#4b5563' }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      type="number"
                      dataKey="irr"
                      name="IRR"
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      domain={[0, 'dataMax']}
                      stroke="#9ca3af"
                      tick={{ fill: '#4b5563' }}
                    />
                    <ZAxis
                      type="number"
                      dataKey="size"
                      range={[20, 200]}
                      name="Loan Size"
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'IRR') return [formatPercent(value), name];
                        if (name === 'Loan Size') return [formatCurrency(value), name];
                        return [value, name];
                      }}
                      cursor={{ strokeDasharray: '3 3' }}
                    />
                    <Legend />
                    <Scatter
                      name="Green Zone"
                      data={portfolioMetrics.scatterData.filter(d => d.zone === 'green')}
                      fill={CHART_COLORS.green}
                      onClick={(data) => setSelectedLoan(data.id)}
                    />
                    <Scatter
                      name="Yellow Zone"
                      data={portfolioMetrics.scatterData.filter(d => d.zone === 'yellow')}
                      fill={CHART_COLORS.yellow}
                      onClick={(data) => setSelectedLoan(data.id)}
                    />
                    <Scatter
                      name="Red Zone"
                      data={portfolioMetrics.scatterData.filter(d => d.zone === 'red')}
                      fill={CHART_COLORS.red}
                      onClick={(data) => setSelectedLoan(data.id)}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No zone IRR distribution data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Unit-Level Drill-Down */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Unit-Level Drill-Down</h2>

        {/* 3A. Top-10 Loans Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Top-10 Loans by IRR</CardTitle>
            <CardDescription>Highest performing loans in the portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Suburb</TableHead>
                    <TableHead>Sim IRR</TableHead>
                    <TableHead>Exit Month</TableHead>
                    <TableHead>GP Carry $</TableHead>
                    <TableHead>TLS Risk Score</TableHead>
                    <TableHead>Zone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioMetrics?.topLoans && portfolioMetrics.topLoans.length > 0 ? (
                    portfolioMetrics.topLoans.map((loan) => (
                      <TableRow
                        key={loan.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedLoan(loan.id)}
                      >
                        <TableCell className="font-medium">{loan.suburb}</TableCell>
                        <TableCell>{formatPercent(loan.irr)}</TableCell>
                        <TableCell>{loan.exitMonth}</TableCell>
                        <TableCell>{formatCurrency(loan.gpCarry)}</TableCell>
                        <TableCell>{loan.tlsRiskScore.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                loan.zone === 'green' ? 'bg-emerald-500' :
                                loan.zone === 'yellow' ? 'bg-amber-500' :
                                'bg-red-500'
                              }`}
                            ></div>
                            {loan.zone.charAt(0).toUpperCase() + loan.zone.slice(1)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No top loans data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 3B. Loan Timeline Mini-Chart (drawer) */}
        {selectedLoan && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Loan Timeline</CardTitle>
              <CardDescription>Detailed view of selected loan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">Loan timeline visualization would be displayed here</p>
                <p className="text-muted-foreground ml-2">(Requires loan-level time series data)</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3C. Scatter: Loan Size vs IRR */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Loan Size vs IRR</CardTitle>
            <CardDescription>Relationship between loan size and IRR by zone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {portfolioMetrics?.scatterData && portfolioMetrics.scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      dataKey="size"
                      name="Loan Size"
                      tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                      domain={['dataMin', 'dataMax']}
                      stroke="#9ca3af"
                      tick={{ fill: '#4b5563' }}
                    />
                    <YAxis
                      type="number"
                      dataKey="irr"
                      name="IRR"
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      domain={[0, 'dataMax']}
                      stroke="#9ca3af"
                      tick={{ fill: '#4b5563' }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'IRR') return [formatPercent(value), name];
                        if (name === 'Loan Size') return [formatCurrency(value), name];
                        return [value, name];
                      }}
                      cursor={{ strokeDasharray: '3 3' }}
                    />
                    <Legend />
                    <Scatter
                      name="Green Zone"
                      data={portfolioMetrics.scatterData.filter(d => d.zone === 'green')}
                      fill={CHART_COLORS.green}
                      onClick={(data) => setSelectedLoan(data.id)}
                    />
                    <Scatter
                      name="Yellow Zone"
                      data={portfolioMetrics.scatterData.filter(d => d.zone === 'yellow')}
                      fill={CHART_COLORS.yellow}
                      onClick={(data) => setSelectedLoan(data.id)}
                    />
                    <Scatter
                      name="Red Zone"
                      data={portfolioMetrics.scatterData.filter(d => d.zone === 'red')}
                      fill={CHART_COLORS.red}
                      onClick={(data) => setSelectedLoan(data.id)}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No loan size vs IRR data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}