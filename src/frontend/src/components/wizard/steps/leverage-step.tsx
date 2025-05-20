import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFormContext } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { usePresetValues } from '@/hooks/usePresetValues';

export function LeverageStep() {
  const { watch, setValue } = useFormContext();

  // Use the preset values hook to set the form values
  usePresetValues();

  // Calculate leverage preview
  const calculateLeveragePreview = () => {
    const greenSleeveEnabled = watch('leverage.green_sleeve.enabled') || false;
    const greenSleeveMaxMult = watch('leverage.green_sleeve.max_mult') || 1.5;
    const dealNoteEnabled = watch('leverage.deal_note.enabled') || false;
    const dealNotePct = watch('leverage.deal_note.note_pct') || 0.3;
    const rampLineEnabled = watch('leverage.ramp_line.enabled') || false;
    const rampLinePct = watch('leverage.ramp_line.limit_pct_commit') || 0.15;
    const fundSize = watch('fund_size') || 100000000;

    let totalLeverage = 1.0; // Base unlevered
    let leverageBreakdown = [];

    if (greenSleeveEnabled) {
      totalLeverage *= greenSleeveMaxMult;
      leverageBreakdown.push({
        name: 'Green Sleeve NAV',
        value: `${((greenSleeveMaxMult - 1) * 100).toFixed(1)}%`,
        color: 'bg-green-100 text-green-800'
      });
    }

    if (dealNoteEnabled) {
      const dealNoteEffect = 1 + dealNotePct;
      totalLeverage *= dealNoteEffect;
      leverageBreakdown.push({
        name: 'Deal Notes',
        value: `${(dealNotePct * 100).toFixed(1)}%`,
        color: 'bg-blue-100 text-blue-800'
      });
    }

    if (rampLineEnabled) {
      const rampLineEffect = 1 + rampLinePct;
      totalLeverage *= rampLineEffect;
      leverageBreakdown.push({
        name: 'Ramp Line',
        value: `${(rampLinePct * 100).toFixed(1)}%`,
        color: 'bg-purple-100 text-purple-800'
      });
    }

    const effectiveFundSize = fundSize * totalLeverage;

    return {
      totalLeverage,
      effectiveFundSize,
      leverageBreakdown
    };
  };

  const leveragePreview = calculateLeveragePreview();

  return (
    <WizardStep
      title="Leverage Configuration"
      description="Configure fund leverage options"
    >
      {/* Leverage Preview */}
      <Card className="mb-6 bg-slate-50">
        <CardHeader className="pb-2">
          <CardTitle>Leverage Preview</CardTitle>
          <CardDescription>
            Effective fund size with leverage: ${(leveragePreview.effectiveFundSize / 1000000).toFixed(1)}M
            ({(leveragePreview.totalLeverage).toFixed(2)}x)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {leveragePreview.leverageBreakdown.map((item, index) => (
              <Badge key={index} variant="outline" className={item.color}>
                {item.name}: {item.value}
              </Badge>
            ))}
            {leveragePreview.leverageBreakdown.length === 0 && (
              <Badge variant="outline" className="bg-gray-100 text-gray-800">
                No leverage enabled
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <FormSection
        title="Green Sleeve NAV Facility"
        description="Configure NAV facility for green zone loans"
      >
        {/* Preset strategy helper */}
        <div className="mb-2">
          <button
            type="button"
            className="px-3 py-1 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => {
              const { setValue } = useFormContext();
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
          <ParameterField
            name="leverage.green_sleeve.enabled"
            label="Enable Green Sleeve"
            tooltip="Enable NAV facility for green zone loans"
            type="switch"
            defaultValue={true}
          />
          <ParameterField
            name="leverage.green_sleeve.max_mult"
            label="Maximum Multiplier"
            tooltip="Maximum leverage multiplier on NAV"
            type="number"
            min={1}
            max={3}
            step={0.1}
            defaultValue={1.5}
          />
          <ParameterField
            name="leverage.green_sleeve.spread_bps"
            label="Spread (bps)"
            tooltip="Spread in basis points"
            type="number"
            min={0}
            max={1000}
            step={25}
            defaultValue={275}
          />
          <ParameterField
            name="leverage.green_sleeve.commitment_fee_bps"
            label="Commitment Fee (bps)"
            tooltip="Commitment fee in basis points"
            type="number"
            min={0}
            max={200}
            step={5}
            defaultValue={50}
          />
        </div>
      </FormSection>

      <FormSection
        title="A+ Overadvance"
        description="Configure overadvance for A+ rated properties"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="leverage.a_plus_overadvance.enabled"
            label="Enable A+ Overadvance"
            tooltip="Enable overadvance for A+ rated properties"
            type="switch"
            defaultValue={false}
          />
          <ParameterField
            name="leverage.a_plus_overadvance.tls_grade"
            label="TLS Grade"
            tooltip="Traffic Light System grade for overadvance"
            type="select"
            options={[
              { value: 'A+', label: 'A+' },
              { value: 'A', label: 'A' },
              { value: 'A-', label: 'A-' },
            ]}
            defaultValue="A+"
          />
          <ParameterField
            name="leverage.a_plus_overadvance.advance_rate"
            label="Advance Rate"
            tooltip="Advance rate for A+ rated properties"
            type="number"
            min={0.5}
            max={0.9}
            step={0.05}
            defaultValue={0.75}
          />
        </div>
      </FormSection>

      <FormSection
        title="Deal Note"
        description="Configure deal-level notes"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="leverage.deal_note.enabled"
            label="Enable Deal Notes"
            tooltip="Enable deal-level notes"
            type="switch"
            defaultValue={false}
          />
          <ParameterField
            name="leverage.deal_note.note_pct"
            label="Note Percentage"
            tooltip="Percentage of deal as note"
            type="number"
            min={0.1}
            max={0.5}
            step={0.05}
            defaultValue={0.3}
          />
          <ParameterField
            name="leverage.deal_note.note_rate"
            label="Note Rate"
            tooltip="Interest rate for notes"
            type="number"
            min={0.01}
            max={0.15}
            step={0.01}
            defaultValue={0.07}
          />
        </div>
      </FormSection>

      <FormSection
        title="Ramp Line"
        description="Configure ramp line for deployment"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="leverage.ramp_line.enabled"
            label="Enable Ramp Line"
            tooltip="Enable ramp line for deployment"
            type="switch"
            defaultValue={false}
          />
          <ParameterField
            name="leverage.ramp_line.limit_pct_commit"
            label="Limit (% of Committed)"
            tooltip="Limit as percentage of committed capital"
            type="number"
            min={0.05}
            max={0.3}
            step={0.05}
            defaultValue={0.15}
          />
          <ParameterField
            name="leverage.ramp_line.draw_period_months"
            label="Draw Period (months)"
            tooltip="Draw period in months"
            type="number"
            min={6}
            max={36}
            step={6}
            defaultValue={24}
          />
          <ParameterField
            name="leverage.ramp_line.spread_bps"
            label="Spread (bps)"
            tooltip="Spread in basis points"
            type="number"
            min={0}
            max={1000}
            step={25}
            defaultValue={300}
          />
        </div>
      </FormSection>

      <FormSection
        title="Dynamic Rules"
        description="Configure dynamic leverage rules"
        defaultExpanded={false}
      >
        <div className="grid grid-cols-1 gap-4">
          <ParameterField
            name="leverage.dynamic_rules"
            label="Dynamic Rules"
            tooltip="Rules for dynamically adjusting leverage"
            type="array"
            placeholder="Enter dynamic rules..."
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
        />
      </FormSection>
    </WizardStep>
  );
}
