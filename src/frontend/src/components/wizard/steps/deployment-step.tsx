import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';

export function DeploymentStep() {
  return (
    <WizardStep
      title="Deployment"
      description="Configure capital deployment and capital calls"
    >
      <FormSection
        title="Deployment Parameters"
        description="Configure how capital is deployed over time"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="deployment_pace"
            label="Deployment Pace"
            tooltip="How quickly to deploy capital over the deployment period"
            type="select"
            options={[
              { value: 'even', label: 'Even (Linear)' },
              { value: 'front_loaded', label: 'Front-Loaded (Faster Early)' },
              { value: 'back_loaded', label: 'Back-Loaded (Faster Later)' },
              { value: 'bell_curve', label: 'Bell Curve (Faster in Middle)' },
            ]}
            required
            defaultValue="even"
          />
          <ParameterField
            name="deployment_period"
            label="Deployment Period"
            tooltip="The period over which to deploy capital"
            type="number"
            min={1}
            max={20}
            step={1}
            required
            defaultValue={3}
          />
          <ParameterField
            name="deployment_period_unit"
            label="Deployment Period Unit"
            tooltip="The unit for the deployment period"
            type="select"
            options={[
              { value: 'years', label: 'Years' },
              { value: 'months', label: 'Months' },
              { value: 'quarters', label: 'Quarters' },
            ]}
            required
            defaultValue="years"
          />
          <ParameterField
            name="deployment_monthly_granularity"
            label="Monthly Granularity"
            tooltip="Whether to use monthly granularity for deployment and exit calculations (if false, yearly granularity is used)"
            type="switch"
            defaultValue={false}
          />
        </div>
      </FormSection>

      <FormSection
        title="Capital Call Parameters"
        description="Configure how capital is called from investors"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="capital_call_schedule"
            label="Capital Call Schedule"
            tooltip="How capital is called from investors over time"
            type="select"
            options={[
              { value: 'upfront', label: 'Upfront (All at Once)' },
              { value: 'equal', label: 'Equal (Even Calls)' },
              { value: 'front_loaded', label: 'Front-Loaded (More Early)' },
              { value: 'back_loaded', label: 'Back-Loaded (More Later)' },
              { value: 'custom', label: 'Custom Schedule' },
            ]}
            required
            defaultValue="upfront"
          />
          <ParameterField
            name="capital_call_years"
            label="Capital Call Years"
            tooltip="The number of years over which capital is called"
            type="number"
            min={1}
            max={10}
            step={1}
            required
            defaultValue={3}
          />
        </div>
      </FormSection>

      <FormSection
        title="Advanced Deployment Options"
        description="Configure custom deployment schedules (optional)"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 gap-4">
          <ParameterField
            name="custom_capital_call_schedule"
            label="Custom Capital Call Schedule"
            tooltip="Custom capital call schedule by year (e.g., {0: 0.5, 1: 0.3, 2: 0.2})"
            type="object"
            placeholder="Enter custom schedule..."
          />
          <ParameterField
            name="custom_capital_call_schedule_monthly"
            label="Custom Monthly Capital Call Schedule"
            tooltip="Custom capital call schedule by month (advanced)"
            type="object"
            placeholder="Enter custom monthly schedule..."
          />
          <ParameterField
            name="custom_deployment_schedule_monthly"
            label="Custom Monthly Deployment Schedule"
            tooltip="Custom deployment schedule by month (advanced)"
            type="object"
            placeholder="Enter custom monthly deployment..."
          />
        </div>
      </FormSection>
    </WizardStep>
  );
}
