# 100M Fund Preset Audit and Improvement Plan

This document provides a comprehensive audit of the current 100M fund preset implementation and outlines specific recommendations for improvements to ensure all parameters from the schema are properly utilized.

## 1. Missing Parameters

The 100M preset is missing many parameters that are available in the schema, particularly around advanced features.

### Current Issues:

- **Advanced Analytics Parameters**: Monte Carlo simulation, optimization, and stress testing parameters are not configured in the preset
- **Leverage Parameters**: No configuration for NAV facility, ramp line, and deal-level notes
- **GP Entity Parameters**: No configuration for GP entity economics
- **Correlation Parameters**: Default correlation settings are not specified
- **Zone Allocation Precision**: Not specified in the preset
- **Exit Timing Parameters**: Several exit timing parameters are missing

### Recommended Fixes:

```typescript
// Add these parameters to the 100M preset in src/frontend/src/presets/index.ts

// Advanced Analytics Parameters
monte_carlo_enabled: true,
num_simulations: 1000,
inner_monte_carlo_enabled: false,
num_inner_simulations: 100,
variation_factor: 0.1,
monte_carlo_seed: null,
bootstrap_enabled: false,
bootstrap_iterations: 1000,
grid_stress_enabled: false,
grid_stress_steps: 5,
grid_stress_axes: ["base_appreciation_rate", "base_default_rate"],
vintage_var_enabled: false,
optimization_enabled: false,
stress_testing_enabled: false,
external_data_enabled: false,
generate_reports: true,

// Leverage Parameters
leverage: {
  green_sleeve: {
    enabled: true,
    max_mult: 1.5,
    spread_bps: 275,
    commitment_fee_bps: 50,
  },
  a_plus_overadvance: {
    enabled: false,
    tls_grade: 'A+',
    advance_rate: 0.75,
  },
  deal_note: {
    enabled: false,
    note_pct: 0.3,
    note_rate: 0.07,
  },
  ramp_line: {
    enabled: false,
    limit_pct_commit: 0.15,
    draw_period_months: 24,
    spread_bps: 300,
  },
  dynamic_rules: [],
},

// GP Entity Parameters
gp_entity_enabled: false,
aggregate_gp_economics: true,
gp_entity: {
  name: "Equihome Partners",
  management_company: {
    operating_expenses: 2000000,
    revenue_share_percentage: 0.5,
    team_size: 10,
  },
  team_allocation: {
    senior_partners: 0.6,
    junior_partners: 0.3,
    associates: 0.1,
  },
  gp_commitment_percentage: 0.0,
  cross_fund_carry: false,
  cashflow_frequency: "yearly",
  initial_cash_reserve: 0,
},

// Correlation Parameters
correlation: 0.3,
default_correlation: {
  same_zone: 0.3,
  cross_zone: 0.1,
  enabled: true,
},

// Zone Allocation Precision
zone_allocation_precision: 0.8,

// Exit Timing Parameters
exit_year_skew: 0,
min_holding_period: 0.25,
exit_year_max_std_dev: 3,
```

## 2. Naming Inconsistencies

There are naming inconsistencies between the preset and the schema that could lead to confusion.

### Current Issues:

- Preset uses `zone_targets` but schema uses `zone_allocations`
- Preset includes `interest_rate` which isn't in the schema (schema uses `avg_loan_interest_rate`)
- Preset includes parameters like `enable_reinvestments`, `enable_defaults`, etc. which don't appear in the schema directly

### Recommended Fixes:

```typescript
// In src/frontend/src/presets/index.ts, replace:
zone_targets: {
  green: 0.5,
  orange: 0.3,
  red: 0.2,
},

// With:
zone_allocations: {
  green: 0.5,
  orange: 0.3,
  red: 0.2,
},

// Remove interest_rate (duplicate of avg_loan_interest_rate)
// Remove enable_reinvestments, enable_defaults, enable_early_repayments, enable_appreciation
// Instead, use the schema-defined parameters:
reinvestment_rate: 0.8, // This replaces enable_reinvestments
default_rates: {
  green: 0.01,
  orange: 0.03,
  red: 0.05
}, // This replaces enable_defaults
early_exit_probability: 0.1, // This replaces enable_early_repayments
appreciation_rates: {
  green: 0.03,
  orange: 0.04,
  red: 0.05
}, // This replaces enable_appreciation
```

