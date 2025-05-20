import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import { formatPercentage as formatPercent } from '@/utils/charts/dataTransformers';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sankey, Rectangle, Layer, ResponsiveContainer } from 'recharts';
import { LogLevel, LogCategory, log } from '@/utils/logging';

interface EnhancedPortfolioLifecycleFlowProps {
  results: any;
  isLoading: boolean;
}

// Custom node component for the Sankey diagram
const CustomNode = ({ x, y, width, height, index, payload, viewType, colors }: any) => {
  const name = payload.name;
  const description = payload.description || '';
  const nodeValue = payload.value || 1;
  const color = colors[name] || '#94a3b8';

  // Format the value for display
  const formattedValue = viewType === 'loans'
    ? formatNumber(nodeValue)
    : formatCurrency(nodeValue, { notation: 'compact' });

  // Calculate the node height to determine if we have space for the description
  const showDescription = height > 60;

  return (
    <Layer key={`CustomNode-${index}`}>
      {/* Node background */}
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity="0.8"
        stroke={color}
        strokeWidth={1}
        radius={[0, 0, 4, 4]}
      />

      {/* Title background at the top of the node */}
      <Rectangle
        x={x}
        y={y - 24}
        width={width}
        height={24}
        fill="#fff"
        stroke={color}
        strokeWidth={1}
        radius={[4, 4, 0, 0]}
      />

      {/* Node title at the top */}
      <text
        textAnchor="middle"
        x={x + width / 2}
        y={y - 8}
        fontSize="12"
        fill="#333"
        fontWeight="bold"
      >
        {name}
      </text>

      {/* Value background in the middle of the node */}
      <Rectangle
        x={x + 2}
        y={y + height / 2 - 12}
        width={width - 4}
        height={24}
        fill="#fff"
        fillOpacity="0.9"
        radius={3}
      />

      {/* Node value */}
      <text
        textAnchor="middle"
        x={x + width / 2}
        y={y + height / 2 + 5}
        fontSize="13"
        fill="#333"
        fontWeight="medium"
      >
        {formattedValue}
      </text>

      {/* Node description (only shown if there's enough space) */}
      {showDescription && description && (
        <>
          <Rectangle
            x={x + 2}
            y={y + height - 24}
            width={width - 4}
            height={20}
            fill="#fff"
            fillOpacity="0.7"
            radius={3}
          />
          <text
            textAnchor="middle"
            x={x + width / 2}
            y={y + height - 10}
            fontSize="10"
            fill="#555"
          >
            {description.length > 25 ? description.substring(0, 25) + '...' : description}
          </text>
        </>
      )}
    </Layer>
  );
};

