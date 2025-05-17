import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatSimulationValue } from '@/utils/format';
import { cn } from '@/lib/utils';

interface ReviewSectionProps {
  title: string;
  description?: string;
  fields: {
    name: string;
    label: string;
    type: string;
  }[];
  onEdit?: () => void;
  className?: string;
}

export function ReviewSection({
  title,
  description,
  fields,
  onEdit,
  className,
}: ReviewSectionProps) {
  const { getValues } = useFormContext();
  const values = getValues();

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-muted/50 py-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 px-2 text-xs"
            >
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field) => {
            const value = values[field.name];
            if (value === undefined || value === null) {
              return null;
            }

            return (
              <div key={field.name} className="space-y-1">
                <div className="text-sm font-medium">{field.label}</div>
                <div className="text-sm">{formatSimulationValue(value, field.type)}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
