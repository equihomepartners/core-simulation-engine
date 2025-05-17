import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatPercentage } from '../../lib/formatters';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface PortfolioHealthScoreProps {
  data: any;
  isLoading: boolean;
}

const PortfolioHealthScore: React.FC<PortfolioHealthScoreProps> = ({ data, isLoading }) => {
  // Extract necessary data
  const portfolioMetrics = data?.portfolio?.metrics || {};
  const performanceMetrics = data?.performance_metrics || data?.performanceMetrics || {};
  const config = data?.config || {};

  // Extract additional data
  const portfolioEvolution = data?.portfolio_evolution || data?.portfolioEvolution || {};
  const loans = data?.portfolio?.loans || [];
  const zoneDistribution = portfolioMetrics?.zone_distribution || portfolioMetrics?.zoneDistribution || {};
  const zoneTargets = config?.zone_allocations || config?.zone_targets || {};

  // Get the last year with data for current portfolio state
  const years = Object.keys(portfolioEvolution).map(Number).sort((a, b) => b - a);
  const lastYear = years[0]?.toString();
  const lastYearData = lastYear ? portfolioEvolution[lastYear] : null;

  // Calculate actual default rate
  const actualDefaultRate = lastYearData && (lastYearData.active_loans || lastYearData.activeLoans) > 0
    ? (lastYearData.defaulted_loans || lastYearData.defaultedLoans || 0) /
      ((lastYearData.active_loans || lastYearData.activeLoans) +
       (lastYearData.exited_loans || lastYearData.exitedLoans || 0))
    : portfolioMetrics?.expected_default_rate || portfolioMetrics?.expectedDefaultRate || 0;

  // Calculate health scores
  const calculateDiversificationScore = () => {
    // Calculate zone allocation variance
    const greenVariance = Math.abs((zoneDistribution?.green?.percentage || 0) - (zoneTargets?.green || 0.6));
    const orangeVariance = Math.abs((zoneDistribution?.orange?.percentage || 0) - (zoneTargets?.orange || 0.3));
    const redVariance = Math.abs((zoneDistribution?.red?.percentage || 0) - (zoneTargets?.red || 0.1));

    // Calculate average variance (lower is better)
    const avgVariance = (greenVariance + orangeVariance + redVariance) / 3;

    // Calculate loan size concentration
    const loanSizes = loans.map((loan: any) => loan.loan_amount || loan.loanAmount || 0);
    const avgLoanSize = loanSizes.reduce((sum: number, size: number) => sum + size, 0) / (loanSizes.length || 1);
    const loanSizeVariance = loanSizes.reduce((sum: number, size: number) => sum + Math.pow(size - avgLoanSize, 2), 0) / (loanSizes.length || 1);
    const loanSizeStdDev = Math.sqrt(loanSizeVariance);
    const loanSizeCoeffVar = loanSizeStdDev / avgLoanSize;

    // Calculate concentration score (higher coefficient of variation means better diversification)
    const concentrationScore = Math.min(100, loanSizeCoeffVar * 100);

    // Combine zone allocation and concentration scores
    return Math.max(0, Math.min(100, (100 - avgVariance * 200) * 0.7 + concentrationScore * 0.3));
  };

  const calculatePerformanceScore = () => {
    const irr = performanceMetrics?.irr || 0;
    const targetIrr = config?.target_irr || 0.12; // Default to 12% if not specified
    const moic = performanceMetrics?.equity_multiple || performanceMetrics?.equityMultiple || performanceMetrics?.moic || 0;
    const targetMoic = config?.target_multiple || 1.5; // Default to 1.5x if not specified

    // Calculate IRR performance ratio
    const irrRatio = irr / targetIrr;

    // Calculate MOIC performance ratio
    const moicRatio = moic / targetMoic;

    // Calculate DPI and RVPI scores
    const dpi = performanceMetrics?.dpi || 0;
    const rvpi = performanceMetrics?.rvpi || 0;
    const dpiWeight = Math.min(1, lastYear ? Number(lastYear) / (config?.fund_term || 10) : 0.5);
    const dpiScore = dpi * 100;
    const rvpiScore = rvpi * 50;

    // Combine scores with appropriate weights
    return Math.max(0, Math.min(100,
      irrRatio * 40 +
      moicRatio * 30 +
      dpiScore * dpiWeight * 0.2 +
      rvpiScore * (1 - dpiWeight) * 0.1
    ));
  };

  const calculateRiskScore = () => {
    // Default rate risk
    const defaultRate = actualDefaultRate;
    const targetDefaultRate = config?.base_default_rate || 0.01;
    const defaultRatio = defaultRate / targetDefaultRate;
    const defaultScore = Math.max(0, Math.min(100, 100 - (defaultRatio - 1) * 100));

    // LTV risk
    const avgLtv = portfolioMetrics?.weighted_average_ltv || portfolioMetrics?.weightedAverageLtv || 0;
    const targetLtv = config?.avg_loan_ltv || 0.7;
    const ltvRatio = avgLtv / targetLtv;
    const ltvScore = Math.max(0, Math.min(100, 100 - (ltvRatio - 1) * 100));

    // Zone risk (red zone percentage)
    const redZonePercentage = zoneDistribution?.red?.percentage || 0;
    const targetRedZone = zoneTargets?.red || 0.1;
    const redZoneRatio = redZonePercentage / targetRedZone;
    const zoneScore = Math.max(0, Math.min(100, 100 - (redZoneRatio - 1) * 100));

    // Combine scores
    return Math.max(0, Math.min(100, defaultScore * 0.4 + ltvScore * 0.3 + zoneScore * 0.3));
  };

  const calculateLiquidityScore = () => {
    // Distribution timing
    const distributionMetrics = performanceMetrics?.distribution_metrics || performanceMetrics?.distributionMetrics || {};
    const distributionYears = Object.keys(distributionMetrics).map(Number);

    let distributionScore = 50; // Default score
    if (distributionYears.length > 0) {
      // Calculate weighted average distribution year
      const totalDistribution = distributionYears.reduce((sum, year) => sum + (distributionMetrics[year] || 0), 0);
      const weightedAvgYear = distributionYears.reduce((sum, year) => sum + year * (distributionMetrics[year] || 0), 0) / (totalDistribution || 1);

      // Convert to score (0-100) - earlier distributions are better
      distributionScore = Math.max(0, Math.min(100, 100 - weightedAvgYear * 10));
    }

    // Cash flow profile
    const cashFlows = data?.cash_flows || data?.cashFlows || {};
    const cashFlowYears = Object.keys(cashFlows).map(Number);

    let cashFlowScore = 50; // Default score
    if (cashFlowYears.length > 0) {
      // Calculate cumulative net cash flow
      let cumulativeNetCashFlow = 0;
      const breakEvenYear = cashFlowYears.find(year => {
        const yearData = cashFlows[year];
        cumulativeNetCashFlow += (yearData.net_cash_flow || yearData.netCashFlow || 0);
        return cumulativeNetCashFlow > 0;
      }) || config?.fund_term || 10;

      // Convert to score (0-100) - earlier breakeven is better
      cashFlowScore = Math.max(0, Math.min(100, 100 - breakEvenYear * 10));
    }

    // Combine scores
    return Math.max(0, Math.min(100, distributionScore * 0.6 + cashFlowScore * 0.4));
  };

  // Calculate component scores
  const diversificationScore = calculateDiversificationScore();
  const performanceScore = calculatePerformanceScore();
  const riskScore = calculateRiskScore();
  const liquidityScore = calculateLiquidityScore();

  // Calculate overall health score (weighted average)
  const overallScore = (
    diversificationScore * 0.25 +
    performanceScore * 0.35 +
    riskScore * 0.25 +
    liquidityScore * 0.15
  );

  // Determine health status
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-500', icon: <CheckCircle className="h-5 w-5 text-green-500" /> };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-500', icon: <Info className="h-5 w-5 text-blue-500" /> };
    if (score >= 40) return { label: 'Fair', color: 'bg-yellow-500', icon: <Info className="h-5 w-5 text-yellow-500" /> };
    return { label: 'Needs Attention', color: 'bg-red-500', icon: <AlertCircle className="h-5 w-5 text-red-500" /> };
  };

  // Get detailed recommendations based on scores and specific metrics
  const getRecommendations = () => {
    const recommendations = [];
    const detailedInsights = [];

    // Diversification recommendations
    if (diversificationScore < 60) {
      const zoneDistribution = portfolioMetrics?.zone_distribution || portfolioMetrics?.zoneDistribution || {};
      const zoneTargets = config?.zone_allocations || config?.zone_targets || {};

      // Check which zones are most out of balance
      const greenVariance = (zoneDistribution?.green?.percentage || 0) - (zoneTargets?.green || 0.6);
      const orangeVariance = (zoneDistribution?.orange?.percentage || 0) - (zoneTargets?.orange || 0.3);
      const redVariance = (zoneDistribution?.red?.percentage || 0) - (zoneTargets?.red || 0.1);

      if (Math.abs(greenVariance) > 0.1) {
        recommendations.push(`${greenVariance > 0 ? 'Reduce' : 'Increase'} allocation to Green Zone loans by approximately ${formatPercentage(Math.abs(greenVariance))}`);
      }

      if (Math.abs(orangeVariance) > 0.1) {
        recommendations.push(`${orangeVariance > 0 ? 'Reduce' : 'Increase'} allocation to Orange Zone loans by approximately ${formatPercentage(Math.abs(orangeVariance))}`);
      }

      if (Math.abs(redVariance) > 0.1) {
        recommendations.push(`${redVariance > 0 ? 'Reduce' : 'Increase'} allocation to Red Zone loans by approximately ${formatPercentage(Math.abs(redVariance))}`);
      }

      // Check loan size concentration
      const loanSizes = loans.map((loan: any) => loan.loan_amount || loan.loanAmount || 0);
      if (loanSizes.length > 0) {
        const avgLoanSize = loanSizes.reduce((sum: number, size: number) => sum + size, 0) / loanSizes.length;
        const loanSizeVariance = loanSizes.reduce((sum: number, size: number) => sum + Math.pow(size - avgLoanSize, 2), 0) / loanSizes.length;
        const loanSizeStdDev = Math.sqrt(loanSizeVariance);
        const loanSizeCoeffVar = loanSizeStdDev / avgLoanSize;

        if (loanSizeCoeffVar < 0.2) {
          recommendations.push('Diversify loan sizes to reduce concentration risk');
          detailedInsights.push('Current loan portfolio has low size variation, increasing vulnerability to systematic risks');
        }
      }
    }

    // Performance recommendations
    if (performanceScore < 60) {
      const irr = performanceMetrics?.irr || 0;
      const targetIrr = config?.target_irr || 0.12;

      if (irr < targetIrr * 0.8) {
        recommendations.push(`Enhance IRR (currently ${formatPercentage(irr)}) to reach target of ${formatPercentage(targetIrr)}`);

        // Analyze potential causes of low IRR
        const avgInterestRate = portfolioMetrics?.weighted_average_interest_rate || portfolioMetrics?.weightedAverageInterestRate || 0;
        const targetInterestRate = config?.avg_loan_interest_rate || 0;

        if (avgInterestRate < targetInterestRate * 0.9) {
          detailedInsights.push(`Interest rates below target (${formatPercentage(avgInterestRate)} vs ${formatPercentage(targetInterestRate)}) are impacting returns`);
        }

        const exitedLoans = lastYearData?.exited_loans || lastYearData?.exitedLoans || 0;
        const totalLoans = (lastYearData?.active_loans || lastYearData?.activeLoans || 0) + exitedLoans;
        const exitRate = totalLoans > 0 ? exitedLoans / totalLoans : 0;

        if (exitRate < 0.2 && Number(lastYear) > 3) {
          detailedInsights.push('Low exit rate may be delaying realization of returns');
        }
      }

      // Check multiple
      const moic = performanceMetrics?.equity_multiple || performanceMetrics?.equityMultiple || performanceMetrics?.moic || 0;
      const targetMoic = config?.target_multiple || 1.5;

      if (moic < targetMoic * 0.8) {
        recommendations.push(`Improve equity multiple (currently ${moic.toFixed(2)}x) to reach target of ${targetMoic.toFixed(2)}x`);
      }
    }

    // Risk recommendations
    if (riskScore < 60) {
      // Default rate analysis
      const defaultRate = actualDefaultRate;
      const targetDefaultRate = config?.base_default_rate || 0.01;

      if (defaultRate > targetDefaultRate * 1.2) {
        recommendations.push(`Reduce default rate (currently ${formatPercentage(defaultRate)}) closer to target of ${formatPercentage(targetDefaultRate)}`);

        // Check if red zone loans are contributing to defaults
        const redZonePercentage = zoneDistribution?.red?.percentage || 0;
        const targetRedZone = zoneTargets?.red || 0.1;

        if (redZonePercentage > targetRedZone * 1.2) {
          detailedInsights.push(`High concentration in Red Zone (${formatPercentage(redZonePercentage)}) may be contributing to elevated default rates`);
        }
      }

      // LTV analysis
      const avgLtv = portfolioMetrics?.weighted_average_ltv || portfolioMetrics?.weightedAverageLtv || 0;
      const targetLtv = config?.avg_loan_ltv || 0.7;

      if (avgLtv > targetLtv * 1.1) {
        recommendations.push(`Reduce average LTV (currently ${formatPercentage(avgLtv)}) closer to target of ${formatPercentage(targetLtv)}`);
        detailedInsights.push('Higher LTV increases risk exposure in case of property value fluctuations');
      }
    }

    // Liquidity recommendations
    if (liquidityScore < 60) {
      // Distribution timing analysis
      const distributionMetrics = performanceMetrics?.distribution_metrics || performanceMetrics?.distributionMetrics || {};
      const distributionYears = Object.keys(distributionMetrics).map(Number);

      if (distributionYears.length > 0) {
        const totalDistribution = distributionYears.reduce((sum, year) => sum + (distributionMetrics[year] || 0), 0);
        const weightedAvgYear = distributionYears.reduce((sum, year) => sum + year * (distributionMetrics[year] || 0), 0) / (totalDistribution || 1);

        if (weightedAvgYear > 5) {
          recommendations.push('Optimize for earlier distributions to improve liquidity profile');
          detailedInsights.push(`Current weighted average distribution year (${weightedAvgYear.toFixed(1)}) is later than optimal`);
        }
      }

      // Cash flow analysis
      const cashFlows = data?.cash_flows || data?.cashFlows || {};
      const cashFlowYears = Object.keys(cashFlows).map(Number);

      if (cashFlowYears.length > 0) {
        let cumulativeNetCashFlow = 0;
        const breakEvenYear = cashFlowYears.find(year => {
          const yearData = cashFlows[year];
          cumulativeNetCashFlow += (yearData.net_cash_flow || yearData.netCashFlow || 0);
          return cumulativeNetCashFlow > 0;
        }) || config?.fund_term || 10;

        if (breakEvenYear > 5) {
          recommendations.push(`Accelerate return of capital (current breakeven in year ${breakEvenYear})`);
        }
      }
    }

    // If no specific recommendations, provide general feedback
    if (recommendations.length === 0) {
      if (overallScore >= 80) {
        recommendations.push('Portfolio is performing excellently across all metrics');
        detailedInsights.push('Continue current strategy while monitoring for any changes in market conditions');
      } else if (overallScore >= 60) {
        recommendations.push('Portfolio is performing well with minor opportunities for optimization');
        detailedInsights.push('Fine-tune allocation and exit strategies to further enhance performance');
      } else {
        recommendations.push('Consider rebalancing portfolio to improve overall health score');
      }
    }

    return { recommendations, detailedInsights };
  };

  const overallStatus = getHealthStatus(overallScore);
  const { recommendations, detailedInsights } = getRecommendations();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Portfolio Health Score</CardTitle>
        <CardDescription>Comprehensive assessment of portfolio health and performance</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Overall Health Score</h3>
                <p className="text-muted-foreground">Based on diversification, performance, risk, and liquidity</p>
              </div>
              <Badge className={`text-white ${overallStatus.color.replace('bg-', 'bg-')}`}>
                {overallStatus.label}
              </Badge>
            </div>

            <div className="relative pt-1">
              <Progress value={overallScore} className="h-4" />
              <span className="absolute top-0 right-0 -mt-6 text-sm font-medium">
                {Math.round(overallScore)}/100
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Diversification</h4>
                  <span className={`text-sm font-medium ${diversificationScore >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.round(diversificationScore)}/100
                  </span>
                </div>
                <Progress value={diversificationScore} className={`h-2 mb-2 ${diversificationScore >= 60 ? 'bg-green-100' : 'bg-red-100'}`}
                  indicatorClassName={diversificationScore >= 60 ? 'bg-green-600' : 'bg-red-600'} />
                <p className="text-sm text-muted-foreground">Zone allocation and loan distribution</p>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Performance</h4>
                  <span className={`text-sm font-medium ${performanceScore >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.round(performanceScore)}/100
                  </span>
                </div>
                <Progress value={performanceScore} className={`h-2 mb-2 ${performanceScore >= 60 ? 'bg-green-100' : 'bg-red-100'}`}
                  indicatorClassName={performanceScore >= 60 ? 'bg-green-600' : 'bg-red-600'} />
                <p className="text-sm text-muted-foreground">IRR and return metrics</p>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Risk Profile</h4>
                  <span className={`text-sm font-medium ${riskScore >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.round(riskScore)}/100
                  </span>
                </div>
                <Progress value={riskScore} className={`h-2 mb-2 ${riskScore >= 60 ? 'bg-green-100' : 'bg-red-100'}`}
                  indicatorClassName={riskScore >= 60 ? 'bg-green-600' : 'bg-red-600'} />
                <p className="text-sm text-muted-foreground">Default rates and risk exposure</p>
              </div>

              <div className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Liquidity</h4>
                  <span className={`text-sm font-medium ${liquidityScore >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.round(liquidityScore)}/100
                  </span>
                </div>
                <Progress value={liquidityScore} className={`h-2 mb-2 ${liquidityScore >= 60 ? 'bg-green-100' : 'bg-red-100'}`}
                  indicatorClassName={liquidityScore >= 60 ? 'bg-green-600' : 'bg-red-600'} />
                <p className="text-sm text-muted-foreground">Distribution timing and cash flow</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-4">Key Recommendations</h4>
                <ul className="space-y-3">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5 flex-shrink-0">{overallStatus.icon}</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-4">Detailed Insights</h4>
                {detailedInsights.length > 0 ? (
                  <ul className="space-y-3">
                    {detailedInsights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0">
                          <Info className="h-4 w-4 text-blue-500" />
                        </span>
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No specific insights to highlight at this time. The portfolio is performing within expected parameters.
                  </p>
                )}
              </div>
            </div>

            <div className="border rounded-md p-4 bg-muted/20">
              <h4 className="font-medium mb-2">Health Score Methodology</h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  This health score is calculated based on actual portfolio data and configuration parameters.
                  Scores are updated in real-time as the portfolio evolves.
                </p>
                <p>
                  <strong>Diversification Score:</strong> Measures zone allocation variance and loan size distribution.
                </p>
                <p>
                  <strong>Performance Score:</strong> Evaluates IRR, equity multiple, and distribution metrics against targets.
                </p>
                <p>
                  <strong>Risk Score:</strong> Assesses default rates, LTV ratios, and zone risk exposure.
                </p>
                <p>
                  <strong>Liquidity Score:</strong> Analyzes distribution timing and cash flow breakeven points.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioHealthScore;
