// Layout configuration for the Parameter Wizard steps

// Category types used in AdvancedParameters
export type CategoryKey = 'economics' | 'deployment' | 'lifecycle' | 'riskParameters' | 'appreciation';

// Section orders define UI rendering order for better UX
export const sectionOrders = {
  // AdvancedParameters section order
  advancedParameters: [
    'Management Fees',
    'Distribution Settings',
    'Deployment',
    'Lifecycle Timing',
    'Lifecycle Parameters',
    'Lifecycle Simulation',
    'LTV Distribution',
    'Default Correlation',
    'Zone Rebalancing',
    'Default Rates',
    'Appreciation Rates',
    'Appreciation Sharing',
    'Fees'
  ],
  
  // Add other section orders here as needed
  // basicConfig: [...],
  // gpEconomics: [...],
};

// Category groupings for logical organization in tabs
export const sectionCategories: Record<CategoryKey, string[]> = {
  economics: ['Management Fees', 'Distribution Settings', 'Fees'],
  deployment: ['Deployment'],
  lifecycle: ['Lifecycle Timing', 'Lifecycle Parameters', 'Lifecycle Simulation'],
  riskParameters: ['LTV Distribution', 'Default Correlation', 'Zone Rebalancing', 'Default Rates'],
  appreciation: ['Appreciation Rates', 'Appreciation Sharing']
};

// Wizard steps configuration for progress indicator
export const wizardSteps = [
  { value: 'BasicFundConfig', label: 'Basic Fund Config' },
  { value: 'AdvancedParameters', label: 'Advanced Parameters' },
  { value: 'MarketConditions', label: 'Market Conditions' },
  { value: 'GPEconomics', label: 'GP Economics' },
  { value: 'AnalysisSettings', label: 'Analysis Settings' },
  { value: 'ReviewSubmit', label: 'Review & Submit' }
]; 