## 3. Default Values

For parameters not explicitly set in the preset, the system falls back to default values from the schema, which might not be optimal for a $100M fund.

### Current Issues:

- Many parameters use default values that may not be appropriate for a $100M fund
- The preset doesn't explicitly set all relevant parameters, leading to inconsistent behavior

### Recommended Fixes:

- Explicitly set all parameters in the preset, even if they match the defaults
- Review and adjust default values specifically for the $100M fund size

```typescript
// Add explicit values for all parameters in src/frontend/src/presets/index.ts
// Example of parameters that should be explicitly set:
ltv_std_dev: 0.05,
min_ltv: 0.5,
max_ltv: 0.9,
base_appreciation_rate: 0.03,
appreciation_volatility: 0.02,
base_default_rate: 0.01,
default_volatility: 0.005,
discount_rate: 0.08,
risk_free_rate: 0.03,
```

## 4. Sydney Suburb Data

The preset doesn't include any Sydney suburb data configuration, which was mentioned as an important requirement.

### Current Issues:

- No configuration for Sydney suburb data in the preset
- No clear way to select between Mock and production data sources in the preset
- Missing metadata for each zone used for loans

### Recommended Fixes:

```typescript
// Add Sydney suburb data configuration to the preset in src/frontend/src/presets/index.ts
geo_strategy: "profile", // Use profile-based strategy for suburb allocation
use_tls_zone_growth: true, // Use TLS data for zone growth rates
zone_profiles: {
  "Sydney-Green": {
    ids: ["2000", "2010", "2011", "2060", "2061"], // Sydney CBD and Eastern Suburbs
    weight: 0.5
  },
  "Sydney-Orange": {
    ids: ["2170", "2200", "2204", "2208", "2213"], // Inner West and South Sydney
    weight: 0.3
  },
  "Sydney-Red": {
    ids: ["2145", "2150", "2160", "2161", "2166"], // Western Sydney
    weight: 0.2
  }
},
risk_weight_table: {
  // Override risk weights for specific suburbs if needed
  "2000": 0.8, // Sydney CBD
  "2010": 0.85, // Surry Hills
  "2170": 0.6, // Liverpool
  "2145": 0.4, // Westmead
},
```

## 5. Leverage Configuration

The preset doesn't configure any of the leverage options that are available in the schema.

### Current Issues:

- No configuration for NAV facility, ramp line, and deal-level notes
- Missing important leverage parameters that could significantly impact fund performance

### Recommended Fixes:

```typescript
// Add detailed leverage configuration to the preset in src/frontend/src/presets/index.ts
leverage: {
  green_sleeve: {
    enabled: true, // Enable NAV facility for green zone
    max_mult: 1.5, // 1.5x leverage on NAV
    spread_bps: 275, // 2.75% spread
    commitment_fee_bps: 50, // 0.5% commitment fee
  },
  a_plus_overadvance: {
    enabled: true, // Enable over-advance for A+ rated properties
    tls_grade: 'A+',
    advance_rate: 0.75, // 75% advance rate
  },
  deal_note: {
    enabled: true, // Enable deal-level notes
    note_pct: 0.3, // 30% of deal as note
    note_rate: 0.07, // 7% note rate
  },
  ramp_line: {
    enabled: true, // Enable ramp line
    limit_pct_commit: 0.15, // 15% of committed capital
    draw_period_months: 24, // 2-year draw period
    spread_bps: 300, // 3% spread
  },
  dynamic_rules: [
    {
      trigger: "nav > 50000000", // If NAV exceeds $50M
      action: "increase_green_sleeve",
      max: 1.75 // Increase green sleeve leverage to 1.75x
    },
    {
      trigger: "default_rate > 0.03", // If default rate exceeds 3%
      action: "decrease_green_sleeve",
      max: 1.25 // Decrease green sleeve leverage to 1.25x
    }
  ],
},
```

