import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export type Perspective = 'lp' | 'gp' | 'fund';

interface PerspectiveToggleProps {
  value: Perspective;
  onChange: (value: Perspective) => void;
  className?: string;
  availablePerspectives?: Perspective[];
}

export function PerspectiveToggle({
  value,
  onChange,
  className = '',
  availablePerspectives = ['lp', 'fund']
}: PerspectiveToggleProps) {
  // Default to showing only LP and Fund if nothing is specified
  if (!availablePerspectives || availablePerspectives.length === 0) {
    availablePerspectives = ['lp', 'fund'];
  }

  const isPerspectiveAvailable = (perspective: Perspective): boolean => {
    return availablePerspectives?.includes(perspective) || false;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium">Perspective:</span>
      <ToggleGroup type="single" value={value} onValueChange={(val) => {
        if (val && isPerspectiveAvailable(val as Perspective)) {
          onChange(val as Perspective);
        }
      }}>
        <ToggleGroupItem 
          value="lp" 
          aria-label="LP Perspective"
          disabled={!isPerspectiveAvailable('lp')}
        >
          <div className="flex items-center gap-1">
            <span>LP</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Limited Partner view shows returns after all fees and carried interest
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="fund" 
          aria-label="Fund Perspective"
          disabled={!isPerspectiveAvailable('fund')}
        >
          <div className="flex items-center gap-1">
            <span>Fund</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    Fund view shows performance before carried interest but after management fees
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="gp" 
          aria-label="GP Perspective"
          disabled={!isPerspectiveAvailable('gp')}
        >
          <div className="flex items-center gap-1">
            <span>GP</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">
                    General Partner view shows economics and carried interest earned
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
} 