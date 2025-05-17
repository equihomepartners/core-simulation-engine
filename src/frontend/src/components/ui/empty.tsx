import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Empty({
  title = 'No data available',
  description = 'There is no data to display at the moment.',
  action,
  className,
  ...props
}: EmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
        className
      )}
      {...props}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
