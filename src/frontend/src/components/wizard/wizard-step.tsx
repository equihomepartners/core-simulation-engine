import React, { ReactNode } from 'react';
import { FormSection } from './form-section';

interface WizardStepProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function WizardStep({ title, description, children }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
