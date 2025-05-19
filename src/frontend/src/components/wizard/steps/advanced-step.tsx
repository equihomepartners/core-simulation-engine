import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';
import { useFormContext } from 'react-hook-form';
import { useLeveragePreview } from '@/hooks/useLeveragePreview';
import { LeveragePreviewChips } from '@/components/wizard/leverage-preview-chips';
import { usePresetValues } from '@/hooks/usePresetValues';

export function AdvancedStep() {
  const { watch } = useFormContext();
  // Gather minimal inputs for preview
  const fundSize = watch('fund_size');
  const leverageBlock = watch('leverage');
  const navByYear = fundSize ? { 0: 0, 1: fundSize, 2: fundSize } : null;
  const metrics = useLeveragePreview(navByYear, leverageBlock);

  // Use the preset values hook to set the form values
  usePresetValues();

  // Get the current values for the advanced parameters
  const monteCarloEnabled = watch('monte_carlo_enabled');
  const innerMonteCarloEnabled = watch('inner_monte_carlo_enabled');
  const vintageVarEnabled = watch('vintage_var_enabled');
  const optimizationEnabled = watch('optimization_enabled');
  const generateEfficientFrontier = watch('generate_efficient_frontier');
  const stressTestingEnabled = watch('stress_testing_enabled');
  const externalDataEnabled = watch('external_data_enabled');
  const generateReports = watch('generate_reports');
  const gpEntityEnabled = watch('gp_entity_enabled');
  const aggregateGpEconomics = watch('aggregate_gp_economics');

  console.log('Advanced parameters:', {
    monteCarloEnabled,
    innerMonteCarloEnabled,
    vintageVarEnabled,
    optimizationEnabled,
    generateEfficientFrontier,
    stressTestingEnabled,
    externalDataEnabled,
    generateReports,
    gpEntityEnabled,
    aggregateGpEconomics
  });

  return (
    <WizardStep
      title="Advanced"
      description="Configure advanced analytics and reporting"
    >
      <FormSection
        title="Monte Carlo Simulation"
        description="Configure Monte Carlo simulation parameters"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="monte_carlo_enabled"
            label="Enable Monte Carlo Simulation"
            tooltip="Whether to enable Monte Carlo simulation"
            type="switch"
          />
          <ParameterField
            name="num_simulations"
            label="Number of Simulations"
            tooltip="The number of Monte Carlo simulations to run"
            type="number"
            min={10}
            max={10000}
            step={10}
            defaultValue={1000}
          />
          <ParameterField
            name="variation_factor"
            label="Variation Factor"
            tooltip="The parameter variation factor for Monte Carlo simulation (0-1)"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.1}
          />
          <ParameterField
            name="monte_carlo_seed"
            label="Monte Carlo Seed"
            tooltip="The random seed for Monte Carlo simulation (for reproducibility)"
            type="number"
            min={0}
            step={1}
            placeholder="Random seed (optional)"
          />
          <ParameterField
            name="inner_monte_carlo_enabled"
            label="Enable Inner Monte Carlo"
            tooltip="Enable nested Monte Carlo simulations for variance analysis"
            type="switch"
          />
          <ParameterField
            name="num_inner_simulations"
            label="Inner Simulation Runs"
            tooltip="Number of inner Monte Carlo simulations per outer iteration"
            type="number"
            min={1}
            max={1000}
            step={1}
            defaultValue={100}
          />
          <ParameterField
            name="vintage_var_enabled"
            label="Enable Vintage VaR"
            tooltip="Enable vintage-based Value at Risk analysis"
            type="switch"
          />
        </div>
      </FormSection>

      <FormSection
        title="Default Correlation"
        description="Set correlation assumptions for loan defaults"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="default_correlation.enabled"
            label="Enable Default Correlation"
            type="switch"
            defaultValue={true}
          />
          <ParameterField
            name="default_correlation.same_zone"
            label="Same Zone Correlation"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.3}
          />
          <ParameterField
            name="default_correlation.cross_zone"
            label="Cross Zone Correlation"
            type="percentage"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.1}
          />
        </div>
      </FormSection>
      <FormSection
        title="Lifecycle Timing"
        description="Advanced exit timing parameters"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="exit_year_max_std_dev"
            label="Exit Year Max Std Dev Multiplier"
            type="number"
            min={1}
            max={5}
            step={0.1}
            defaultValue={3}
          />
        </div>
      </FormSection>

      <FormSection
        title="Default Correlation"
        description="Model correlation of defaults across zones"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="default_correlation.enabled"
            label="Enable Default Correlation"
            type="switch"
            defaultValue={true}
          />
          <ParameterField
            name="default_correlation.same_zone"
            label="Same Zone Correlation"
            type="slider"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.3}
          />
          <ParameterField
            name="default_correlation.cross_zone"
            label="Cross Zone Correlation"
            type="slider"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.1}
          />
        </div>
      </FormSection>

      <FormSection
        title="Zone Rebalancing"
        description="Control automatic zone allocation rebalancing"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="zone_rebalancing_enabled"
            label="Enable Zone Rebalancing"
            type="switch"
            defaultValue={true}
          />
          <ParameterField
            name="rebalancing_strength"
            label="Rebalancing Strength"
            type="slider"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.5}
          />
          <ParameterField
            name="zone_drift_threshold"
            label="Zone Drift Threshold"
            type="slider"
            min={0}
            max={0.5}
            step={0.01}
            defaultValue={0.1}
          />
          <ParameterField
            name="zone_allocation_precision"
            label="Zone Allocation Precision"
            type="slider"
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.8}
          />
        </div>
      </FormSection>

      <FormSection
        title="Lifecycle Timing"
        description="Fine-tune exit year assumptions"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="exit_year_max_std_dev"
            label="Exit Year Max Std Dev Multiplier"
            type="number"
            min={1}
            max={5}
            step={0.1}
            defaultValue={3}
          />
        </div>
      </FormSection>

      <FormSection
        title="Other Advanced Features"
        description="Configure other advanced features"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="optimization_enabled"
            label="Enable Portfolio Optimization"
            tooltip="Whether to enable portfolio optimization"
            type="switch"
          />
          <ParameterField
            name="generate_efficient_frontier"
            label="Generate Efficient Frontier"
            tooltip="Generate efficient frontier during optimization"
            type="switch"
          />
          <ParameterField
            name="efficient_frontier_points"
            label="Efficient Frontier Points"
            tooltip="Number of points for efficient frontier curve"
            type="number"
            min={1}
            step={1}
            defaultValue={50}
          />
          <ParameterField
            name="stress_testing_enabled"
            label="Enable Stress Testing"
            tooltip="Whether to enable stress testing"
            type="switch"
          />
          <ParameterField
            name="external_data_enabled"
            label="Enable External Data"
            tooltip="Whether to use external data sources"
            type="switch"
          />
          <ParameterField
            name="generate_reports"
            label="Generate Reports"
            tooltip="Whether to generate reports"
            type="switch"
          />
        </div>
      </FormSection>

      <FormSection
        title="GP Entity Economics"
        description="Configure GP entity economics"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="gp_entity_enabled"
            label="Enable GP Entity Economics"
            tooltip="Whether to enable GP entity economics"
            type="switch"
          />
          <ParameterField
            name="aggregate_gp_economics"
            label="Aggregate GP Economics"
            tooltip="Whether to aggregate GP economics across funds"
            type="switch"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4">
          <ParameterField
            name="gp_entity"
            label="GP Entity Configuration"
            tooltip="GP entity configuration (advanced)"
            type="object"
            placeholder="Enter GP entity configuration..."
          />
        </div>
      </FormSection>

      <FormSection
        title="Advanced Configuration"
        description="Configure advanced report and stress test parameters"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 gap-4">
          <ParameterField
            name="report_config"
            label="Report Configuration"
            tooltip="Report generation configuration (advanced)"
            type="object"
            placeholder="Enter report configuration..."
          />
          <ParameterField
            name="stress_config"
            label="Stress Test Configuration"
            tooltip="Stress testing configuration (advanced)"
            type="object"
            placeholder="Enter stress test configuration..."
          />
        </div>
      </FormSection>
    </WizardStep>
  );
}
