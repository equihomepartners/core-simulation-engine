import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';

export function ReinvestmentStep() {
  return (
    <WizardStep
      title="Reinvestment & Exit"
      description="Configure reinvestment strategy and exit parameters"
    >
      <FormSection
        title="Reinvestment Parameters"
        description="Configure how capital is reinvested"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="reinvestment_period"
            label="Reinvestment Period"
            tooltip="The number of years during which reinvestment is allowed"
            type="number"
            min={0}
            max={20}
            step={1}
            required
            defaultValue={5}
          />
          <ParameterField
            name="reinvestment_rate"
            label="Reinvestment Rate"
            tooltip="The fraction of exits to reinvest (0-1)"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
            required
            defaultValue={0.0}
          />
          <ParameterField
            name="profit_reinvestment_percentage"
            label="Profit Reinvestment Percentage"
            tooltip="The percentage of profits to reinvest (for American waterfall)"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.0}
          />
          <ParameterField
            name="reinvestment_reserve_rate"
            label="Reinvestment Reserve Rate"
            tooltip="The fraction of cash reserved for reinvestment"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.8}
          />
        </div>
      </FormSection>

      <FormSection
        title="Exit Parameters"
        description="Configure how loans exit the portfolio"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="force_exit_within_fund_term"
            label="Force Exits Within Fund Term"
            tooltip="If enabled, all loans are forced to exit on or before the fund's final year. Disable to allow exits beyond the term (real-world tail)."
            type="switch"
            defaultValue={true}
          />
          <ParameterField
            name="avg_loan_exit_year"
            label="Average Loan Exit Year"
            tooltip="The average year when loans exit the portfolio"
            type="number"
            min={1}
            max={20}
            step={0.1}
            required
            defaultValue={7}
          />
          <ParameterField
            name="exit_year_std_dev"
            label="Exit Year Standard Deviation"
            tooltip="The standard deviation of exit years"
            type="number"
            min={0}
            max={10}
            step={0.1}
            defaultValue={1.5}
          />
          <ParameterField
            name="early_exit_probability"
            label="Early Exit Probability"
            tooltip="The probability of early exit each year"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.3}
          />
        </div>
      </FormSection>
    </WizardStep>
  );
}
