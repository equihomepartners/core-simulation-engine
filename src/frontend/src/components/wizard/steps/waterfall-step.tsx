import React, { useEffect } from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';
import { useFormContext } from 'react-hook-form';
import { LogCategory, LogLevel, log } from '@/utils/logging';

export function WaterfallStep() {
  try {
    const { getValues, watch } = useFormContext();

    // Log waterfall parameters when the component mounts
    useEffect(() => {
      try {
        const formValues = getValues();
        log(LogLevel.INFO, LogCategory.UI, 'WaterfallStep mounted - Current values:', {
          catch_up_rate: formValues.catch_up_rate,
          catch_up_structure: formValues.catch_up_structure,
          waterfall_structure: formValues.waterfall_structure
        });

        // Watch for changes to waterfall parameters
        const subscription = watch((value, { name }) => {
          if (name === 'catch_up_rate' || name === 'catch_up_structure' || name === 'waterfall_structure') {
            log(LogLevel.INFO, LogCategory.UI, `WaterfallStep - ${name} changed:`, {
              [name]: value[name]
            });
          }
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.warn('Error in WaterfallStep useEffect:', error);
      }
    }, [getValues, watch]);
  } catch (error) {
    console.warn('Error in WaterfallStep - useFormContext not available:', error);
  }

  return (
    <WizardStep
      title="Waterfall"
      description="Configure waterfall structure and returns"
    >
      <FormSection
        title="Waterfall Structure"
        description="Configure the basic waterfall structure"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="waterfall_structure"
            label="Waterfall Structure"
            tooltip="The type of waterfall structure to use"
            type="select"
            options={[
              { value: 'european', label: 'European Waterfall' },
              { value: 'american', label: 'American Waterfall' },
            ]}
            required
          />
          <ParameterField
            name="hurdle_rate"
            label="Hurdle Rate"
            tooltip="The preferred return rate (e.g., 0.08 for 8%)"
            type="percentage"
            min={0}
            max={0.5}
            step={0.001}
            required

          />
          <ParameterField
            name="catch_up_rate"
            label="Catch-up Rate"
            tooltip="The GP catch-up rate (e.g., 0.5 for 50%)"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
          />
          <ParameterField
            name="catch_up_structure"
            label="Catch-up Structure"
            tooltip="The type of GP catch-up"
            type="select"
            options={[
              { value: 'full', label: 'Full Catch-up' },
              { value: 'partial', label: 'Partial Catch-up' },
              { value: 'none', label: 'No Catch-up' },
            ]}
          />
          <ParameterField
            name="carried_interest_rate"
            label="Carried Interest Rate"
            tooltip="The GP carried interest percentage (e.g., 0.2 for 20%)"
            type="percentage"
            min={0}
            max={0.5}
            step={0.01}
            required

          />
          <ParameterField
            name="gp_commitment_percentage"
            label="GP Commitment Percentage"
            tooltip="The GP commitment as a percentage of fund size (e.g., 0.05 for 5%)"
            type="percentage"
            min={0}
            max={0.5}
            step={0.01}

          />
        </div>
      </FormSection>

      <FormSection
        title="Distribution Parameters"
        description="Configure how distributions are made"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="preferred_return_compounding"
            label="Preferred Return Compounding"
            tooltip="How the preferred return compounds"
            type="select"
            options={[
              { value: 'annual', label: 'Annual' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'continuous', label: 'Continuous' },
            ]}

          />
          <ParameterField
            name="distribution_frequency"
            label="Distribution Frequency"
            tooltip="How often distributions occur"
            type="select"
            options={[
              { value: 'annual', label: 'Annual' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'semi_annual', label: 'Semi-Annual' },
            ]}

          />
          <ParameterField
            name="distribution_policy"
            label="Distribution Policy"
            tooltip="How distributions are determined"
            type="select"
            options={[
              { value: 'available_cash', label: 'Available Cash' },
              { value: 'income_only', label: 'Income Only' },
              { value: 'return_of_capital', label: 'Return of Capital' },
              { value: 'reinvestment_priority', label: 'Reinvestment Priority' },
            ]}

          />
          <ParameterField
            name="clawback_provision"
            label="Clawback Provision"
            tooltip="Whether the GP is subject to clawback"
            type="switch"

          />
          <ParameterField
            name="management_fee_offset_percentage"
            label="Management Fee Offset Percentage"
            tooltip="The percentage of management fees offset against carried interest"
            type="percentage"
            min={0}
            max={1}
            step={0.01}

          />
        </div>
      </FormSection>
    </WizardStep>
  );
}
