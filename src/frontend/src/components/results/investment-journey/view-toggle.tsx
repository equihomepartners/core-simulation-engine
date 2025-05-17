import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type ViewType = 'value' | 'multiple' | 'irr';

interface ViewToggleProps {
  value: ViewType;
  onChange: (value: ViewType) => void;
  className?: string;
}

export function ViewToggle({
  value,
  onChange,
  className = ''
}: ViewToggleProps) {
  return (
    <Tabs 
      value={value} 
      onValueChange={(newValue) => onChange(newValue as ViewType)}
      className={`w-[300px] ${className}`}
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="value">Value</TabsTrigger>
        <TabsTrigger value="multiple">Multiple</TabsTrigger>
        <TabsTrigger value="irr">IRR</TabsTrigger>
      </TabsList>
    </Tabs>
  );
} 