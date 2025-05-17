/**
 * Comprehensive Mock Data for Transformation Layer Testing
 * 
 * This module provides detailed mock data for testing all aspects of the
 * transformation layer without requiring a connection to the backend.
 */

// Key Metrics Mock Data
const metrics = {
  key_metrics: {
    irr: 0.143,
    multiple: 2.5,
    roi: 1.5,
    dpi: 1.8,
    tvpi: 2.3,
    payback_period: 5.2,
    default_rate: 0.03,
    avg_exit_year: 7.4,
    volatility: 0.36,
    sharpe_ratio: 1.53,
    sortino_ratio: 2.26,
    max_drawdown: 0.19,
    fund_size: 100000000,
    fund_term: 10,
    distributions_total: 220000000,
    capital_calls_total: 100000000
  }
};

// Cashflow Mock Data
const cashflows = {
  cashflows: {
    labels: [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030],
    datasets: [
      {
        label: "Capital Calls",
        data: [-25000000, -25000000, -25000000, -25000000, 0, 0, 0, 0, 0, 0, 0]
      },
      {
        label: "Distributions",
        data: [0, 0, 5000000, 10000000, 15000000, 20000000, 25000000, 30000000, 35000000, 40000000, 150000000]
      },
      {
        label: "Net Cashflow",
        data: [-25000000, -25000000, -20000000, -15000000, 15000000, 20000000, 25000000, 30000000, 35000000, 40000000, 150000000]
      }
    ]
  }
};

// Portfolio Composition Mock Data
const portfolio = {
  portfolio: {
    labels: ["Green Zone", "Orange Zone", "Red Zone"],
    values: [65, 25, 10],
    colors: ["#4CAF50", "#FF9800", "#F44336"],
    total_loans: 400,
    active_loans: 368,
    defaulted_loans: 12,
    exited_loans: 20,
    default_rate: 0.03
  }
};

// Monte Carlo Distribution Mock Data
const monteCarloDistribution = {
  labels: [0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.21, 0.22],
  datasets: [
    {
      label: "IRR Distribution",
      data: [2, 5, 8, 12, 20, 30, 40, 35, 25, 18, 10, 7, 5, 2, 1]
    }
  ],
  statistics: {
    min: 0.08,
    max: 0.22,
    mean: 0.143,
    median: 0.145,
    std_dev: 0.025,
    percentiles: {
      p10: 0.11,
      p25: 0.125,
      p50: 0.145,
      p75: 0.16,
      p90: 0.18
    }
  }
};

// Monte Carlo Sensitivity Mock Data
const monteCarloSensitivity = {
  labels: ["appreciation_rate", "default_rate", "exit_timing", "ltv_ratio", "interest_rate", "loan_term"],
  datasets: [
    {
      label: "Impact on IRR",
      data: [0.032, -0.028, 0.018, -0.015, 0.012, 0.008]
    }
  ]
};

// Monte Carlo Confidence Mock Data
const monteCarloConfidence = {
  mean: 0.143,
  median: 0.145,
  confidence_intervals: {
    p10_p90: [0.11, 0.18],
    p25_p75: [0.125, 0.16]
  }
};

// Risk Metrics Mock Data
const riskMetrics = {
  risk: {
    metrics: {
      volatility: 0.36,
      sharpe_ratio: 0.53,
      sortino_ratio: 8.26,
      max_drawdown: 0.19,
      downside_deviation: 0.02,
      var_95: 0.12,
      cvar_95: 0.15
    }
  }
};

// Zone Performance Mock Data
const zonePerformance = {
  zone_performance: {
    metrics: {
      green: {
        irr: 0.16,
        multiple: 2.8,
        default_rate: 0.01
      },
      orange: {
        irr: 0.12,
        multiple: 2.2,
        default_rate: 0.04
      },
      red: {
        irr: 0.09,
        multiple: 1.8,
        default_rate: 0.08
      }
    }
  }
};

