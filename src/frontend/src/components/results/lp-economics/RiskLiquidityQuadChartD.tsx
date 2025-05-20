import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis, // For varying symbol types if needed
  CartesianGrid,
  Tooltip,
  Legend,
  Label as RechartsLabel,
  Cell,
  ComposedChart, // Added for Right Half
  Bar,            // Added for Right Half
  Line,           // Added for Right Half
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // For scenario toggles later
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'; // For scenario toggles later
import { formatPercentage, formatNumber, formatCurrencyShort } from '@/lib/formatters';
import { Star } from 'lucide-react'; // For current portfolio marker

// Colors from user prompt
const COLORS = {
  midnightBlue: '#0B1C3F',
  steel: '#314C7E',
  aquaAccent: '#00A0B0',
  green: '#34A853',
  yellow: '#FBBC05',
  red: '#EA4335',
  textPrimary: '#1f2937', // Tailwind gray-800
  textSecondary: '#6b7280', // Tailwind gray-500
  gridLines: '#e5e7eb', // Tailwind gray-200
};

// Typography (applied via Tailwind classes, but good to keep in mind)
// Base: 14px (text-sm), Headers: 18px (text-lg)
// Font: Inter or Roboto (Tailwind default is Inter-like)

interface MonteCarloIteration {
  id: string;
  var: number; // Percentage
  expectedReturn: number; // Percentage
  leverageUtilization: number; // Percentage
  liquidityBuffer: number; // Percentage
  tlsZones: { green: number; yellow: number; red: number }; // Percentages
  isCurrentPortfolio?: boolean;
}

// Mock Data for Risk Scatter Plot
const mockMonteCarloData: MonteCarloIteration[] = [
  { id: 'iter1', var: 0.15, expectedReturn: 0.12, leverageUtilization: 0.60, liquidityBuffer: 0.10, tlsZones: { green: 0.7, yellow: 0.2, red: 0.1 } },
  { id: 'iter2', var: 0.18, expectedReturn: 0.14, leverageUtilization: 0.65, liquidityBuffer: 0.08, tlsZones: { green: 0.6, yellow: 0.3, red: 0.1 } },
  { id: 'current', var: 0.16, expectedReturn: 0.13, leverageUtilization: 0.62, liquidityBuffer: 0.09, tlsZones: { green: 0.65, yellow: 0.25, red: 0.1 }, isCurrentPortfolio: true },
  { id: 'iter3', var: 0.20, expectedReturn: 0.11, leverageUtilization: 0.70, liquidityBuffer: 0.05, tlsZones: { green: 0.5, yellow: 0.3, red: 0.2 } },
  { id: 'iter4', var: 0.12, expectedReturn: 0.10, leverageUtilization: 0.55, liquidityBuffer: 0.12, tlsZones: { green: 0.8, yellow: 0.15, red: 0.05 } },
  { id: 'iter5', var: 0.22, expectedReturn: 0.15, leverageUtilization: 0.68, liquidityBuffer: 0.07, tlsZones: { green: 0.55, yellow: 0.35, red: 0.1 } },
];


const CustomScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MonteCarloIteration;
    return (
      <div className="bg-white/90 p-3 border border-gray-300 rounded shadow-lg text-xs" style={{ fontFamily: 'Inter, Roboto, sans-serif' }}>
        <p className="font-bold text-sm mb-1" style={{ color: COLORS.midnightBlue }}>
          {data.isCurrentPortfolio ? 'Current Portfolio' : `Iteration ${data.id}`}
        </p>
        <p><strong>Expected Return:</strong> {formatPercentage(data.expectedReturn, 1)}</p>
        <p><strong>VaR (Value at Risk):</strong> {formatPercentage(data.var, 1)}</p>
        <p><strong>Leverage Utilization:</strong> {formatPercentage(data.leverageUtilization, 0)}</p>
        <p><strong>Liquidity Buffer:</strong> {formatPercentage(data.liquidityBuffer, 0)}</p>
        <div className="mt-1">
          <p className="font-semibold">TLS Zone Breakdown:</p>
          <div className="flex space-x-1.5 items-center">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.green }}></div>
            <span>Green: {formatPercentage(data.tlsZones.green, 0)}</span>
          </div>
          <div className="flex space-x-1.5 items-center">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.yellow }}></div>
            <span>Yellow: {formatPercentage(data.tlsZones.yellow, 0)}</span>
          </div>
          <div className="flex space-x-1.5 items-center">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.red }}></div>
            <span>Red: {formatPercentage(data.tlsZones.red, 0)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom shape for scatter plot points
const CustomShape = (props: any) => {
  const { cx, cy, fill, payload } = props;
  if (payload?.isCurrentPortfolio) {
    // Star marker for current portfolio
    return (
      <polygon
        points={`${cx},${cy-8} ${cx+2},${cy-3} ${cx+8},${cy-3} ${cx+3},${cy+1} ${cx+5},${cy+8} ${cx},${cy+4} ${cx-5},${cy+8} ${cx-3},${cy+1} ${cx-8},${cy-3} ${cx-2},${cy-3}`}
        fill={COLORS.aquaAccent}
        stroke={COLORS.midnightBlue}
        strokeWidth={1}
      />
    );
  }
  // Default circle for other points
  return <circle cx={cx} cy={cy} r={5} fill={fill} stroke={COLORS.midnightBlue} strokeWidth={0.5} opacity={0.7} />;
};


// --- Right Half: Liquidity Duration Profile ---
interface LiquidityDataPoint {
  quarter: string; // e.g., "Q1 '25"
  navExitGreen: number; // % of NAV
  navExitYellow: number; // % of NAV
  navExitRed: number; // % of NAV
  leverageRepayment: number; // % of NAV
}

type ScenarioCode = 'base' | 'rate_plus_200' | 'sydney_dip_10';

const mockLiquidityData: Record<ScenarioCode, LiquidityDataPoint[]> = {
  base: [
    { quarter: "Q1 '25", navExitGreen: 0.05, navExitYellow: 0.02, navExitRed: 0.01, leverageRepayment: 0.03 },
    { quarter: "Q2 '25", navExitGreen: 0.06, navExitYellow: 0.03, navExitRed: 0.01, leverageRepayment: 0.04 },
    { quarter: "Q3 '25", navExitGreen: 0.07, navExitYellow: 0.02, navExitRed: 0.00, leverageRepayment: 0.05 },
    { quarter: "Q4 '25", navExitGreen: 0.05, navExitYellow: 0.01, navExitRed: 0.01, leverageRepayment: 0.03 },
    { quarter: "Q1 '26", navExitGreen: 0.04, navExitYellow: 0.02, navExitRed: 0.00, leverageRepayment: 0.02 },
  ],
  rate_plus_200: [ // Mock data for another scenario
    { quarter: "Q1 '25", navExitGreen: 0.04, navExitYellow: 0.03, navExitRed: 0.02, leverageRepayment: 0.03 },
    { quarter: "Q2 '25", navExitGreen: 0.05, navExitYellow: 0.04, navExitRed: 0.01, leverageRepayment: 0.04 },
    // ... more data
  ],
  sydney_dip_10: [ // Mock data for another scenario
    { quarter: "Q1 '25", navExitGreen: 0.03, navExitYellow: 0.05, navExitRed: 0.03, leverageRepayment: 0.03 },
    { quarter: "Q2 '25", navExitGreen: 0.04, navExitYellow: 0.06, navExitRed: 0.02, leverageRepayment: 0.04 },
    // ... more data
  ],
};

const CustomLiquidityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const totalNavExit = payload.reduce((sum: number, entry: any) => {
      if (entry.dataKey === 'navExitGreen' || entry.dataKey === 'navExitYellow' || entry.dataKey === 'navExitRed') {
        return sum + (entry.value || 0);
      }
      return sum;
    }, 0);

    return (
      <div className="bg-white/90 p-3 border border-gray-300 rounded shadow-lg text-xs" style={{ fontFamily: 'Inter, Roboto, sans-serif' }}>
        <p className="font-bold text-sm mb-1" style={{ color: COLORS.midnightBlue }}>{label}</p>
        {payload.map((entry: any) => {
          let name = entry.name;
          if (entry.dataKey === 'navExitGreen') name = 'NAV Exit (Green)';
          if (entry.dataKey === 'navExitYellow') name = 'NAV Exit (Yellow)';
          if (entry.dataKey === 'navExitRed') name = 'NAV Exit (Red)';
          if (entry.dataKey === 'leverageRepayment') name = 'Leverage Repayment';

          return (
            <div key={entry.dataKey} className="flex items-center space-x-1.5">
              {entry.dataKey !== 'leverageRepayment' && <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }}></div>}
              <span>{name}: {formatPercentage(entry.value, 1)}</span>
            </div>
          );
        })}
        <hr className="my-1"/>
        <p><strong>Total NAV Exiting:</strong> {formatPercentage(totalNavExit, 1)}</p>
      </div>
    );
  }
  return null;
};
// --- End Right Half ---