## 6. Wizard Implementation

The wizard implementation doesn't fully expose all parameters in an intuitive way.

### Current Issues:

- Sydney suburb data selection is not clearly presented in the wizard
- Leverage parameters are tucked away in the Advanced step
- Some parameters in the preset don't map directly to fields in the wizard forms
- The 100M preset button jumps directly to the review step, skipping the configuration steps

### Recommended Fixes:

1. **Add a dedicated Sydney Suburb Data step to the wizard:**

```typescript
// Add a new step in src/frontend/src/schemas/simulation-schema.ts
export const wizardSteps = [
  // ... existing steps
  {
    id: 'sydney-data',
    title: 'Sydney Suburb Data',
    description: 'Configure Sydney suburb data and zone profiles',
    fields: [
      'geo_strategy', 'use_tls_zone_growth', 'zone_profiles', 'risk_weight_table'
    ],
  },
  // ... remaining steps
];
```

2. **Create a new component for the Sydney Suburb Data step:**

```typescript
// Create a new file: src/frontend/src/components/wizard/steps/sydney-data-step.tsx
import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';
import { SuburbSelector } from '@/components/wizard/suburb-selector';

export function SydneyDataStep() {
  return (
    <WizardStep
      title="Sydney Suburb Data"
      description="Configure Sydney suburb data and zone profiles"
    >
      <FormSection
        title="Data Source Configuration"
        description="Configure the geographical allocation strategy"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ParameterField
            name="geo_strategy"
            label="Geographical Strategy"
            tooltip="Strategy for allocating suburbs to traffic-light zones"
            type="select"
            options={[
              { value: 'simple', label: 'Simple (Default Zones)' },
              { value: 'profile', label: 'Profile-Based (Grouped Suburbs)' },
              { value: 'explicit', label: 'Explicit (Manual Allocation)' },
            ]}
            defaultValue="profile"
          />
          <ParameterField
            name="use_tls_zone_growth"
            label="Use TLS Growth Data"
            tooltip="Use Traffic Light System data for zone growth rates"
            type="switch"
            defaultValue={true}
          />
        </div>
      </FormSection>

      <FormSection
        title="Sydney Suburb Selection"
        description="Select Sydney suburbs for each zone"
      >
        <SuburbSelector />
      </FormSection>
    </WizardStep>
  );
}
```

3. **Move leverage parameters to a dedicated section in the wizard:**

```typescript
// Create a new file: src/frontend/src/components/wizard/steps/leverage-step.tsx
import React from 'react';
import { WizardStep } from '@/components/wizard/wizard-step';
import { FormSection } from '@/components/wizard/form-section';
import { ParameterField } from '@/components/wizard/parameter-field';
import { useLeveragePreview } from '@/hooks/useLeveragePreview';
import { LeveragePreviewChips } from '@/components/wizard/leverage-preview-chips';

export function LeverageStep() {
  // ... implementation
}
```

4. **Update the preset button to allow viewing each step:**

```typescript
// Modify src/frontend/src/components/wizard/preset-button.tsx
const handleClick = () => {
  loadPreset(preset);
  // Instead of jumping to review, go to the first step
  goToStep(0);
  // Show a notification that preset is loaded but can be customized
  toast({
    title: "Preset Loaded",
    description: "The preset has been loaded. You can customize any parameters before running the simulation.",
    status: "success",
    duration: 5000,
    isClosable: true,
  });
};
```

## Implementation Plan

1. Update the 100M preset in `src/frontend/src/presets/index.ts` with all missing parameters
2. Fix naming inconsistencies between the preset and schema
3. Explicitly set all relevant parameters with appropriate values for a $100M fund
4. Add Sydney suburb data configuration to the preset
5. Add detailed leverage configuration to the preset
6. Enhance the wizard implementation with dedicated steps for Sydney suburb data and leverage
7. Update the preset button to allow viewing and customizing each step

This comprehensive update will ensure that the 100M preset utilizes all parameters from the schema and provides a more intuitive user experience in the wizard.
