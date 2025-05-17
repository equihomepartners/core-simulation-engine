import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  Scatter,
  Brush
} from 'recharts';
import { formatCurrency, formatPercentage, formatMultiple } from '@/utils/format';
import { ViewType } from './view-toggle';
import { TimeGranularity } from '@/types/finance';
import { Perspective } from './perspective-toggle';
import { Button } from '@/components/ui/button';
import { Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { LogLevel, LogCategory, logMissingData } from '@/utils/logging';

// Define types for the journey data
export interface JourneyKeyEvent {
  period: number;
  periodLabel: string;
  eventType: string;
  eventName: string;
  value: number;
  description: string;
}

export interface JourneyDataPoint {
  period: number;
  periodLabel: string;
  capitalCall: number;
  distribution: number;
  portfolioValue: number;
  cumulativeCapitalCalls: number;
  negativeCapitalCall: number;
  cumulativeDistributions: number;
  investmentValue: number;
  multiple: number;
  irr: number;
  lpIrr?: number;
  fundIrr?: number;
  gpIrr?: number;
  activeLoans: number;
  exitedLoans?: number;
  defaultedLoans?: number;
  newLoans?: number;
  reinvestments?: number;
  isKeyEvent: boolean;
  keyEventType: string;
  // For waterfall breakdown
  waterfallBreakdown?: {
    returnOfCapital: number;
    preferredReturn: number;
    gpCatchup: number;
    carriedInterest: number;
  };
  loanContributions?: Record<string, any>;
}

interface EnhancedJourneyChartProps {
  data: JourneyDataPoint[];
  keyEvents: JourneyKeyEvent[];
  viewType: ViewType;
  timeGranularity: TimeGranularity;
  perspective: Perspective;
  height?: number;
  onEventClick?: (event: JourneyKeyEvent) => void;
  showBrush?: boolean;
  showWaterfall?: boolean;
}

export function EnhancedJourneyChart({
  data,
  keyEvents,
  viewType,
  timeGranularity,
  perspective,
  height = 450,
  onEventClick,
  showBrush = true,
  showWaterfall = true
}: EnhancedJourneyChartProps) {
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(true);
  const [showReferenceLines, setShowReferenceLines] = useState(true);

  // Check if there's enough data to display
  if (!data || data.length === 0) {
    logMissingData('EnhancedJourneyChart', 'data', 'array', data);
    return (
      <div className="h-[450px] flex items-center justify-center border border-dashed rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Investment Journey Data Available</h3>
          <p className="text-muted-foreground">There is no portfolio evolution data for this simulation.</p>
        </div>
      </div>
    );
  }

  // Custom formatter for the X axis
  const formatXAxis = (value: number) => {
    if (timeGranularity === 'yearly') {
      return `Year ${value}`;
    } else if (timeGranularity === 'quarterly') {
      // For quarterly, divide the period number by 4 (rounded up) to get the year
      // and use the remainder to get the quarter
      const year = Math.ceil(value / 4);
      const quarter = value % 4 === 0 ? 4 : value % 4;
      return `Q${quarter} Y${year}`;
    } else if (timeGranularity === 'monthly') {
      // For monthly, divide the period number by 12 (rounded up) to get the year
      // and use the remainder to get the month
      const year = Math.ceil(value / 12);
      const month = value % 12 === 0 ? 12 : value % 12;

      // Convert month number to abbreviated month name
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[month - 1];

      return `${monthName} Y${year}`;
    } else {
      return `Period ${value}`;
    }
  };

  // Custom tooltip formatter
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const periodItem = data.find(item => item.period === label);

      if (!periodItem) return null;

      return (
        <div className="bg-background border rounded-md shadow-sm p-3 max-w-xs">
          <p className="font-medium text-sm mb-2">{periodItem.periodLabel}</p>
          <div className="space-y-1.5">
            {/* Value metrics */}
            {viewType === 'value' && (
              <div className="space-y-1.5">
                {payload.map((entry: any, index: number) => {
                  if (entry.value === 0 || entry.value === undefined) return null;

                  return (
                    <div key={`tooltip-${index}`} className="flex justify-between items-baseline text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span>{entry.name}</span>
                      </span>
                      <span className="font-medium">
                        {formatCurrency(entry.value)}
                      </span>
                    </div>
                  );
                })}

                {/* Show portfolio metrics if available */}
                {periodItem.activeLoans > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-xs font-medium mb-1">Portfolio Status:</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Active Loans:</span>
                        <span>{periodItem.activeLoans}</span>
                      </div>
                      {periodItem.exitedLoans !== undefined && (
                        <div className="flex justify-between">
                          <span>Exited Loans:</span>
                          <span>{periodItem.exitedLoans}</span>
                        </div>
                      )}
                      {periodItem.defaultedLoans !== undefined && periodItem.defaultedLoans > 0 && (
                        <div className="flex justify-between">
                          <span>Defaulted Loans:</span>
                          <span>{periodItem.defaultedLoans}</span>
                        </div>
                      )}
                      {periodItem.newLoans !== undefined && periodItem.newLoans > 0 && (
                        <div className="flex justify-between">
                          <span>New Loans:</span>
                          <span>{periodItem.newLoans}</span>
                        </div>
                      )}
                      {periodItem.reinvestments !== undefined && periodItem.reinvestments > 0 && (
                        <div className="flex justify-between">
                          <span>Reinvestments:</span>
                          <span>{periodItem.reinvestments}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Multiple metrics */}
            {viewType === 'multiple' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span>Multiple:</span>
                  <span className="font-medium">{formatMultiple(periodItem.multiple)}x</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span>Cumulative Capital Called:</span>
                  <span className="font-medium">{formatCurrency(periodItem.cumulativeCapitalCalls)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span>Cumulative Distributions:</span>
                  <span className="font-medium">{formatCurrency(periodItem.cumulativeDistributions)}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span>Investment Value:</span>
                  <span className="font-medium">{formatCurrency(periodItem.investmentValue)}</span>
                </div>
              </div>
            )}

            {/* IRR metrics */}
            {viewType === 'irr' && (
              <div className="space-y-1.5">
                {/* Show all IRR values if available */}
                {perspective === 'lp' && periodItem.lpIrr !== undefined && (
                  <div className="flex justify-between items-baseline text-xs">
                    <span>LP IRR:</span>
                    <span className="font-medium">{formatPercentage(periodItem.lpIrr)}</span>
                  </div>
                )}
                {perspective === 'fund' && periodItem.fundIrr !== undefined && (
                  <div className="flex justify-between items-baseline text-xs">
                    <span>Fund IRR:</span>
                    <span className="font-medium">{formatPercentage(periodItem.fundIrr)}</span>
                  </div>
                )}
                {perspective === 'gp' && periodItem.gpIrr !== undefined && (
                  <div className="flex justify-between items-baseline text-xs">
                    <span>GP IRR:</span>
                    <span className="font-medium">{formatPercentage(periodItem.gpIrr)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-xs">
                  <span>IRR:</span>
                  <span className="font-medium">{formatPercentage(periodItem.irr)}</span>
                </div>
              </div>
            )}

            {/* Show waterfall breakdown if available and requested */}
            {showWaterfall && viewType === 'value' && periodItem.distribution > 0 && periodItem.waterfallBreakdown && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs font-medium mb-1">Distribution Breakdown:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Return of Capital:</span>
                    <span>{formatCurrency(periodItem.waterfallBreakdown.returnOfCapital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preferred Return:</span>
                    <span>{formatCurrency(periodItem.waterfallBreakdown.preferredReturn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GP Catch-up:</span>
                    <span>{formatCurrency(periodItem.waterfallBreakdown.gpCatchup)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carried Interest:</span>
                    <span>{formatCurrency(periodItem.waterfallBreakdown.carriedInterest)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Show loan contribution information if available */}
            {periodItem.loanContributions && periodItem.distribution > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs font-medium mb-1">Contributing Loans:</div>
                <div className="text-xs space-y-1">
                  {Object.entries(periodItem.loanContributions)
                    .slice(0, 3) // Show only top 3 for brevity
                    .map(([loanId, contribution]: [string, any], idx) => (
                    <div key={`loan-${idx}`} className="flex flex-col">
                      <div className="flex justify-between">
                        <span>Loan {loanId.substring(0, 8)}...</span>
                        <span>{formatCurrency(contribution.exitValue || contribution.value || 0)}</span>
                      </div>
                      {(contribution.exitReason || contribution.reason) && (
                        <span className="text-muted-foreground text-xs">
                          {contribution.isDefault ? 'Default: ' : 'Exit: '}
                          {contribution.exitReason || contribution.reason || contribution.defaultReason || 'Normal exit'}
                        </span>
                      )}
                    </div>
                  ))}
                  {Object.keys(periodItem.loanContributions).length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{Object.keys(periodItem.loanContributions).length - 3} more loans
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show if this is a key event */}
            {periodItem.isKeyEvent && (
              <div className="mt-2 pt-2 border-t text-xs">
                <span className="font-medium block">Key Event:</span>
                <span>{keyEvents.find(e => e.period === label)?.eventName}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Toggle event highlight
  const handleEventClick = (eventType: string) => {
    if (highlightedEvent === eventType) {
      setHighlightedEvent(null);
    } else {
      setHighlightedEvent(eventType);

      // Call the external handler if provided
      const event = keyEvents.find(e => e.eventType === eventType);
      if (event && onEventClick) {
        onEventClick(event);
      }
    }
  };

  // Create reference lines for key events
  const eventReferenceLines = showAllEvents && showReferenceLines ? keyEvents.map((event, index) => (
    <ReferenceLine
      key={`event-${index}`}
      x={event.period}
      stroke={
        event.eventType === 'firstCapitalCall' ? '#ef4444' :
        event.eventType === 'firstDistribution' ? '#22c55e' :
        event.eventType === 'breakeven' ? '#3b82f6' :
        '#8b5cf6'
      }
      strokeDasharray="3 3"
      yAxisId="primary"
      label={{
        value: event.eventName,
        position: 'insideTopRight',
        fill: '#64748b',
        fontSize: 10
      }}
    />
  )) : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-4">
        <Toggle
          pressed={showReferenceLines}
          onPressedChange={setShowReferenceLines}
          size="sm"
        >
          <Flag className="h-4 w-4 mr-1" />
          Event lines
        </Toggle>

        <Toggle
          pressed={showAllEvents}
          onPressedChange={setShowAllEvents}
          size="sm"
        >
          {showAllEvents ?
            <ChevronUp className="h-4 w-4 mr-1" /> :
            <ChevronDown className="h-4 w-4 mr-1" />
          }
          {showAllEvents ? 'Hide events' : 'Show events'}
        </Toggle>
      </div>

      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 30, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="period"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            >
              <Label
                value={
                  timeGranularity === 'yearly' ? 'Years' :
                  timeGranularity === 'quarterly' ? 'Quarters' :
                  timeGranularity === 'monthly' ? 'Months' :
                  'Periods'
                }
                position="bottom"
                offset={20}
              />
            </XAxis>

            {/* Primary Y-axis */}
            <YAxis
              yAxisId="primary"
              tickFormatter={(value) =>
                viewType === 'value'
                  ? formatCurrency(value, { maximumFractionDigits: 0 })
                  : viewType === 'multiple'
                    ? `${formatMultiple(value)}x`
                    : formatPercentage(value)
              }
              tick={{ fontSize: 12 }}
              width={80}
            >
              <Label
                value={
                  viewType === 'value'
                    ? 'Value ($)'
                    : viewType === 'multiple'
                      ? 'Multiple (x)'
                      : 'IRR (%)'
                }
                position="left"
                angle={-90}
                offset={-10}
                style={{ textAnchor: 'middle' }}
              />
            </YAxis>

            <Tooltip content={customTooltip} />
            <Legend />
            <ReferenceLine y={0} stroke="#000" yAxisId="primary" />

            {/* Value view: show cash flows and values */}
            {viewType === 'value' && (
              <>
                {/* Capital Calls - negative bars */}
                <Bar
                  yAxisId="primary"
                  dataKey="negativeCapitalCall"
                  name={perspective === 'lp' ? 'LP Capital Calls' :
                        perspective === 'gp' ? 'GP Commitment' :
                        'Capital Calls'}
                  fill={perspective === 'lp' ? '#ef4444' :
                        perspective === 'gp' ? '#f97316' :
                        '#ef4444'}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={0}
                />

                {/* Distributions - positive bars */}
                <Bar
                  yAxisId="primary"
                  dataKey="distribution"
                  name={perspective === 'lp' ? 'LP Distributions' :
                        perspective === 'gp' ? 'GP Economics' :
                        'Distributions'}
                  fill={perspective === 'lp' ? '#22c55e' :
                        perspective === 'gp' ? '#10b981' :
                        '#22c55e'}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={200}
                />

                {/* Portfolio Value - area (Remaining Value / NAV) */}
                <Area
                  yAxisId="primary"
                  type="monotone"
                  dataKey="portfolioValue"
                  name={perspective === 'lp' ? 'LP Remaining Value (NAV)' :
                        perspective === 'gp' ? 'GP Accrued Value' :
                        'Remaining Value (NAV)'}
                  fill={perspective === 'lp' ? '#3b82f6' :
                        perspective === 'gp' ? '#8b5cf6' :
                        '#3b82f6'}
                  fillOpacity={0.2}
                  stroke={perspective === 'lp' ? '#3b82f6' :
                          perspective === 'gp' ? '#8b5cf6' :
                          '#3b82f6'}
                  strokeWidth={2}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationBegin={400}
                />

                {/* Investment Value - line */}
                {/* Investment Value Line - Portfolio Value + Distributions */}
                <Line
                  yAxisId="primary"
                  type="monotone"
                  dataKey="investmentValue"
                  name={perspective === 'lp' ? 'LP Total Value (NAV + Distributions)' :
                        perspective === 'gp' ? 'GP Total Value (NAV + Economics)' :
                        'Total Value (NAV + Distributions)'}
                  stroke={perspective === 'lp' ? '#8b5cf6' :
                          perspective === 'gp' ? '#f97316' :
                          '#8b5cf6'}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationBegin={600}
                />

                {/* Key events - scatter points */}
                <Scatter
                  yAxisId="primary"
                  dataKey="portfolioValue"
                  name="Key Events"
                  fill="#f59e0b"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    return payload.isKeyEvent ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ) : null;
                  }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={800}
                />
              </>
            )}

            {/* Multiple view: show multiples */}
            {viewType === 'multiple' && (
              <>
                <Line
                  yAxisId="primary"
                  type="monotone"
                  dataKey="multiple"
                  name="Investment Multiple"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{r: 4}}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationBegin={0}
                />
                <ReferenceLine
                  yAxisId="primary"
                  y={1}
                  stroke="#64748b"
                  strokeDasharray="3 3"
                  label={{ value: 'Breakeven', position: 'insideBottomRight', fill: '#64748b', fontSize: 12 }}
                />

                {/* Add scatter points for key events in multiple view */}
                <Scatter
                  yAxisId="primary"
                  dataKey="multiple"
                  name="Key Events"
                  fill="#f59e0b"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    return payload.isKeyEvent ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ) : null;
                  }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={800}
                />
              </>
            )}

            {/* IRR view: show IRR progression */}
            {viewType === 'irr' && (
              <>
                {/* Use the appropriate IRR dataKey based on perspective */}
                <Line
                  yAxisId="primary"
                  type="monotone"
                  dataKey={
                    perspective === 'lp' ? (data.some(d => d.lpIrr !== undefined && d.lpIrr !== 0) ? 'lpIrr' : 'irr') :
                    perspective === 'fund' ? (data.some(d => d.fundIrr !== undefined && d.fundIrr !== 0) ? 'fundIrr' : 'irr') :
                    perspective === 'gp' ? (data.some(d => d.gpIrr !== undefined && d.gpIrr !== 0) ? 'gpIrr' : 'irr') :
                    'irr'
                  }
                  name={
                    perspective === 'lp' ? 'LP IRR' :
                    perspective === 'fund' ? 'Fund IRR' :
                    perspective === 'gp' ? 'GP IRR' :
                    'IRR'
                  }
                  stroke={
                    perspective === 'lp' ? '#8b5cf6' :
                    perspective === 'fund' ? '#3b82f6' :
                    perspective === 'gp' ? '#f97316' :
                    '#10b981'
                  }
                  strokeWidth={2}
                  dot={{r: 4}}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationBegin={0}
                />

                {/* Show hurdle rate reference line */}
                <ReferenceLine
                  yAxisId="primary"
                  y={0.08}
                  stroke="#64748b"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Hurdle Rate',
                    position: 'right',
                    fill: '#64748b',
                    fontSize: 12
                  }}
                />

                {/* Zero reference line */}
                <ReferenceLine
                  yAxisId="primary"
                  y={0}
                  stroke="#64748b"
                  strokeDasharray="3 3"
                />

                {/* Add scatter points for key events in IRR view */}
                <Scatter
                  yAxisId="primary"
                  dataKey={
                    perspective === 'lp' ? (data.some(d => d.lpIrr !== undefined && d.lpIrr !== 0) ? 'lpIrr' : 'irr') :
                    perspective === 'fund' ? (data.some(d => d.fundIrr !== undefined && d.fundIrr !== 0) ? 'fundIrr' : 'irr') :
                    perspective === 'gp' ? (data.some(d => d.gpIrr !== undefined && d.gpIrr !== 0) ? 'gpIrr' : 'irr') :
                    'irr'
                  }
                  name="Key Events"
                  fill="#f59e0b"
                  shape={(props: any) => {
                    const { cx, cy, payload } = props;
                    return payload.isKeyEvent ? (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ) : null;
                  }}
                  isAnimationActive={true}
                  animationDuration={1000}
                  animationBegin={800}
                />
              </>
            )}

            {/* Event reference lines */}
            {eventReferenceLines}

            {/* Optional brush for zooming */}
            {showBrush && (
              <Brush
                dataKey="periodLabel"
                height={30}
                stroke="#8884d8"
                fillOpacity={0.1}
                startIndex={0}
                endIndex={Math.min(10, data.length - 1)}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}