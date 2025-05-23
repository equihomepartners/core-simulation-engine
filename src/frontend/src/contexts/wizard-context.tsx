import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { simulationSchema, defaultSimulationConfig, SimulationConfig, wizardSteps } from '@/schemas/simulation-schema';
import { LogCategory, LogLevel, log, logBackendDataStructure } from '@/utils/logging';
import { sdkWrapper } from '@/utils/sdkWrapper';
import { simulationSDK } from '@/sdk';
import { getDefaultPreset, get100MPreset } from '@/presets';

interface WizardContextType {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  goToStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  isLastStep: boolean;
  isFirstStep: boolean;
  resetForm: () => void;
  submitForm: () => void;
  loadPreset: (preset: 'default' | '100m') => void;
  isSubmitting: boolean;
  formState: any;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

interface WizardProviderProps {
  children: ReactNode;
}

export function WizardProvider({ children }: WizardProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = wizardSteps.length;
  const stepTitles = wizardSteps.map((step) => step.title);

  // Initialize form with default values
  const methods = useForm<SimulationConfig>({
    resolver: zodResolver(simulationSchema),
    defaultValues: defaultSimulationConfig,
    mode: 'onChange',
  });

  // Parse step from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stepParam = params.get('step');
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (!isNaN(step) && step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    }
  }, [location.search, totalSteps]);

  // Update URL when step changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('step', currentStep.toString());
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [currentStep, location.pathname, navigate]);

  // Load form state from localStorage on initial load
  useEffect(() => {
    const savedState = localStorage.getItem('wizardFormState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        methods.reset(parsedState);
        log(LogLevel.INFO, LogCategory.UI, 'Loaded form state from localStorage');
      } catch (error) {
        log(LogLevel.ERROR, LogCategory.UI, 'Failed to load form state from localStorage', error);
      }
    }
  }, [methods]);

  // Save form state to localStorage when it changes
  useEffect(() => {
    const subscription = methods.watch((value) => {
      localStorage.setItem('wizardFormState', JSON.stringify(value));

      // Log waterfall parameters when they change
      if (value.catch_up_rate !== undefined ||
          value.catch_up_structure !== undefined ||
          value.waterfall_structure !== undefined) {
        log(LogLevel.INFO, LogCategory.UI, 'Waterfall parameters changed:', {
          catch_up_rate: value.catch_up_rate,
          catch_up_structure: value.catch_up_structure,
          waterfall_structure: value.waterfall_structure
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };

  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    methods.reset(defaultSimulationConfig);
    localStorage.removeItem('wizardFormState');
    setCurrentStep(0);
  };

  const submitForm = async () => {
    try {
      setIsSubmitting(true);
      const isValid = await methods.trigger();
      if (!isValid) {
        log(LogLevel.WARN, LogCategory.UI, 'Form validation failed');
        setIsSubmitting(false);
        return;
      }

      const formData = methods.getValues();

      // Log the complete form data structure
      logBackendDataStructure(formData, 'Wizard Form Submission');

      // Log specific fields we're concerned about
      log(LogLevel.INFO, LogCategory.UI, 'Waterfall parameters being submitted:', {
        catch_up_rate: formData.catch_up_rate,
        catch_up_structure: formData.catch_up_structure,
        waterfall_structure: formData.waterfall_structure,
        hurdle_rate: formData.hurdle_rate,
        carried_interest_rate: formData.carried_interest_rate,
        gp_commitment_percentage: formData.gp_commitment_percentage
      });

      log(LogLevel.INFO, LogCategory.UI, 'Submitting form', formData);

      const runDual = (formData as any).run_dual_leverage_comparison === true;

      // Helper to ensure leverage disabled in the control scenario
      const buildUnlevered = (cfg: any) => {
        const clone = JSON.parse(JSON.stringify(cfg));
        if (clone.leverage?.green_sleeve) clone.leverage.green_sleeve.enabled = false;
        if (clone.leverage?.a_plus_overadvance) clone.leverage.a_plus_overadvance.enabled = false;
        if (clone.leverage?.deal_note) clone.leverage.deal_note.enabled = false;
        if (clone.leverage?.ramp_line) clone.leverage.ramp_line.enabled = false;
        return clone;
      };

      let mainResult: any = null;
      let controlResult: any = null;

      // Filter form data to only include fields expected by the backend
      const filteredFormData = {
        fund_size: formData.fund_size,
        fund_term: formData.fund_term,
        fund_id: formData.fund_id,
        fund_group: formData.fund_group,
        tranche_id: formData.tranche_id,
        gp_commitment_percentage: formData.gp_commitment_percentage,
        hurdle_rate: formData.hurdle_rate,
        carried_interest_rate: formData.carried_interest_rate,
        waterfall_structure: formData.waterfall_structure,
        monte_carlo_enabled: formData.monte_carlo_enabled,
        optimization_enabled: formData.optimization_enabled,
        stress_testing_enabled: formData.stress_testing_enabled,
        external_data_enabled: formData.external_data_enabled,
        generate_reports: formData.generate_reports,
        leverage: {
          green_sleeve: formData.leverage?.green_sleeve,
          a_plus_overadvance: formData.leverage?.a_plus_overadvance,
          deal_note: formData.leverage?.deal_note,
          ramp_line: formData.leverage?.ramp_line,
          dynamic_rules: [] // Empty array to avoid validation errors
        },
        base_appreciation_rate: formData.base_appreciation_rate,
        appreciation_volatility: formData.appreciation_volatility,
        base_default_rate: formData.base_default_rate,
        default_volatility: formData.default_volatility,
        correlation: formData.correlation,
        avg_loan_size: formData.avg_loan_size,
        loan_size_std_dev: formData.loan_size_std_dev,
        min_loan_size: formData.min_loan_size,
        max_loan_size: formData.max_loan_size,
        avg_loan_term: formData.avg_loan_term,
        avg_loan_interest_rate: formData.avg_loan_interest_rate,
        avg_loan_ltv: formData.avg_loan_ltv,
        zone_allocations: formData.zone_allocations,
        management_fee_rate: formData.management_fee_rate,
        management_fee_basis: formData.management_fee_basis,
        distribution_frequency: formData.distribution_frequency,
        distribution_policy: formData.distribution_policy,
        reinvestment_period: formData.reinvestment_period,
        avg_loan_exit_year: formData.avg_loan_exit_year,
        exit_year_std_dev: formData.exit_year_std_dev,
        early_exit_probability: formData.early_exit_probability,
        force_exit_within_fund_term: formData.force_exit_within_fund_term,
        num_simulations: formData.num_simulations,
        variation_factor: formData.variation_factor,
        monte_carlo_seed: formData.monte_carlo_seed,
        optimization_objective: formData.optimization_objective,
        risk_free_rate: formData.risk_free_rate,
        min_allocation: formData.min_allocation,
        max_allocation: formData.max_allocation,
        stress_config: formData.stress_config,
        report_config: formData.report_config
      };

      console.log('Filtered form data:', filteredFormData);

      if (runDual) {
        // Fire both simulations in parallel for speed
        [mainResult, controlResult] = await Promise.all([
          simulationSDK.createSimulation(filteredFormData),
          simulationSDK.createSimulation(buildUnlevered(filteredFormData)),
        ]);

        log(LogLevel.INFO, LogCategory.UI, 'Dual simulations created', { mainResult, controlResult });

        if (mainResult?.simulationId && controlResult?.simulationId) {
          // Navigate to the main (levered) simulation results and pass the unlevered ID as a query param
          navigate(`/results/${mainResult.simulationId}?unlevered=${controlResult.simulationId}`);
        } else if (mainResult?.simulationId) {
          navigate(`/results/${mainResult.simulationId}`);
        } else {
          navigate('/results');
        }
      } else {
        mainResult = await simulationSDK.createSimulation(formData);
        log(LogLevel.INFO, LogCategory.UI, 'Simulation created', mainResult);
        if (mainResult?.simulationId) {
          navigate(`/results/${mainResult.simulationId}`);
        } else {
          navigate('/results');
        }
      }
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.UI, 'Form submission failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPreset = (preset: 'default' | '100m') => {
    try {
      let presetConfig;
      if (preset === 'default') {
        presetConfig = getDefaultPreset();
        log(LogLevel.INFO, LogCategory.UI, 'Loading default preset', presetConfig);
        localStorage.setItem('activePreset', 'default');
      } else if (preset === '100m') {
        presetConfig = get100MPreset();
        log(LogLevel.INFO, LogCategory.UI, 'Loading 100M preset', presetConfig);
        localStorage.setItem('activePreset', '100m');
      }

      // Reset the form with the preset values
      methods.reset(presetConfig);

      // Force update all fields
      Object.keys(presetConfig).forEach(key => {
        console.log(`Setting ${key} to:`, presetConfig[key]);
        methods.setValue(key, presetConfig[key]);
      });

      // Explicitly set the advanced parameters
      console.log('Explicitly setting advanced parameters');
      methods.setValue('optimization_enabled', true);
      methods.setValue('generate_efficient_frontier', true);
      methods.setValue('stress_testing_enabled', true);
      methods.setValue('external_data_enabled', true);
      methods.setValue('generate_reports', true);
      methods.setValue('gp_entity_enabled', true);
      methods.setValue('aggregate_gp_economics', true);
      methods.setValue('run_dual_leverage_comparison', true);

      // Log specific fields we're concerned about
      const formValues = methods.getValues();
      log(LogLevel.INFO, LogCategory.UI, 'Form values after preset load', {
        monte_carlo_enabled: formValues.monte_carlo_enabled,
        inner_monte_carlo_enabled: formValues.inner_monte_carlo_enabled,
        vintage_var_enabled: formValues.vintage_var_enabled,
        optimization_enabled: formValues.optimization_enabled,
        generate_efficient_frontier: formValues.generate_efficient_frontier,
        stress_testing_enabled: formValues.stress_testing_enabled,
        external_data_enabled: formValues.external_data_enabled,
        generate_reports: formValues.generate_reports,
        gp_entity_enabled: formValues.gp_entity_enabled,
        aggregate_gp_economics: formValues.aggregate_gp_economics,
        run_dual_leverage_comparison: formValues.run_dual_leverage_comparison
      });
    } catch (error) {
      log(LogLevel.ERROR, LogCategory.UI, `Error loading preset ${preset}:`, error);
    }
  };

  const value = {
    currentStep,
    totalSteps,
    stepTitles,
    goToStep,
    goToNextStep,
    goToPreviousStep,
    isLastStep: currentStep === totalSteps - 1,
    isFirstStep: currentStep === 0,
    resetForm,
    submitForm,
    loadPreset,
    isSubmitting,
    formState: methods.formState,
  };

  return (
    <WizardContext.Provider value={value}>
      <FormProvider {...methods}>{children}</FormProvider>
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
