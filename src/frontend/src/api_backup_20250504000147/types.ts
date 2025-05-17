export interface CashFlowYear {
  year: number;
  capitalCalls: number;
  distributions: number;
  net: number;
}

export interface PortfolioEvolutionPoint {
  year: number;
  activeLoans: number;
  exitedLoans: number;
  newLoans: number;
  defaultedLoans: number;
  reinvestments: number;
  reinvestedAmount: number;
}

export interface LoanPerformance {
  totalLoans: number;
  averageIrr: number;
  defaultRate: number;
}

export interface ZonePerformance {
  labels: string[];
  irr: number[];
  defaultRates: number[];
}

export interface PortfolioAllocation {
  labels: string[];
  values: number[];
  colors: string[];
}

export interface MetricsBlock {
  lpIrr: number | null;
  lpMultiple: number | null;
  gpIrr: number | null;
  dpi: number | null;
  tvpi: number | null;
  payback: number | null;
  defaultRate: number | null;
}

export interface SimulationStore {
  id: string;
  status: string;
  name?: string;
  
  // New comprehensive metrics
  headlineMetrics: {
    portfolioValue: number | null;
    aggregateIrr: number | null;
    defaultRate: number | null;
    tlsRiskExposure: {
      green: number;
      yellow: number;
      red: number;
    };
    netCashFlowYtd: number | null;
  };
  
  portfolioDynamics: {
    originations: {
      count: number;
      amount: number;
    };
    activeLoans: {
      count: number;
      amount: number;
    };
    exits: {
      count: number;
      amount: number;
      repayments: number;
      defaults: number;
    };
    reinvestments: {
      count: number;
      amount: number;
    };
    reinvestmentExits: {
      count: number;
      amount: number;
    };
    insights: {
      avgLtv: number | null;
      avgLoanSize: number | null;
      avgExitTiming: number | null;
      avgReinvestmentTiming: number | null;
    };
  };
  
  lpCashFlows: {
    monthlyInflows: any[];
    monthlyOutflows: any[];
    netCashFlow: any[];
    cumulativeCashFlowYtd: number | null;
    returnComponents: {
      interestIncome: number | null;
      principalRepayments: number | null;
      defaultsImpact: number | null;
      reinvestmentGains: number | null;
    };
    otherMetrics: {
      moic: number | null;
      dpi: number | null;
      avgCashFlowYield: number | null;
    };
  };
  
  riskInsights: {
    var: number | null;
    highRiskExposure: number | null;
    defaultTrend: number | null;
    aiInsights: any[];
  };
  
  fundMetrics: {
    totalCommittedCapital: number | null;
    capitalDeployed: number | null;
    managementFees: number | null;
    carriedInterest: number | null;
    portfolioAge: number | null;
  };
  
  // Existing fields
  metrics: {
    lpIrr: number | null;
    lpMultiple: number | null;
    gpIrr: number | null;
    dpi: number | null;
    tvpi: number | null;
    payback: number | null;
    defaultRate: number | null;
  };
  cashFlows: Array<{
    year: number;
    capitalCalls: number;
    distributions: number;
    net: number;
  }>;
  portfolioEvolution: Array<{
    year: number;
    activeLoans: number;
    exitedLoans: number;
    newLoans: number;
    defaultedLoans: number;
    reinvestments: number;
    reinvestedAmount: number;
  }>;
  raw: any;
} 