import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';

export function FeesExpensesStep() {
  return (
    <WizardStep
      title="Fees & Expenses"
      description="Configure management fees and fund expenses"
    >
      <FormSection
        title="Management Fees"
        description="Configure the management fee structure"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="management_fee_rate"
            label="Management Fee Rate"
            tooltip="The annual management fee rate as a decimal (e.g., 0.02 for 2%)"
            type="percentage"
            min={0}
            max={0.1}
            step={0.001}
            required
            defaultValue={0.02}
          />
          <ParameterField
            name="management_fee_basis"
            label="Management Fee Basis"
            tooltip="The basis on which management fees are calculated"
            type="select"
            options={[
              { value: 'committed_capital', label: 'Committed Capital' },
              { value: 'invested_capital', label: 'Invested Capital' },
              { value: 'net_asset_value', label: 'Net Asset Value' },
              { value: 'stepped', label: 'Stepped (Declining)' },
            ]}
            required
            defaultValue="committed_capital"
          />
          <ParameterField
            name="management_fee_step_down"
            label="Step Down Management Fees"
            tooltip="Whether to step down management fees in later years"
            type="switch"
            defaultValue={false}
          />
        </div>

        {/* Conditional fields that appear when step down is enabled */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <ParameterField
            name="management_fee_step_down_year"
            label="Step Down Year"
            tooltip="The year to begin stepping down management fees"
            type="number"
            min={1}
            max={20}
            step={1}
            defaultValue={5}
          />
          <ParameterField
            name="management_fee_step_down_rate"
            label="Step Down Rate"
            tooltip="The rate to step down management fees (e.g., 0.5 means fees are reduced by 50%)"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.5}
          />
        </div>
      </FormSection>

      <FormSection
        title="Fund Expenses"
        description="Configure fund expenses and formation costs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="expense_rate"
            label="Expense Rate"
            tooltip="The annual fund expense rate as a decimal (e.g., 0.005 for 0.5%)"
            type="percentage"
            min={0}
            max={0.1}
            step={0.001}
            required
            defaultValue={0.005}
          />
          <ParameterField
            name="formation_costs"
            label="Formation Costs"
            tooltip="Initial fund formation costs in dollars"
            type="currency"
            min={0}
            max={10000000}
            step={10000}
            defaultValue={0}
          />
        </div>
      </FormSection>
    </WizardStep>
  );
}
