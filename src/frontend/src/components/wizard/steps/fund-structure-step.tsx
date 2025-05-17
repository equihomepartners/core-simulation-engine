import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';

export function FundStructureStep() {
  return (
    <WizardStep
      title="Fund Structure"
      description="Configure the basic fund parameters"
    >
      <FormSection
        title="Fund Parameters"
        description="Configure the size and term of the fund"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="fund_size"
            label="Fund Size"
            tooltip="The total size of the fund in dollars"
            type="currency"
            min={1000000}
            max={10000000000}
            step={1000000}
            required
            defaultValue={100000000}
          />
          <ParameterField
            name="fund_term"
            label="Fund Term"
            tooltip="The lifetime of the fund in years"
            type="number"
            min={1}
            max={30}
            step={1}
            required
            defaultValue={10}
          />
        </div>
      </FormSection>

      <FormSection
        title="Fund Identification"
        description="Optional identifiers for the fund"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="fund_id"
            label="Fund ID"
            tooltip="A unique identifier for the fund"
            type="text"
            placeholder="e.g., Fund-2024-01"
          />
          <ParameterField
            name="fund_group"
            label="Fund Group"
            tooltip="A group identifier for organizing multiple funds"
            type="text"
            placeholder="e.g., Series A"
          />
          <ParameterField
            name="tranche_id"
            label="Tranche ID"
            tooltip="An identifier for a specific tranche within the fund"
            type="text"
            placeholder="e.g., Tranche-1"
          />
        </div>
      </FormSection>
    </WizardStep>
  );
}
