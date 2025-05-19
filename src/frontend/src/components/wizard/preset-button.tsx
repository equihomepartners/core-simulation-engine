import React from 'react';
import { Button } from '@/components/ui/button';
import { useWizard } from '@/contexts/wizard-context';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

  const handleClick = () => {
    console.log(`Loading preset: ${preset}`);
    loadPreset(preset);
    goToStep(0); // Go to first step instead of review

    // Store the preset ID in localStorage
    localStorage.setItem('activePreset', preset);

    // Show a notification that preset is loaded but can be customized
    toast({
      title: "Preset Loaded",
      description: `The ${preset === '100m' ? '$100M' : 'default'} preset has been loaded. You can customize any parameters before running the simulation.`,
      variant: "default",
      duration: 5000,
    });
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
  'sydney-data',
  'leverage',
  'advanced',
  'review',
];
