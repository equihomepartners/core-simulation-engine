import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeGranularity } from '@/types/finance';

interface TimeGranularityToggleProps {
  value: TimeGranularity;
  onChange: (value: TimeGranularity) => void;
  className?: string;
  availableGranularities?: TimeGranularity[];
}

export function TimeGranularityToggle({
  value,
  onChange,
  className = '',
  availableGranularities = ['yearly']
}: TimeGranularityToggleProps) {
  // Default to showing only yearly if nothing is specified
  if (!availableGranularities || availableGranularities.length === 0) {
    availableGranularities = ['yearly'];
  }

  const isGranularityAvailable = (granularity: TimeGranularity): boolean => {
    return availableGranularities?.includes(granularity) || false;
  };

  return (
    <Tabs 
      value={value} 
      onValueChange={(newValue) => {
        if (isGranularityAvailable(newValue as TimeGranularity)) {
          onChange(newValue as TimeGranularity);
        }
      }}
      className={`w-[300px] ${className}`}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="yearly" disabled={!isGranularityAvailable('yearly')}>
          Yearly
        </TabsTrigger>
        <TabsTrigger value="quarterly" disabled={!isGranularityAvailable('quarterly')}>
          Quarterly
        </TabsTrigger>
        <TabsTrigger value="monthly" disabled={!isGranularityAvailable('monthly')}>
          Monthly
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
} 