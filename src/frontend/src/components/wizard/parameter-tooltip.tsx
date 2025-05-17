import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ParameterTooltipProps {
  title: string;
  description: string;
  defaultValue?: string | number | boolean;
  children: React.ReactNode;
}

export function ParameterTooltip({
  title,
  description,
  defaultValue,
  children,
}: ParameterTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm">{description}</p>
            {defaultValue !== undefined && (
              <p className="text-xs text-muted-foreground">
                Default: {typeof defaultValue === 'boolean' ? (defaultValue ? 'Yes' : 'No') : defaultValue}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
