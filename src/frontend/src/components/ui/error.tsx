import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function Error({
  title = 'Something went wrong',
  message = 'An error occurred while processing your request.',
  onRetry,
  className,
  ...props
}: ErrorProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center',
        className
      )}
      {...props}
    >
      <h3 className="text-lg font-semibold text-destructive">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          Try Again
        </Button>
      )}
    </div>
  );
}