interface RiskLiquidityQuadChartDProps {
  simulation: any;
  results: any;
  isLoading: boolean;
}

export function RiskLiquidityQuadChartD({ simulation, results, isLoading }: RiskLiquidityQuadChartDProps) {
  // TODO: Replace mockData with processed data from props (results.portfolio_evolution.iterations)
  const [riskScatterData, setRiskScatterData] = useState<MonteCarloIteration[]>(mockMonteCarloData);
  // TODO: Add state for liquidity profile data and selected scenario

  // --- Right Half State ---
  const [selectedScenario, setSelectedScenario] = useState<ScenarioCode>('base');
  const [liquidityChartData, setLiquidityChartData] = useState<LiquidityDataPoint[]>(mockLiquidityData.base);

  // TODO: useEffect to fetch real scenario data when selectedScenario changes
  // For now, just update from mock data
  React.useEffect(() => {
    setLiquidityChartData(mockLiquidityData[selectedScenario] || mockLiquidityData.base);
  }, [selectedScenario]);
  // --- End Right Half State ---

  if (isLoading && !results) { // Simplified loading state for now
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle style={{ color: COLORS.midnightBlue, fontSize: '18px' }}>D. LP Risk & Liquidity Profile</CardTitle>
          <CardDescription style={{ color: COLORS.textSecondary }}>
            Analyzing portfolio risk distribution and liquidity timelines under various scenarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100%-70px)]">
          <Skeleton className="h-full w-full" />
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  // Determine domain for ZAxis (used for conditional styling/shape if needed, not strictly for size here)
  const zDomain = useMemo(() => {
      const values = riskScatterData.map(p => p.var); // Example: base size on VaR
      return [Math.min(...values), Math.max(...values)];
  }, [riskScatterData]);


  return (
    <Card className="h-full flex flex-col" style={{ fontFamily: 'Inter, Roboto, sans-serif' }}>
      <CardHeader>
        <CardTitle style={{ color: COLORS.midnightBlue, fontSize: '18px' }}>D. LP Risk & Liquidity Profile</CardTitle>
        <CardDescription style={{ color: COLORS.textSecondary, fontSize: '14px' }}>
          Visualizing portfolio risk distribution and liquidity timelines. Lower VaR is better, higher Expected Return is better.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 p-4 overflow-hidden h-[450px]">
        {/* Left Half: Risk Scatter Plot */}
        <div className="flex flex-col h-full p-2 border rounded-md shadow-sm bg-white">
          <h3 className="text-md font-semibold mb-2 px-2 pt-1" style={{ color: COLORS.steel }}>Risk Distribution (Monte Carlo)</h3>
          <div className="flex-grow min-h-0"> {/* Important for ResponsiveContainer */}
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 40, left: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLines} />
                <XAxis
                  type="number"
                  dataKey="var"
                  name="VaR (%)"
                  unit="%"
                  tickFormatter={(value) => formatPercentage(value, 0)}
                  label={{ value: "VaR (%) (Lower is Better)", position: 'insideBottom', offset: -25, fontSize: 12, fill: COLORS.textSecondary }}
                  tick={{ fontSize: 10, fill: COLORS.textSecondary }}
                  domain={['dataMin - 0.01', 'dataMax + 0.01']}
                  axisLine={{ stroke: COLORS.gridLines }}
                  tickLine={{ stroke: COLORS.gridLines }}
                />
                <YAxis
                  type="number"
                  dataKey="expectedReturn"
                  name="Expected Return (%)"
                  unit="%"
                  tickFormatter={(value) => formatPercentage(value, 0)}
                  label={{ value: "Expected Return (%) (Higher is Better)", angle: -90, position: 'insideLeft', offset: -20, fontSize: 12, fill: COLORS.textSecondary, dy: 60 }}
                  tick={{ fontSize: 10, fill: COLORS.textSecondary }}
                  domain={['dataMin - 0.01', 'dataMax + 0.01']}
                  axisLine={{ stroke: COLORS.gridLines }}
                  tickLine={{ stroke: COLORS.gridLines }}
                />
                {/* ZAxis can be used for point sizes or other dimensions if needed later */}
                {/* <ZAxis type="number" dataKey="leverageUtilization" range={[50, 500]} name="Leverage" unit="%" /> */}
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: COLORS.aquaAccent }}
                  content={<CustomScatterTooltip />}
                  animationDuration={200}
                />
                <Legend verticalAlign="top" height={30} wrapperStyle={{fontSize: '11px', color: COLORS.textSecondary}}/>
                <Scatter
                    name="Monte Carlo Iterations"
                    data={riskScatterData.filter(p => !p.isCurrentPortfolio)}
                    fill={COLORS.steel}
                    shape={<CustomShape />}
                />
                <Scatter
                    name="Current Portfolio"
                    data={riskScatterData.filter(p => p.isCurrentPortfolio)}
                    fill={COLORS.aquaAccent} // Distinct color
                    shape={<CustomShape />} // Custom star shape
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Half: Liquidity Duration Profile */}
        <div className="flex flex-col h-full p-2 border rounded-md shadow-sm bg-white space-y-3">
          <div className="flex justify-between items-center px-2 pt-1">
            <h3 className="text-md font-semibold" style={{ color: COLORS.steel }}>Liquidity Duration Profile</h3>
            <ToggleGroup
              type="single"
              defaultValue="base"
              value={selectedScenario}
              onValueChange={(value) => { if (value) setSelectedScenario(value as ScenarioCode);}}
              aria-label="Liquidity Scenario"
              className="h-8"
            >
              <ToggleGroupItem value="base" aria-label="Base Scenario" className="px-2.5 py-1 text-xs h-auto data-[state=on]:bg-steel data-[state=on]:text-white hover:bg-steel/10">Base</ToggleGroupItem>
              <ToggleGroupItem value="rate_plus_200" aria-label="Rate +200bp Scenario" className="px-2.5 py-1 text-xs h-auto data-[state=on]:bg-steel data-[state=on]:text-white hover:bg-steel/10">Rate +200bp</ToggleGroupItem>
              <ToggleGroupItem value="sydney_dip_10" aria-label="Sydney Price Dip Scenario" className="px-2.5 py-1 text-xs h-auto data-[state=on]:bg-steel data-[state=on]:text-white hover:bg-steel/10">Sydney Dip</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex-grow min-h-0"> {/* Important for ResponsiveContainer */}
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={liquidityChartData}
                margin={{ top: 5, right: 20, bottom: 30, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLines} />
                <XAxis
                  dataKey="quarter"
                  tick={{ fontSize: 10, fill: COLORS.textSecondary }}
                  label={{ value: "Future Quarters", position: 'insideBottom', offset: -15, fontSize: 12, fill: COLORS.textSecondary }}
                  axisLine={{ stroke: COLORS.gridLines }}
                  tickLine={{ stroke: COLORS.gridLines }}
                />
                <YAxis
                  tickFormatter={(value) => formatPercentage(value, 0)}
                  label={{ value: "% of NAV", angle: -90, position: 'insideLeft', offset: -10, fontSize: 12, fill: COLORS.textSecondary, dy:30 }}
                  tick={{ fontSize: 10, fill: COLORS.textSecondary }}
                  axisLine={{ stroke: COLORS.gridLines }}
                  tickLine={{ stroke: COLORS.gridLines }}
                />
                <Tooltip
                  content={<CustomLiquidityTooltip />}
                  animationDuration={200}
                  cursor={{fill: 'rgba(173, 216, 230, 0.3)'}} // Light blue fill on hover
                />
                <Legend verticalAlign="top" height={30} wrapperStyle={{fontSize: '11px', color: COLORS.textSecondary, paddingBottom: '5px'}}/>
                <Bar dataKey="navExitGreen" stackId="a" name="NAV Exit (Green)" fill={COLORS.green} barSize={20} radius={[3, 3, 0, 0]}>
                   {/* Subtle hover: Handled by Recharts default + Tooltip cursor. Add Cell for individual control if needed */}
                </Bar>
                <Bar dataKey="navExitYellow" stackId="a" name="NAV Exit (Yellow)" fill={COLORS.yellow} barSize={20} radius={[3, 3, 0, 0]} />
                <Bar dataKey="navExitRed" stackId="a" name="NAV Exit (Red)" fill={COLORS.red} barSize={20} radius={[3, 3, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="leverageRepayment"
                  name="Leverage Repayment"
                  stroke={COLORS.midnightBlue}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.aquaAccent }}
                  activeDot={{ r: 5, stroke: COLORS.midnightBlue, fill: COLORS.aquaAccent }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}