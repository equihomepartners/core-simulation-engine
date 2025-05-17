import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';

export function MarketLoanStep() {
  return (
    <WizardStep
      title="Market & Loans"
      description="Configure market conditions and loan parameters"
    >
      <FormSection
        title="Market Conditions"
        description="Configure market conditions by year"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 gap-4">
          <ParameterField
            name="market_conditions_by_year"
            label="Market Conditions by Year"
            tooltip="Market conditions for each year (e.g., {1: {housing_market_trend: 'appreciating', interest_rate_environment: 'stable', economic_outlook: 'expansion'}})"
            type="object"
            placeholder="Enter market conditions..."
          />
        </div>
      </FormSection>

      <FormSection
        title="Loan Parameters"
        description="Configure loan size and term parameters"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="avg_loan_size"
            label="Average Loan Size"
            tooltip="The average size of loans in dollars"
            type="currency"
            min={10000}
            max={10000000}
            step={10000}
            required
            defaultValue={250000}
          />
          <ParameterField
            name="loan_size_std_dev"
            label="Loan Size Standard Deviation"
            tooltip="The standard deviation of loan sizes in dollars"
            type="currency"
            min={0}
            max={1000000}
            step={10000}
            defaultValue={50000}
          />
          <ParameterField
            name="min_loan_size"
            label="Minimum Loan Size"
            tooltip="The minimum size of loans in dollars"
            type="currency"
            min={1000}
            max={1000000}
            step={10000}
            defaultValue={100000}
          />
          <ParameterField
            name="max_loan_size"
            label="Maximum Loan Size"
            tooltip="The maximum size of loans in dollars"
            type="currency"
            min={100000}
            max={100000000}
            step={100000}
            defaultValue={500000}
          />
          <ParameterField
            name="avg_loan_term"
            label="Average Loan Term"
            tooltip="The average term of loans in years"
            type="number"
            min={1}
            max={30}
            step={1}
            required
            defaultValue={5}
          />
          <ParameterField
            name="avg_loan_interest_rate"
            label="Average Loan Interest Rate"
            tooltip="The average interest rate on loans (e.g., 0.06 for 6%)"
            type="percentage"
            min={0}
            max={0.5}
            step={0.001}
            required
            defaultValue={0.06}
          />
          <ParameterField
            name="avg_loan_ltv"
            label="Average Loan LTV"
            tooltip="The average loan-to-value ratio (e.g., 0.75 for 75%)"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
            required
            defaultValue={0.75}
          />
        </div>
      </FormSection>

      <FormSection
        title="Zone Allocations"
        description="Configure zone allocation percentages"
      >
        <div className="grid grid-cols-1 gap-4">
          <ParameterField
            name="zone_allocations"
            label="Zone Allocations"
            tooltip="Zone allocation percentages (e.g., {green: 0.6, orange: 0.3, red: 0.1})"
            type="object"
            placeholder="Enter zone allocations..."
          />
        </div>
      </FormSection>
    </WizardStep>
  );
}
