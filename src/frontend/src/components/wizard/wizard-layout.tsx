import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WizardStepIndicator } from './wizard-step-indicator';
import { WizardNavigation } from './wizard-navigation';

interface WizardLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isNextDisabled?: boolean;
  isPreviousDisabled?: boolean;
  isSubmitDisabled?: boolean;
  isLastStep?: boolean;
}

export function WizardLayout({
  children,
  currentStep,
  totalSteps,
  stepTitles,
  onNext,
  onPrevious,
  onSubmit,
  isNextDisabled = false,
  isPreviousDisabled = false,
  isSubmitDisabled = false,
  isLastStep = false,
}: WizardLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Simulation Wizard</h1>
          <p className="text-muted-foreground">
            Configure your simulation parameters
          </p>
        </div>
      </div>

      <WizardStepIndicator 
        currentStep={currentStep} 
        totalSteps={totalSteps} 
        stepTitles={stepTitles}
      />

      <Card className="border-t-4 border-t-primary">
        <CardContent className="pt-6">
          {children}
        </CardContent>
      </Card>

      <WizardNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={onNext}
        onPrevious={onPrevious}
        onSubmit={onSubmit}
        isNextDisabled={isNextDisabled}
        isPreviousDisabled={isPreviousDisabled}
        isSubmitDisabled={isSubmitDisabled}
        isLastStep={isLastStep}
      />
    </div>
  );
}
