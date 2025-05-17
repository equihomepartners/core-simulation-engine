import React from 'react';
import { cn } from '@/lib/utils';

interface WizardStepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onStepClick?: (step: number) => void;
}

export function WizardStepIndicator({
  currentStep,
  totalSteps,
  stepTitles,
  onStepClick,
}: WizardStepIndicatorProps) {
  return (
    <div className="relative">
      {/* Progress bar */}
      <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2" />
      <div
        className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 transition-all duration-300"
        style={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
      />

      {/* Step indicators */}
      <div className="relative flex justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <div
              key={index}
              className="flex flex-col items-center"
              onClick={() => isClickable && onStepClick(index)}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 z-10',
                  isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-background border-muted text-muted-foreground',
                  isClickable && 'cursor-pointer hover:border-primary/80'
                )}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-2 font-medium',
                  isCurrent ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {stepTitles[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
