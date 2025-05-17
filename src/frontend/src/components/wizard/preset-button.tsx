import React from 'react';
import { Button } from '@/components/ui/button';
import { useWizard } from '@/contexts/wizard-context';

interface PresetButtonProps {
  preset: 'default' | '100m';
  label: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function PresetButton({
  preset,
  label,
  description,
  icon,
  className,
}: PresetButtonProps) {
  const { loadPreset, goToStep } = useWizard();

  const handleClick = () => {
    loadPreset(preset);
    goToStep(wizardSteps.length - 1); // Go to review step
  };

  return (
    <Button
      variant="outline"
      className={className}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-left">
          <div className="font-medium">{label}</div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      </div>
    </Button>
  );
}

// Define the wizard steps for navigation
const wizardSteps = [
  'fund-structure',
  'fees-expenses',
  'deployment',
  'reinvestment',
  'waterfall',
  'market-loan',
  'advanced',
  'review',
];