export function EnhancedPortfolioLifecycleFlow({
  results,
  isLoading
}: EnhancedPortfolioLifecycleFlowProps) {
  const [viewType, setViewType] = React.useState<'loans' | 'capital'>('loans');
  const [activeTooltip, setActiveTooltip] = React.useState<{
    source: string;
    target: string;
    value: number;
    description: string;
    percentage: number;
    x: number;
    y: number;
  } | null>(null);

  // Extract data for the Sankey diagram
  const sankeyData = React.useMemo(() => {
    if (!results || isLoading) {
      log(LogLevel.DEBUG, LogCategory.UI, 'Portfolio Lifecycle Flow: No results or still loading');
      return { nodes: [], links: [] };
    }

    // Get portfolio evolution data
    const portfolioEvolution = results.portfolio_evolution;
    if (!portfolioEvolution) {
      log(LogLevel.DEBUG, LogCategory.UI, 'Portfolio Lifecycle Flow: No portfolio_evolution data found');
      return { nodes: [], links: [] };
    }

    // Get reinvestment stats
    const reinvestmentStats = results.reinvestment_stats;
    if (!reinvestmentStats) {
      log(LogLevel.DEBUG, LogCategory.UI, 'Portfolio Lifecycle Flow: No reinvestment_stats data found');
      return { nodes: [], links: [] };
    }

    // Log the structure of portfolio evolution data
    log(LogLevel.DEBUG, LogCategory.UI, 'Portfolio Lifecycle Flow - Portfolio Evolution Data Structure:',
      Object.keys(portfolioEvolution).length > 0 ?
        `Found ${Object.keys(portfolioEvolution).length} keys: ${Object.keys(portfolioEvolution).join(', ')}` :
        'Empty portfolio evolution data'
    );

    // Log the structure of reinvestment stats
    log(LogLevel.DEBUG, LogCategory.UI, 'Portfolio Lifecycle Flow - Reinvestment Stats Structure:',
      Object.keys(reinvestmentStats).length > 0 ?
        `Found ${Object.keys(reinvestmentStats).length} keys: ${Object.keys(reinvestmentStats).join(', ')}` :
        'Empty reinvestment stats'
    );

    // Get the last year in the portfolio evolution
    const years = Object.keys(portfolioEvolution)
      .filter(year => !isNaN(Number(year)))
      .map(Number)
      .sort((a, b) => a - b);

    if (years.length === 0) {
      log(LogLevel.DEBUG, LogCategory.UI, 'Portfolio Lifecycle Flow: No years found in data');
      return { nodes: [], links: [] };
    }

    const lastYear = years[years.length - 1] || 0;

    // Extract real data from the API response
    const originalLoans = portfolioEvolution[0]?.active_loans || 0;
    const exitedOriginalLoans = portfolioEvolution[lastYear]?.exited_loans_original || 0;
    const reinvestmentLoans = reinvestmentStats?.reinvestment_count || 0;
    const exitedReinvestmentLoans = portfolioEvolution[lastYear]?.exited_loans_reinvest || 0;

    // Calculate defaulted loans (sum across all years)
    const defaultedLoans = Object.values(portfolioEvolution).reduce(
      (sum: number, year: any) => sum + (year?.defaulted_loans || 0), 0
    );

    // Calculate matured loans
    const maturedLoans = originalLoans - exitedOriginalLoans - defaultedLoans;

    // For capital view
    const fundSize = results.fund_size || 0;
    const totalReinvested = reinvestmentStats?.total_reinvested || 0;

    // Calculate total exit proceeds
    let totalExitProceeds = 0;
    if (results.cash_flows) {
      for (const year in results.cash_flows) {
        if (results.cash_flows[year]?.exit_proceeds) {
          totalExitProceeds += results.cash_flows[year].exit_proceeds;
        }
      }
    }

    // Calculate distributions
    const distributions = totalExitProceeds - totalReinvested;

    // Log the extracted data
    log(LogLevel.DEBUG, LogCategory.UI, 'Portfolio Lifecycle Flow - Extracted Data:', {
      originalLoans,
      exitedOriginalLoans,
      reinvestmentLoans,
      exitedReinvestmentLoans,
      defaultedLoans,
      maturedLoans,
      fundSize,
      totalReinvested,
      totalExitProceeds,
      distributions
    });

    if (viewType === 'loans') {
      // Create nodes for loan flow
      const nodes = [
        { name: 'Original Loans', description: 'Initial loans originated with fund capital', value: originalLoans },
        { name: 'Exited Original', description: 'Original loans that exited before maturity', value: exitedOriginalLoans },
        { name: 'Reinvestment Loans', description: 'New loans created from exit proceeds', value: reinvestmentLoans },
        { name: 'Exited Reinvestment', description: 'Reinvestment loans that exited before maturity', value: exitedReinvestmentLoans },
        { name: 'Defaulted', description: 'Loans that defaulted', value: defaultedLoans },
        { name: 'Matured', description: 'Loans that reached full term', value: maturedLoans }
      ];

      // Create links for loan flow
      const minValue = 1; // Minimum value to ensure links are visible
      const links = [
        {
          source: 0,
          target: 1,
          value: Math.max(exitedOriginalLoans, minValue),
          description: 'Original loans that were exited before maturity',
          percentage: originalLoans > 0 ? (exitedOriginalLoans / originalLoans) * 100 : 0
        },
        {
          source: 0,
          target: 4,
          value: Math.max(defaultedLoans, minValue),
          description: 'Original loans that defaulted',
          percentage: originalLoans > 0 ? (defaultedLoans / originalLoans) * 100 : 0
        },
        {
          source: 0,
          target: 5,
          value: Math.max(maturedLoans, minValue),
          description: 'Original loans that reached maturity',
          percentage: originalLoans > 0 ? (maturedLoans / originalLoans) * 100 : 0
        },
        {
          source: 1,
          target: 2,
          value: Math.max(reinvestmentLoans, minValue),
          description: 'Capital from exited loans used for reinvestment',
          percentage: exitedOriginalLoans > 0 ? (reinvestmentLoans / exitedOriginalLoans) * 100 : 0
        },
        {
          source: 2,
          target: 3,
          value: Math.max(exitedReinvestmentLoans, minValue),
          description: 'Reinvested loans that were exited before maturity',
          percentage: reinvestmentLoans > 0 ? (exitedReinvestmentLoans / reinvestmentLoans) * 100 : 0
        },
        {
          source: 2,
          target: 4,
          value: minValue,
          description: 'Reinvested loans that defaulted',
          percentage: reinvestmentLoans > 0 ? (minValue / reinvestmentLoans) * 100 : 0
        },
        {
          source: 2,
          target: 5,
          value: Math.max(reinvestmentLoans - exitedReinvestmentLoans, minValue),
          description: 'Reinvested loans that reached maturity',
          percentage: reinvestmentLoans > 0 ? ((reinvestmentLoans - exitedReinvestmentLoans) / reinvestmentLoans) * 100 : 0
        }
      ];

      return { nodes, links };
    } else {
      // Create nodes for capital flow
      const nodes = [
        { name: 'Initial Capital', description: 'Fund capital deployed for initial loans', value: fundSize },
        { name: 'Exit Proceeds', description: 'Capital returned from loan exits', value: totalExitProceeds },
        { name: 'Reinvested', description: 'Capital redeployed into new loans', value: totalReinvested },
        { name: 'Distributions', description: 'Capital returned to investors', value: distributions }
      ];

      // Create links for capital flow
      const minValue = 1; // Minimum value to ensure links are visible
      const links = [
        {
          source: 0,
          target: 1,
          value: Math.max(totalExitProceeds, minValue),
          description: 'Capital returned from loan exits',
          percentage: fundSize > 0 ? (totalExitProceeds / fundSize) * 100 : 0
        },
        {
          source: 1,
          target: 2,
          value: Math.max(totalReinvested, minValue),
          description: 'Exit proceeds reinvested into new loans',
          percentage: totalExitProceeds > 0 ? (totalReinvested / totalExitProceeds) * 100 : 0
        },
        {
          source: 1,
          target: 3,
          value: Math.max(distributions, minValue),
          description: 'Exit proceeds distributed to investors',
          percentage: totalExitProceeds > 0 ? (distributions / totalExitProceeds) * 100 : 0
        }
      ];

      return { nodes, links };
    }
  }, [results, isLoading, viewType]);

  // Handle mouse events for custom tooltips
  const handleMouseEnter = (event: any, link: any) => {
    const sourceName = sankeyData.nodes[link.source]?.name || '';
    const targetName = sankeyData.nodes[link.target]?.name || '';
    const value = link.value;
    const description = link.description || '';
    const percentage = link.percentage || 0;

    // Get mouse position
    const rect = event.target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    setActiveTooltip({
      source: sourceName,
      target: targetName,
      value,
      description,
      percentage,
      x,
      y
    });
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  // Define node colors
  const nodeColors = {
    'Original Loans': '#4ade80',
    'Exited Original': '#60a5fa',
    'Reinvestment Loans': '#8b5cf6',
    'Exited Reinvestment': '#f59e0b',
    'Defaulted': '#ef4444',
    'Matured': '#94a3b8',
    'Initial Capital': '#4ade80',
    'Exit Proceeds': '#60a5fa',
    'Reinvested': '#8b5cf6',
    'Distributions': '#f59e0b'
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Portfolio Lifecycle Flow</CardTitle>
            <CardDescription>Comprehensive view of loan and capital flow through the portfolio lifecycle</CardDescription>
          </div>
          <Tabs value={viewType} onValueChange={(value) => setViewType(value as 'loans' | 'capital')}>
            <TabsList>
              <TabsTrigger value="loans">Loan Flow</TabsTrigger>
              <TabsTrigger value="capital">Capital Flow</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="h-[500px] relative">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : sankeyData.nodes.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={sankeyData}
              node={
                <CustomNode
                  viewType={viewType}
                  colors={nodeColors}
                />
              }
              link={{
                stroke: '#d1d5db',
                strokeOpacity: 0.5,
                strokeWidth: 2,
                fill: 'none',
                radius: 10,
                onMouseEnter: handleMouseEnter,
                onMouseLeave: handleMouseLeave
              }}
              margin={{ top: 40, right: 160, bottom: 40, left: 40 }}
              nodeWidth={30}
              nodePadding={80}
            />
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No portfolio lifecycle data available</p>
          </div>
        )}

        {/* Custom tooltip */}
        {activeTooltip && (
          <div
            className="absolute bg-white p-4 border rounded-lg shadow-lg z-10 max-w-xs"
            style={{
              left: `${activeTooltip.x}px`,
              top: `${activeTooltip.y - 120}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="font-bold text-sm mb-1 text-gray-800">
              {activeTooltip.source} → {activeTooltip.target}
            </div>
            {activeTooltip.description && (
              <div className="text-xs text-gray-600 mb-2">
                {activeTooltip.description}
              </div>
            )}
            <div className="text-sm font-medium text-gray-800">
              {viewType === 'loans'
                ? `${formatNumber(activeTooltip.value)} Loans`
                : formatCurrency(activeTooltip.value)
              }
              {' '}
              <span className="text-gray-500">
                ({formatPercent(activeTooltip.percentage / 100)})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
