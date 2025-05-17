import { SimulationStore } from './types';

export function normalizeSimulationResults(raw: any): SimulationStore {
  return {
    id: raw.id ?? 'unknown',
    status: raw.status ?? 'unknown',
    name: raw.name,
    
    // Enhanced metrics
    headlineMetrics: {
      portfolioValue: raw.portfolio_value ?? raw.metrics?.portfolio_value ?? null,
      aggregateIrr: raw.aggregate_irr ?? raw.metrics?.aggregate_irr ?? null,
      defaultRate: raw.default_rate ?? raw.metrics?.default_rate ?? null,
      tlsRiskExposure: raw.tls_risk_exposure ?? {
        green: raw.tls_green ?? 0,
        yellow: raw.tls_yellow ?? 0,
        red: raw.tls_red ?? 0
      },
      netCashFlowYtd: raw.net_cash_flow_ytd ?? raw.metrics?.net_cash_flow_ytd ?? null
    },
    
    portfolioDynamics: {
      originations: raw.originations ?? {
        count: raw.originated_loans ?? 0,
        amount: raw.originated_amount ?? 0
      },
      activeLoans: raw.active_loans ?? {
        count: raw.active_loan_count ?? 0,
        amount: raw.active_loan_amount ?? 0
      },
      exits: raw.exits ?? {
        count: raw.exited_loans ?? 0,
        amount: raw.exited_amount ?? 0,
        repayments: raw.repaid_loans ?? 0,
        defaults: raw.defaulted_loans ?? 0
      },
      reinvestments: raw.reinvestments ?? {
        count: raw.reinvested_loans ?? 0,
        amount: raw.reinvested_amount ?? 0
      },
      reinvestmentExits: raw.reinvestment_exits ?? {
        count: raw.reinvestment_exited_loans ?? 0,
        amount: raw.reinvestment_exited_amount ?? 0
      },
      insights: {
        avgLtv: raw.avg_ltv ?? null,
        avgLoanSize: raw.avg_loan_size ?? null,
        avgExitTiming: raw.avg_exit_timing ?? null,
        avgReinvestmentTiming: raw.avg_reinvestment_timing ?? null
      }
    },
    
    lpCashFlows: {
      monthlyInflows: raw.monthly_inflows ?? [],
      monthlyOutflows: raw.monthly_outflows ?? [],
      netCashFlow: raw.net_cash_flow ?? [],
      cumulativeCashFlowYtd: raw.cumulative_cash_flow_ytd ?? null,
      returnComponents: {
        interestIncome: raw.interest_income ?? null,
        principalRepayments: raw.principal_repayments ?? null,
        defaultsImpact: raw.defaults_impact ?? null,
        reinvestmentGains: raw.reinvestment_gains ?? null
      },
      otherMetrics: {
        moic: raw.moic ?? null,
        dpi: raw.dpi ?? null,
        avgCashFlowYield: raw.avg_cash_flow_yield ?? null
      }
    },
    
    riskInsights: {
      var: raw.var ?? null,
      highRiskExposure: raw.high_risk_exposure ?? null,
      defaultTrend: raw.default_trend ?? null,
      aiInsights: raw.ai_insights ?? []
    },
    
    fundMetrics: {
      totalCommittedCapital: raw.total_committed_capital ?? null,
      capitalDeployed: raw.capital_deployed ?? null,
      managementFees: raw.management_fees ?? null,
      carriedInterest: raw.carried_interest ?? null,
      portfolioAge: raw.portfolio_age ?? null
    },
    
    // Keep existing fields for backward compatibility
    metrics: {
      lpIrr: raw.waterfall_results?.lp_irr ?? raw.metrics?.lp_irr ?? null,
      lpMultiple: raw.waterfall_results?.lp_multiple ?? raw.metrics?.lp_multiple ?? null,
      gpIrr: raw.waterfall_results?.gp_irr ?? raw.metrics?.gp_irr ?? null,
      dpi: raw.waterfall_results?.lp_dpi ?? raw.metrics?.lp_dpi ?? null,
      tvpi: raw.waterfall_results?.lp_tvpi ?? raw.metrics?.lp_tvpi ?? null,
      payback: raw.metrics?.payback_period ?? null,
      defaultRate: raw.metrics?.default_rate ?? null,
    },
    cashFlows: Array.isArray(raw.cash_flows)
      ? raw.cash_flows.map((cf: any) => ({
          year: cf.year,
          capitalCalls: cf.capital_calls ?? 0,
          distributions: cf.distributions ?? 0,
          net: cf.net ?? 0,
        }))
      : [],
    portfolioEvolution: Array.isArray(raw.portfolio_evolution?.points)
      ? raw.portfolio_evolution.points.map((pt: any) => ({
          year: pt.year,
          activeLoans: pt.active_loans ?? 0,
          exitedLoans: pt.exited_loans ?? 0,
          newLoans: pt.new_loans ?? 0,
          defaultedLoans: pt.defaulted_loans ?? 0,
          reinvestments: pt.reinvestments ?? 0,
          reinvestedAmount: pt.reinvested_amount ?? 0,
        }))
      : [],
    loanPerformance: raw.loan_performance
      ? {
          totalLoans: raw.loan_performance.total_loans ?? 0,
          averageIrr: raw.loan_performance.average_irr ?? 0,
          defaultRate: raw.loan_performance.default_rate ?? 0,
        }
      : null,
    zonePerformance: raw.zone_performance
      ? {
          labels: raw.zone_performance.labels ?? [],
          irr: raw.zone_performance.irr ?? [],
          defaultRates: raw.zone_performance.default_rates ?? [],
        }
      : null,
    portfolioAllocation: raw.portfolio_allocation
      ? {
          labels: raw.portfolio_allocation.labels ?? [],
          values: raw.portfolio_allocation.values ?? [],
          colors: raw.portfolio_allocation.colors ?? [],
        }
      : null,
    raw,
  };
} 