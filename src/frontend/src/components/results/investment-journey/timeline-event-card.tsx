import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Circle, ArrowRight, CircleDollarSign, AlertTriangle, ArrowUpRight, Calendar, BarChart, Filter } from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ZAxis,
  ReferenceLine,
  Label
} from 'recharts';
import { TimeGranularity } from '@/types/finance';
import { formatCurrency, formatPercentage, formatMultiple } from '@/utils/format';

// Define types for timeline events
interface TimelineEvent {
  id: string;
  period: number;
  periodLabel: string;
  eventType: 'loan_exit' | 'distribution' | 'capital_call' | 'milestone';
  eventSubtype?: string;
  name: string;
  description: string;
  value: number;
  metadata: Record<string, any>;
  date?: string;
}

interface TimelineEventCardProps {
  results: any; // Full results object from API
  timeGranularity: TimeGranularity;
  isLoading: boolean;
}

export function TimelineEventCard({ results, timeGranularity, isLoading }: TimelineEventCardProps) {
  // State
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'scatter'>('timeline');

  // Get color by event type - needed to fix the "cannot find getEventColor" error
  function getEventColor(type: string, subtype?: string): string {
    if (type === 'distribution') {
      return subtype === 'gp_distribution' ? '#f97316' : '#3b82f6';
    } else if (type === 'loan_exit') {
      return subtype === 'defaulted' ? '#ef4444' : '#10b981';
    } else if (type === 'capital_call') {
      return '#8b5cf6';
    } else if (type === 'milestone') {
      return '#f59e0b';
    }
    return '#94a3b8';
  }

  // Process data from the API response
  const { timelineEvents, periods, eventTypes, hasData } = useMemo(() => {
    if (isLoading || !results) {
      return { 
        timelineEvents: [], 
        periods: [],
        eventTypes: [],
        hasData: false
      };
    }

    // Get waterfall results
    const waterfallResults = results.waterfall_results || results.waterfallResults || {};
    const yearlyBreakdown = waterfallResults.yearly_breakdown || waterfallResults.yearlyBreakdown || {};
    
    // Get portfolio evolution
    const portfolioEvolution = results.portfolio_evolution || results.portfolioEvolution || {};
    
    // Get loan contributions (if available)
    const loanContributionMap = waterfallResults.loan_contribution_map || waterfallResults.loanContributionMap || {};

    // No data available
    if (Object.keys(yearlyBreakdown).length === 0 && Object.keys(portfolioEvolution).length === 0) {
      return { 
        timelineEvents: [], 
        periods: [],
        eventTypes: [],
        hasData: false
      };
    }

    const events: TimelineEvent[] = [];
    const allPeriods = new Set<number>();
    const allEventTypes = new Set<string>();

    // Process waterfall distributions
    Object.entries(yearlyBreakdown).forEach(([periodStr, data]) => {
      const period = parseInt(periodStr);
      if (isNaN(period)) return;

      allPeriods.add(period);

      const totalDistribution = 
        (data as any).total_lp_distribution || 
        (data as any).totalLpDistribution || 
        0;

      if (totalDistribution > 0) {
        events.push({
          id: `distribution-${period}`,
          period,
          periodLabel: timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`,
          eventType: 'distribution',
          eventSubtype: 'lp_distribution',
          name: `LP Distribution (${timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`})`,
          description: `LP received a distribution of ${formatCurrency(totalDistribution)}`,
          value: totalDistribution,
          metadata: {
            returnOfCapital: (data as any).lp_return_of_capital || (data as any).lpReturnOfCapital || 0,
            preferredReturn: (data as any).lp_preferred_return || (data as any).lpPreferredReturn || 0,
            carriedInterest: (data as any).lp_carried_interest || (data as any).lpCarriedInterest || 0,
            contributingLoans: loanContributionMap[period] ? Object.keys(loanContributionMap[period]).length : 0
          }
        });

        allEventTypes.add('distribution');
      }

      // GP distributions
      const gpDistribution = 
        (data as any).total_gp_distribution || 
        (data as any).totalGpDistribution || 
        0;

      if (gpDistribution > 0) {
        events.push({
          id: `gp-distribution-${period}`,
          period,
          periodLabel: timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`,
          eventType: 'distribution',
          eventSubtype: 'gp_distribution',
          name: `GP Distribution (${timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`})`,
          description: `GP received a distribution of ${formatCurrency(gpDistribution)}`,
          value: gpDistribution,
          metadata: {
            returnOfCapital: (data as any).gp_return_of_capital || (data as any).gpReturnOfCapital || 0,
            catchUp: (data as any).gp_catch_up || (data as any).gpCatchUp || 0,
            carriedInterest: (data as any).gp_carried_interest || (data as any).gpCarriedInterest || 0
          }
        });

        allEventTypes.add('distribution');
      }
    });

    // Process loan exits and other portfolio events
    Object.entries(portfolioEvolution).forEach(([periodStr, data]) => {
      const period = parseInt(periodStr);
      if (isNaN(period)) return;

      allPeriods.add(period);

      // Loan exits
      const exitedLoans = (data as any).exited_loans || (data as any).exitedLoans || 0;
      if (exitedLoans > 0) {
        events.push({
          id: `loan-exits-${period}`,
          period,
          periodLabel: timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`,
          eventType: 'loan_exit',
          eventSubtype: 'normal_exit',
          name: `Loan Exits (${timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`})`,
          description: `${exitedLoans} loans exited the portfolio`,
          value: exitedLoans,
          metadata: {
            exitedOriginal: (data as any).exited_loans_original || (data as any).exitedLoansOriginal || 0,
            exitedReinvest: (data as any).exited_loans_reinvest || (data as any).exitedLoansReinvest || 0,
            defaultedLoans: (data as any).defaulted_loans || (data as any).defaultedLoans || 0
          }
        });

        allEventTypes.add('loan_exit');
      }

      // New investments (reinvestments)
      const newLoans = (data as any).new_loans || (data as any).newLoans || 0;
      if (newLoans > 0) {
        events.push({
          id: `new-loans-${period}`,
          period,
          periodLabel: timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`,
          eventType: 'milestone',
          eventSubtype: 'new_investments',
          name: `New Investments (${timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`})`,
          description: `${newLoans} new loans were added to the portfolio`,
          value: newLoans,
          metadata: {
            reinvestments: (data as any).reinvestments || (data as any).reinvestments || 0,
            reinvestedAmount: (data as any).reinvested_amount || (data as any).reinvestedAmount || 0
          }
        });

        allEventTypes.add('milestone');
      }

      // Capital calls (if available)
      const capitalCalls = results.cash_flows?.capital_called?.[period] || 
                          results.cashFlows?.capitalCalled?.[period] || 0;
      
      if (capitalCalls < 0) { // Capital calls are negative in cash flows
        events.push({
          id: `capital-call-${period}`,
          period,
          periodLabel: timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`,
          eventType: 'capital_call',
          name: `Capital Call (${timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`})`,
          description: `LP contributed ${formatCurrency(Math.abs(capitalCalls))} in capital`,
          value: Math.abs(capitalCalls),
          metadata: {}
        });

        allEventTypes.add('capital_call');
      }
    });

    // Sort events by period and then by value (descending)
    const sortedEvents = events.sort((a, b) => {
      if (a.period !== b.period) return a.period - b.period;
      return b.value - a.value;
    });

    return {
      timelineEvents: sortedEvents,
      periods: Array.from(allPeriods).sort((a, b) => a - b),
      eventTypes: Array.from(allEventTypes),
      hasData: sortedEvents.length > 0
    };
  }, [results, isLoading, timeGranularity]);

  // Apply filters to events
  const filteredEvents = useMemo(() => {
    let filtered = [...timelineEvents];
    
    if (selectedEventType) {
      filtered = filtered.filter(event => event.eventType === selectedEventType);
    }
    
    if (selectedPeriod !== null) {
      filtered = filtered.filter(event => event.period === selectedPeriod);
    }
    
    return filtered;
  }, [timelineEvents, selectedEventType, selectedPeriod]);

  // Prepare data for scatter plot
  const scatterData = useMemo(() => {
    return filteredEvents.map(event => ({
      x: event.period,
      y: event.value,
      z: getEventSizeValue(event),
      name: event.name,
      type: event.eventType,
      subtype: event.eventSubtype,
      description: event.description,
      originalEvent: event
    }));
  }, [filteredEvents]);

  // Helper function to determine size value for scatter plot
  function getEventSizeValue(event: TimelineEvent): number {
    // Base size by event type
    switch(event.eventType) {
      case 'distribution':
        return Math.max(Math.log(event.value) * 5, 20);
      case 'loan_exit':
        return event.value * 5;
      case 'capital_call':
        return Math.max(Math.log(event.value) * 3, 15);
      case 'milestone':
        return 25;
      default:
        return 20;
    }
  }

  // Get icon by event type
  function getEventIcon(type: string) {
    switch(type) {
      case 'distribution':
        return <CircleDollarSign className="h-5 w-5" />;
      case 'loan_exit':
        return <ArrowUpRight className="h-5 w-5" />;
      case 'capital_call':
        return <ArrowRight className="h-5 w-5" />;
      case 'milestone':
        return <Calendar className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  }

  // Handle event click in scatter plot
  const handleEventClick = (data: any) => {
    if (data && data.originalEvent) {
      setSelectedEvent(data.originalEvent);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-7 w-64 bg-muted animate-pulse rounded"></div>
          </CardTitle>
          <CardDescription>
            <div className="h-5 w-96 bg-muted animate-pulse rounded"></div>
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="h-full w-full bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!hasData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Investment Journey Timeline</CardTitle>
          <CardDescription>
            Visualize key events throughout the lifecycle of your investment
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">No timeline data available</p>
            <p className="text-sm text-muted-foreground">
              This visualization requires investment journey data from the simulation results.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Investment Journey Timeline</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              onClick={() => setViewMode('timeline')}
              className="h-8 px-2"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Timeline
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'scatter' ? 'default' : 'outline'}
              onClick={() => setViewMode('scatter')}
              className="h-8 px-2"
            >
              <BarChart className="h-4 w-4 mr-1" />
              Scatter
            </Button>
          </div>
        </CardTitle>
        <div className="text-sm text-muted-foreground flex items-center justify-between">
          <span>
            Visualize key events throughout the lifecycle of your investment
          </span>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-md text-xs px-2 py-1"
              value={selectedEventType || ''}
              onChange={(e) => setSelectedEventType(e.target.value || null)}
            >
              <option value="">All Event Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
            <select
              className="border rounded-md text-xs px-2 py-1"
              value={selectedPeriod !== null ? selectedPeriod : ''}
              onChange={(e) => setSelectedPeriod(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Periods</option>
              {periods.map((period) => (
                <option key={period} value={period}>
                  {timeGranularity === 'yearly' ? `Year ${period}` : `Month ${period}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Scatter plot view */}
        {viewMode === 'scatter' && (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Period" 
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => timeGranularity === 'yearly' ? `Y${value}` : `M${value}`}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Value" 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <ZAxis 
                  type="number" 
                  dataKey="z" 
                  range={[20, 100]} 
                  name="Size" 
                />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background p-3 border rounded-md shadow-sm max-w-xs">
                          <div className="font-semibold text-sm mb-1">{data.name}</div>
                          <div className="text-xs mb-2">{data.description}</div>
                          <div className="flex items-center text-xs">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getEventColor(data.type, data.subtype) }}></span>
                            <span className="ml-1">{data.type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  payload={
                    Array.from(new Set(scatterData.map(item => item.type))).map(type => ({
                      value: type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                      type: 'circle',
                      color: getEventColor(type)
                    }))
                  }
                />
                
                {/* Reference lines for significant events like return of capital completion */}
                <ReferenceLine x={5} stroke="#8884d8" strokeDasharray="3 3">
                  <Label value="End of Reinvestment Period" position="insideTopRight" />
                </ReferenceLine>

                {/* Plot the data */}
                {Array.from(new Set(scatterData.map(item => item.type))).map(eventType => (
                  <Scatter 
                    key={eventType}
                    name={eventType.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    data={scatterData.filter(item => item.type === eventType)}
                    fill={getEventColor(eventType)}
                    onClick={handleEventClick}
                    cursor="pointer"
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Timeline view */}
        {viewMode === 'timeline' && (
          <div className="h-[400px]">
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedEvent?.id === event.id ? 'bg-muted border-primary' : ''}`}
                    onClick={() => setSelectedEvent(event.id === selectedEvent?.id ? null : event)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                          style={{ backgroundColor: getEventColor(event.eventType, event.eventSubtype) }}
                        >
                          {getEventIcon(event.eventType)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{event.name}</div>
                          <div className="text-xs text-muted-foreground">{event.periodLabel}</div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {event.eventType === 'distribution' ? formatCurrency(event.value) : 
                         event.eventType === 'capital_call' ? formatCurrency(event.value) : 
                         typeof event.value === 'number' ? event.value.toString() : event.value}
                      </Badge>
                    </div>
                    <div className="text-xs">{event.description}</div>
                    
                    {/* Show metadata if event is selected */}
                    {selectedEvent?.id === event.id && (
                      <div className="mt-2 border-t pt-2 text-xs">
                        <div className="font-medium mb-1">Event Details:</div>
                        {event.eventType === 'distribution' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">Return of Capital:</span>{' '}
                              {formatCurrency(event.metadata.returnOfCapital || 0)}
                            </div>
                            {event.eventSubtype === 'lp_distribution' && (
                              <div>
                                <span className="text-muted-foreground">Preferred Return:</span>{' '}
                                {formatCurrency(event.metadata.preferredReturn || 0)}
                              </div>
                            )}
                            {event.eventSubtype === 'gp_distribution' && (
                              <div>
                                <span className="text-muted-foreground">Catch Up:</span>{' '}
                                {formatCurrency(event.metadata.catchUp || 0)}
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Carried Interest:</span>{' '}
                              {formatCurrency(event.metadata.carriedInterest || 0)}
                            </div>
                            {event.metadata.contributingLoans > 0 && (
                              <div>
                                <span className="text-muted-foreground">Contributing Loans:</span>{' '}
                                {event.metadata.contributingLoans}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {event.eventType === 'loan_exit' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">Original Loans:</span>{' '}
                              {event.metadata.exitedOriginal || 0}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reinvested Loans:</span>{' '}
                              {event.metadata.exitedReinvest || 0}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Defaulted Loans:</span>{' '}
                              {event.metadata.defaultedLoans || 0}
                            </div>
                          </div>
                        )}
                        
                        {event.eventType === 'milestone' && event.eventSubtype === 'new_investments' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">Reinvestments:</span>{' '}
                              {event.metadata.reinvestments || 0}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reinvested Amount:</span>{' '}
                              {formatCurrency(event.metadata.reinvestedAmount || 0)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}