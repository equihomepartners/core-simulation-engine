import React from 'react';
import { FormField } from './form-field';
import { ParameterTooltip } from './parameter-tooltip';
import { cn } from '@/lib/utils';
import { useFormContext } from 'react-hook-form';

interface ParameterFieldProps {
  name: string;
  label: string;
  description?: string;
  tooltip?: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'slider' | 'switch' | 'select' | 'radio' | 'textarea' | 'object';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  defaultValue?: any;
  className?: string;
}

export function ParameterField({
  name,
  label,
  description,
  tooltip,
  type,
  options,
  min,
  max,
  step,
  placeholder,
  disabled,
  required,
  defaultValue,
  className,
}: ParameterFieldProps) {
  // Special handling for 100M preset parameters
  const specialParams = [
    'optimization_enabled',
    'generate_efficient_frontier',
    'stress_testing_enabled',
    'external_data_enabled',
    'generate_reports',
    'gp_entity_enabled',
    'aggregate_gp_economics',
    'run_dual_leverage_comparison'
  ];

  const presetId = localStorage.getItem('activePreset');
  const is100mPreset = presetId === '100m';
  const forceTrue = is100mPreset && specialParams.includes(name) && type === 'switch';

  // Use try-catch to handle potential errors with useFormContext
  let formValue = forceTrue ? true : defaultValue;
  try {
    const { getValues, setValue } = useFormContext();

    // Get the current form value for this field
    try {
      const currentValue = getValues(name);
      console.log(`ParameterField ${name} - Current value:`, currentValue, `Default value:`, defaultValue);

      // Special handling for boolean values
      if (type === 'switch') {
        // For switch fields, both true and false are valid values
        if (forceTrue) {
          formValue = true;
          setValue(name, true);
          console.log(`  Switch field ${name} - Forcing true value for 100M preset`);
        } else if (currentValue === true) {
          formValue = true;
          console.log(`  Switch field ${name} - Using true value`);
        } else if (currentValue === false) {
          formValue = false;
          console.log(`  Switch field ${name} - Using false value`);
        }
      } else if (currentValue !== undefined) {
        formValue = currentValue;
      }

      console.log(`  Final value for ${name}:`, formValue, `typeof:`, typeof formValue);
    } catch (error) {
      console.warn(`Error getting value for field ${name}:`, error);
    }
  } catch (error) {
    console.warn('useFormContext not available in this context:', error);
    // Continue rendering without form context
  }

  const fieldLabel = tooltip ? (
    <ParameterTooltip
      title={label}
      description={tooltip}
      defaultValue={formValue}
    >
      <span className="cursor-help border-b border-dotted border-muted-foreground">
        {label}
      </span>
    </ParameterTooltip>
  ) : (
    label
  );

  return (
    <FormField
      name={name}
      label={fieldLabel}
      description={description}
      type={type}
      options={options}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={cn('w-full', className)}
      defaultValue={formValue}
    />
  );
}
