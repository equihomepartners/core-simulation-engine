import React from 'react';
import { useFormContext } from 'react-hook-form';
import { WizardStep } from '@/components/wizard/wizard-step';
import { ReviewSection } from '@/components/wizard/review-section';
import { Button } from '@/components/ui/button';
import { useWizard } from '@/contexts/wizard-context';
import { wizardSteps } from '@/schemas/simulation-schema';

export function ReviewStep() {
  const { getValues } = useFormContext();
  const { goToStep } = useWizard();
  const values = getValues();

  return (
    <WizardStep
      title="Review"
      description="Review your simulation configuration before submitting"
    >
      <div className="space-y-6">
        <ReviewSection
          title="Fund Structure"
          description="Basic fund parameters"
          fields={[
            { name: 'fund_size', label: 'Fund Size', type: 'currency' },
            { name: 'fund_term', label: 'Fund Term', type: 'number' },
            { name: 'fund_id', label: 'Fund ID', type: 'text' },
            { name: 'fund_group', label: 'Fund Group', type: 'text' },
            { name: 'tranche_id', label: 'Tranche ID', type: 'text' },
          ]}
          onEdit={() => goToStep(0)}
        />

        <ReviewSection
          title="Fees & Expenses"
          description="Management fees and fund expenses"
          fields={[
            { name: 'management_fee_rate', label: 'Management Fee Rate', type: 'percentage' },
            { name: 'management_fee_basis', label: 'Management Fee Basis', type: 'text' },
            { name: 'management_fee_step_down', label: 'Step Down Management Fees', type: 'boolean' },
            { name: 'management_fee_step_down_year', label: 'Step Down Year', type: 'number' },
            { name: 'management_fee_step_down_rate', label: 'Step Down Rate', type: 'percentage' },
            { name: 'expense_rate', label: 'Expense Rate', type: 'percentage' },
            { name: 'formation_costs', label: 'Formation Costs', type: 'currency' },
          ]}
          onEdit={() => goToStep(1)}
        />

        <ReviewSection
          title="Deployment"
          description="Capital deployment and capital calls"
          fields={[
            { name: 'deployment_pace', label: 'Deployment Pace', type: 'text' },
            { name: 'deployment_period', label: 'Deployment Period', type: 'number' },
            { name: 'deployment_period_unit', label: 'Deployment Period Unit', type: 'text' },
            { name: 'deployment_monthly_granularity', label: 'Monthly Granularity', type: 'boolean' },
            { name: 'capital_call_schedule', label: 'Capital Call Schedule', type: 'text' },
            { name: 'capital_call_years', label: 'Capital Call Years', type: 'number' },
          ]}
          onEdit={() => goToStep(2)}
        />

        <ReviewSection
          title="Reinvestment & Exit"
          description="Reinvestment strategy and exit parameters"
          fields={[
            { name: 'reinvestment_period', label: 'Reinvestment Period', type: 'number' },
            { name: 'reinvestment_rate', label: 'Reinvestment Rate', type: 'percentage' },
            { name: 'reinvestment_reserve_rate', label: 'Reinvestment Reserve Rate', type: 'percentage' },
            { name: 'avg_loan_exit_year', label: 'Average Loan Exit Year', type: 'number' },
            { name: 'exit_year_std_dev', label: 'Exit Year Standard Deviation', type: 'number' },
            { name: 'early_exit_probability', label: 'Early Exit Probability', type: 'percentage' },
          ]}
          onEdit={() => goToStep(3)}
        />

        <ReviewSection
          title="Waterfall"
          description="Waterfall structure and returns"
          fields={[
            { name: 'waterfall_structure', label: 'Waterfall Structure', type: 'text' },
            { name: 'hurdle_rate', label: 'Hurdle Rate', type: 'percentage' },
            { name: 'catch_up_rate', label: 'Catch-up Rate', type: 'percentage' },
            { name: 'catch_up_structure', label: 'Catch-up Structure', type: 'text' },
            { name: 'carried_interest_rate', label: 'Carried Interest Rate', type: 'percentage' },
            { name: 'gp_commitment_percentage', label: 'GP Commitment Percentage', type: 'percentage' },
            { name: 'preferred_return_compounding', label: 'Preferred Return Compounding', type: 'text' },
            { name: 'distribution_frequency', label: 'Distribution Frequency', type: 'text' },
            { name: 'distribution_policy', label: 'Distribution Policy', type: 'text' },
            { name: 'clawback_provision', label: 'Clawback Provision', type: 'boolean' },
            { name: 'management_fee_offset_percentage', label: 'Management Fee Offset Percentage', type: 'percentage' },
          ]}
          onEdit={() => goToStep(4)}
        />

        <ReviewSection
          title="Market & Loans"
          description="Market conditions and loan parameters"
          fields={[
            { name: 'avg_loan_size', label: 'Average Loan Size', type: 'currency' },
            { name: 'loan_size_std_dev', label: 'Loan Size Standard Deviation', type: 'currency' },
            { name: 'min_loan_size', label: 'Minimum Loan Size', type: 'currency' },
            { name: 'max_loan_size', label: 'Maximum Loan Size', type: 'currency' },
            { name: 'avg_loan_term', label: 'Average Loan Term', type: 'number' },
            { name: 'avg_loan_interest_rate', label: 'Average Loan Interest Rate', type: 'percentage' },
            { name: 'avg_loan_ltv', label: 'Average Loan LTV', type: 'percentage' },
            { name: 'zone_allocations', label: 'Zone Allocations', type: 'object' },
          ]}
          onEdit={() => goToStep(5)}
        />

        <ReviewSection
          title="Advanced"
          description="Advanced analytics and reporting"
          fields={[
            { name: 'monte_carlo_enabled', label: 'Enable Monte Carlo Simulation', type: 'boolean' },
            { name: 'num_simulations', label: 'Number of Simulations', type: 'number' },
            { name: 'variation_factor', label: 'Variation Factor', type: 'percentage' },
            { name: 'optimization_enabled', label: 'Enable Portfolio Optimization', type: 'boolean' },
            { name: 'stress_testing_enabled', label: 'Enable Stress Testing', type: 'boolean' },
            { name: 'external_data_enabled', label: 'Enable External Data', type: 'boolean' },
            { name: 'generate_reports', label: 'Generate Reports', type: 'boolean' },
            { name: 'gp_entity_enabled', label: 'Enable GP Entity Economics', type: 'boolean' },
            { name: 'aggregate_gp_economics', label: 'Aggregate GP Economics', type: 'boolean' },
          ]}
          onEdit={() => goToStep(6)}
        />

        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              // Download configuration as JSON
              const config = getValues();
              const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'simulation-config.json';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Configuration
          </Button>
        </div>
      </div>
    </WizardStep>
  );
}
