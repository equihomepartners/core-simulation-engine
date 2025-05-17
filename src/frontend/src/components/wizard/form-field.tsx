import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormDescription, FormField as UIFormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/format';
import { LogCategory, LogLevel, log } from '@/utils/logging';

interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  type: 'text' | 'number' | 'currency' | 'percentage' | 'slider' | 'switch' | 'select' | 'radio' | 'textarea' | 'object';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function FormField({
  name,
  label,
  description,
  type,
  options,
  min,
  max,
  step = 1,
  placeholder,
  disabled = false,
  required = false,
  className,
}: FormFieldProps) {
  const { control } = useFormContext();

  // Helper function to format values for display
  const formatValue = (value: any) => {
    if (value === undefined || value === null) {
      return '';
    }

    switch (type) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return formatNumber(value);
      case 'object':
        return JSON.stringify(value, null, 2);
      default:
        return String(value);
    }
  };

  // Helper function to parse values from string inputs
  const parseValue = (value: string) => {
    switch (type) {
      case 'number':
      case 'currency':
      case 'percentage':
        return value === '' ? (required ? 0 : '') : Number(value);
      default:
        return value;
    }
  };

  return (
    <UIFormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn('space-y-2', className)}>
          <div className="flex justify-between">
            <FormLabel className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
              {label}
            </FormLabel>
            {fieldState.error && (
              <span className="text-xs text-destructive">{fieldState.error.message}</span>
            )}
          </div>

          {type === 'text' && (
            <FormControl>
              <Input
                {...field}
                value={field.value === null ? '' : field.value}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full"
              />
            </FormControl>
          )}

          {type === 'number' && (
            <FormControl>
              <Input
                {...field}
                type="number"
                min={min}
                max={max}
                step={step}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full"
                value={field.value === null ? '' : field.value}
                onChange={(e) => field.onChange(parseValue(e.target.value))}
              />
            </FormControl>
          )}

          {type === 'currency' && (
            <FormControl>
              <Input
                {...field}
                type="number"
                min={min}
                max={max}
                step={step}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full"
                value={field.value === null ? '' : field.value}
                onChange={(e) => field.onChange(parseValue(e.target.value))}
              />
            </FormControl>
          )}

          {type === 'percentage' && (
            <FormControl>
              <Input
                {...field}
                type="number"
                min={min !== undefined ? min * 100 : undefined}
                max={max !== undefined ? max * 100 : undefined}
                step={step * 100}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full"
                value={field.value !== null && field.value !== undefined ? field.value * 100 : ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? (required ? 0 : '') : Number(e.target.value) / 100;
                  field.onChange(value);
                  console.log(`Percentage field ${field.name} changed to:`, value);
                }}
                onBlur={(e) => {
                  // Ensure the value is properly formatted on blur
                  if (field.value !== null && field.value !== undefined) {
                    console.log(`Percentage field ${field.name} blur value:`, field.value);
                  }
                  field.onBlur();
                }}
              />
            </FormControl>
          )}

          {type === 'slider' && (
            <FormControl>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{formatValue(min)}</span>
                  <span className="text-xs font-medium">{formatValue(field.value)}</span>
                  <span className="text-xs text-muted-foreground">{formatValue(max)}</span>
                </div>
                <Slider
                  value={[field.value]}
                  min={min}
                  max={max}
                  step={step}
                  disabled={disabled}
                  onValueChange={(values) => field.onChange(values[0])}
                />
              </div>
            </FormControl>
          )}

          {type === 'switch' && (
            <FormControl>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
                <span className="text-sm text-muted-foreground">
                  {field.value ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </FormControl>
          )}

          {type === 'select' && options && (
            <FormControl>
              <Select
                value={field.value !== undefined ? String(field.value) : undefined}
                onValueChange={(value) => {
                  field.onChange(value);
                  console.log(`Select field ${field.name} changed to:`, value);
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          )}

          {type === 'radio' && options && (
            <FormControl>
              <RadioGroup
                value={String(field.value)}
                onValueChange={field.onChange}
                disabled={disabled}
                className="flex flex-col space-y-1"
              >
                {options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                    <Label htmlFor={`${name}-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {type === 'textarea' && (
            <FormControl>
              <Textarea
                {...field}
                placeholder={placeholder}
                disabled={disabled}
                className="min-h-[100px]"
              />
            </FormControl>
          )}

          {type === 'object' && (
            <FormControl>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    <span className="truncate">
                      {field.value ? 'Edit Object' : placeholder || 'Select...'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="space-y-4 p-4">
                    <div className="space-y-2">
                      <Label>Edit JSON</Label>
                      <Textarea
                        value={JSON.stringify(field.value || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const value = JSON.parse(e.target.value);
                            field.onChange(value);
                          } catch (error) {
                            log(LogLevel.WARN, LogCategory.UI, `Invalid JSON: ${error}`);
                          }
                        }}
                        className="min-h-[200px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </FormControl>
          )}

          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