// Loan Performance Mock Data
const loanPerformance = {
  loan_performance: {
    metrics: {
      total_loans: 400,
      defaulted_loans: 12,
      default_rate: 0.03,
      average_irr: 0.143,
      average_multiple: 2.5
    },
    datasets: [
      {
        label: "Loan Performance",
        data: [
          {
            id: "loan_0",
            ltv: 0.5,
            irr: 0.08,
            size: 200000,
            defaulted: false,
            zone: "green"
          },
          {
            id: "loan_1",
            ltv: 0.53,
            irr: 0.09,
            size: 250000,
            defaulted: false,
            zone: "orange"
          },
          {
            id: "loan_2",
            ltv: 0.62,
            irr: 0.11,
            size: 180000,
            defaulted: false,
            zone: "green"
          },
          {
            id: "loan_3",
            ltv: 0.75,
            irr: 0.00,
            size: 320000,
            defaulted: true,
            zone: "red"
          },
          {
            id: "loan_4",
            ltv: 0.68,
            irr: 0.07,
            size: 290000,
            defaulted: false,
            zone: "orange"
          }
        ]
      }
    ]
  }
};

// Portfolio Evolution Mock Data
const portfolioEvolution = {
  portfolio_evolution: {
    labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    datasets: [
      { label: "Active Loans", data: [333, 326, 307, 290, 270, 240, 200, 150, 90, 40, 0] },
      { label: "Defaulted Loans", data: [0, 2, 5, 9, 12, 15, 17, 19, 20, 20, 20] },
      { label: "Exited Loans", data: [0, 5, 21, 34, 51, 78, 116, 164, 223, 273, 313] },
      { label: "Total NAV", data: [100000000, 102500000, 107000000, 110000000, 98000000, 85000000, 70000000, 50000000, 30000000, 15000000, 0] }
    ]
  }
};

// Recycling Metrics Mock Data
const recycling = {
  recycling: {
    capital_recycling_ratio: 1.35,
    avg_time_to_reinvestment: 0.8,
    median_time_to_reinvestment: 0.6,
    total_reinvestments: 140,
    reinvestment_efficiency: 0.92
  }
};

// Cohort Analytics Mock Data
const cohorts = {
  cohorts: {
    "0": {
      loans: 300,
      defaults: 15,
      default_rate: 0.05,
      avg_irr: 0.13
    },
    "1": {
      loans: 65,
      defaults: 4,
      default_rate: 0.0615,
      avg_irr: 0.11
    },
    "2": {
      loans: 35,
      defaults: 1,
      default_rate: 0.0286,
      avg_irr: 0.09
    }
  }
};

// GP Entity Metrics Mock Data
const gpEntity = {
  basic_economics: {
    management_fees: 12000000,
    carried_interest: 15000000,
    origination_fees: 8000000,
    catch_up: 2000000,
    return_of_capital: 5000000,
    distributions: 20000000,
    total_revenue: 35000000
  },
  metrics: {
    total_expenses: 18000000,
    total_net_income: 17000000,
    profit_margin: 0.486,
    cagr: 0.12,
    irr: 0.24,
    payback_period: 3.5
  },
  team_economics: {
    partner_allocation: {
      "Partner 1": 0.40,
      "Partner 2": 0.35,
      "Partner 3": 0.25
    },
    carry_distribution: {
      "Partner 1": 6000000,
      "Partner 2": 5250000,
      "Partner 3": 3750000
    }
  },
  cashflows: {
    yearly: {
      "2020": { revenue: 3000000, expenses: 2000000, net_income: 1000000 },
      "2021": { revenue: 4500000, expenses: 2300000, net_income: 2200000 },
      "2022": { revenue: 6000000, expenses: 2800000, net_income: 3200000 },
      "2023": { revenue: 7500000, expenses: 3400000, net_income: 4100000 },
      "2024": { revenue: 9000000, expenses: 3800000, net_income: 5200000 },
      "2025": { revenue: 5000000, expenses: 3700000, net_income: 1300000 }
    }
  }
};

// Export all mock data
module.exports = {
  metrics,
  cashflows,
  portfolio,
  monteCarloDistribution,
  monteCarloSensitivity,
  monteCarloConfidence,
  riskMetrics,
  zonePerformance,
  loanPerformance,
  portfolioEvolution,
  recycling,
  cohorts,
  gpEntity
}; 