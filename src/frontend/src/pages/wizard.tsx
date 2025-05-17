import React from 'react';
import { WizardProvider, useWizard } from '@/contexts/wizard-context';
import { WizardLayout } from '@/components/wizard/wizard-layout';
import { FundStructureStep } from '@/components/wizard/steps/fund-structure-step';
import { FeesExpensesStep } from '@/components/wizard/steps/fees-expenses-step';
import { DeploymentStep } from '@/components/wizard/steps/deployment-step';
import { ReinvestmentStep } from '@/components/wizard/steps/reinvestment-step';
import { WaterfallStep } from '@/components/wizard/steps/waterfall-step';
import { MarketLoanStep } from '@/components/wizard/steps/market-loan-step';
import { AdvancedStep } from '@/components/wizard/steps/advanced-step';
import { ReviewStep } from '@/components/wizard/steps/review-step';
import { wizardSteps } from '@/schemas/simulation-schema';

function WizardContent() {
  const {
    currentStep,
    totalSteps,
    stepTitles,
    goToNextStep,
    goToPreviousStep,
    submitForm,
    isLastStep,
    isSubmitting,
    formState,
  } = useWizard();

  // Determine which step component to render
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <FundStructureStep />;
      case 1:
        return <FeesExpensesStep />;
      case 2:
        return <DeploymentStep />;
      case 3:
        return <ReinvestmentStep />;
      case 4:
        return <WaterfallStep />;
      case 5:
        return <MarketLoanStep />;
      case 6:
        return <AdvancedStep />;
      case 7:
        return <ReviewStep />;
      default:
        return <FundStructureStep />;
    }
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      stepTitles={stepTitles}
      onNext={goToNextStep}
      onPrevious={goToPreviousStep}
      onSubmit={submitForm}
      isNextDisabled={!formState.isValid}
      isSubmitDisabled={!formState.isValid || isSubmitting}
      isLastStep={isLastStep}
    >
      {renderStep()}
    </WizardLayout>
  );
}

export function Wizard() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}
