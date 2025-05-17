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
  // Use try-catch to handle potential errors with useFormContext
  try {
    const { getValues } = useFormContext();

    // Log the current form value for this field
    try {
      const currentValue = getValues(name);
      console.log(`ParameterField ${name} - Current value:`, currentValue, `Default value:`, defaultValue);
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
      defaultValue={defaultValue}
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
    />
  );
}
