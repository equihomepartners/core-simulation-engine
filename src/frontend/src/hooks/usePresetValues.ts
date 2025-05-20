import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

/**
 * Custom hook to handle preset values
 * This hook will set the form values based on the active preset
 */
export function usePresetValues() {
  const { setValue, getValues } = useFormContext();

  useEffect(() => {
    // Get the active preset from localStorage
    const activePreset = localStorage.getItem('activePreset');
    
    // If the active preset is 100m, set the advanced parameters to true
    if (activePreset === '100m') {
      console.log('Setting advanced parameters to true for 100M preset');
      
      // Set the advanced parameters to true
      const advancedParams = [
        'optimization_enabled',
        'generate_efficient_frontier',
        'stress_testing_enabled',
        'external_data_enabled',
        'generate_reports',
        'gp_entity_enabled',
        'aggregate_gp_economics',
        'run_dual_leverage_comparison'
      ];
      
      // Set each parameter to true
      advancedParams.forEach(param => {
        setValue(param, true, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      });
      
      // Log the updated form values
      console.log('Updated form values:', getValues());
    }
  }, [setValue, getValues]);
}
