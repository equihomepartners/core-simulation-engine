import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';
import { useFormContext } from 'react-hook-form';
import { useLeveragePreview } from '@/hooks/useLeveragePreview';
import { LeveragePreviewChips } from '@/components/wizard/leverage-preview-chips';

export function AdvancedStep() {
  const { watch, setValue } = useFormContext();
  // Gather minimal inputs for preview
  const fundSize = watch('fund_size');
  const leverageBlock = watch('leverage');
  const navByYear = fundSize ? { 0: 0, 1: fundSize, 2: fundSize } : null;
  const metrics = useLeveragePreview(navByYear, leverageBlock);

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
            defaultValue={false}
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
        </div>
      </FormSection>

      {/* Leverage Capital Structure ------------------------------------------------*/}
      <FormSection
        title="Leverage – Capital Structure"
        description="Configure NAV facility, ramp line and deal-level notes"
        defaultExpanded={false}
      >
        {/* Preset strategy helper */}
        <div className="mb-2">
          <button
            type="button"
            className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => {
              /* Apply the five-stage leverage roadmap preset */
              setValue('leverage.green_sleeve.enabled', true);
              setValue('leverage.green_sleeve.max_mult', 1.25); // stage 2 default
              setValue('leverage.green_sleeve.spread_bps', 250);
              setValue('leverage.green_sleeve.commitment_fee_bps', 40);

              // Enable A+ over-advance but will be toggled by dynamic rule later
              setValue('leverage.a_plus_overadvance.enabled', false);
              setValue('leverage.a_plus_overadvance.advance_rate', 0.7);

              // Ramp line disabled for now – pure NAV facility path
              setValue('leverage.ramp_line.enabled', false);

              // Define dynamic_rules JSON
              const dynRules = [
                { start_year: 0, end_year: 1, 'green_sleeve.enabled': false },
                { start_year: 1, end_year: 2, 'green_sleeve.enabled': true, 'green_sleeve.max_mult': 1.25 },
                { start_year: 2, end_year: 3, 'green_sleeve.max_mult': 1.5 },
                { start_year: 2, end_year: 4, 'a_plus_overadvance.enabled': true, 'green_sleeve.max_mult': 1.8 },
              ];
              setValue('leverage.dynamic_rules', dynRules);
            }}
          >
            Apply Recommended 5-Stage Leverage Strategy
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Green-sleeve NAV facility */}
          <ParameterField name="leverage.green_sleeve.enabled" label="Enable NAV Facility" type="switch" defaultValue={true} />
          <ParameterField name="leverage.green_sleeve.max_mult" label="Max Multiple (×NAV)" type="number" min={0} max={2} step={0.1} defaultValue={1.5} />
          <ParameterField name="leverage.green_sleeve.spread_bps" label="Spread (bps)" type="number" min={0} max={1000} step={5} defaultValue={275} />
          <ParameterField name="leverage.green_sleeve.commitment_fee_bps" label="Commitment Fee (bps)" type="number" min={0} max={200} step={5} defaultValue={50} />

          {/* Over-Advance */}
          <ParameterField name="leverage.a_plus_overadvance.enabled" label="Enable Over-Advance (A+)" type="switch" defaultValue={false} />
          <ParameterField name="leverage.a_plus_overadvance.advance_rate" label="Advance Rate (0-1)" type="number" min={0} max={1} step={0.05} defaultValue={0.75} />

          {/* Deal-level note */}
          <ParameterField name="leverage.deal_note.enabled" label="Enable Deal Note" type="switch" defaultValue={false} />
          <ParameterField name="leverage.deal_note.note_pct" label="Note % of Value" type="number" min={0} max={1} step={0.05} defaultValue={0.3} />
          <ParameterField name="leverage.deal_note.note_rate" label="Note Rate (decimal)" type="number" min={0} max={0.15} step={0.005} defaultValue={0.07} />

          {/* Ramp Line */}
          <ParameterField name="leverage.ramp_line.enabled" label="Enable Ramp Line" type="switch" defaultValue={false} />
          <ParameterField name="leverage.ramp_line.limit_pct_commit" label="Ramp Limit % Commit" type="number" min={0} max={0.3} step={0.01} defaultValue={0.15} />
          <ParameterField name="leverage.ramp_line.draw_period_months" label="Draw Period (months)" type="number" min={1} max={36} step={1} defaultValue={24} />
          <ParameterField name="leverage.ramp_line.spread_bps" label="Ramp Spread (bps)" type="number" min={0} max={1000} step={5} defaultValue={300} />
        </div>

        {/* Dynamic rules advanced editor – object textarea */}
        <div className="mt-4">
          <ParameterField
            name="leverage.dynamic_rules"
            label="Dynamic Leverage Rules (JSON)"
            type="object"
            placeholder='[{ "trigger": "irr_p50 < 0.09", "action": "green_sleeve.max_mult += 0.25" }]'
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
            defaultValue={false}
          />
          <ParameterField
            name="stress_testing_enabled"
            label="Enable Stress Testing"
            tooltip="Whether to enable stress testing"
            type="switch"
            defaultValue={false}
          />
          <ParameterField
            name="external_data_enabled"
            label="Enable External Data"
            tooltip="Whether to use external data sources"
            type="switch"
            defaultValue={false}
          />
          <ParameterField
            name="generate_reports"
            label="Generate Reports"
            tooltip="Whether to generate reports"
            type="switch"
            defaultValue={true}
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
            defaultValue={false}
          />
          <ParameterField
            name="aggregate_gp_economics"
            label="Aggregate GP Economics"
            tooltip="Whether to aggregate GP economics across funds"
            type="switch"
            defaultValue={true}
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

      {/* Dual-run toggle */}
      <FormSection
        title="Leverage Comparison"
        description="Optionally run an un-levered simulation alongside the levered scenario for side-by-side metrics."
        defaultExpanded={false}
      >
        <ParameterField
          name="run_dual_leverage_comparison"
          label="Run Levered vs Unlevered Comparison"
          type="switch"
          defaultValue={false}
        />
      </FormSection>

      {/* Live preview chips */}
      <LeveragePreviewChips metrics={metrics} />
    </WizardStep>
  );
}
