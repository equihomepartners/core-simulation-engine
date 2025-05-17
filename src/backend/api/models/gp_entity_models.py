"""
GP Entity API Models

This module contains Pydantic models for the GP Entity API.
"""

from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, root_validator

# Use this instead of RootModel for compatibility
class RootModel(BaseModel):
    root: Any

    @root_validator(pre=True)
    def set_root(cls, values):
        if not isinstance(values, dict) or not values.get("root", None):
            return {"root": values}
        return values


class ExpenseItemModel(BaseModel):
    """Model for an expense item."""
    name: str = Field(..., description="Name of the expense")
    amount: float = Field(..., description="Amount of the expense")
    type: str = Field("recurring", description="Type of expense ('recurring' or 'one-time')")
    frequency: str = Field("annual", description="Frequency of expense ('annual', 'quarterly', 'monthly')")
    start_year: int = Field(0, description="Year when the expense starts")
    end_year: Optional[int] = Field(None, description="Year when the expense ends (null for indefinite)")
    growth_rate: float = Field(0, description="Annual growth rate for the expense")
    scaling_metric: Optional[str] = Field(None, description="Metric for scaling the expense")
    scaling_factor: float = Field(0, description="Factor for scaling the expense")
    fund_specific: bool = Field(False, description="Whether the expense is specific to a fund")
    fund_id: Optional[str] = Field(None, description="ID of the fund for fund-specific expenses")
    enabled: bool = Field(True, description="Whether the expense is enabled")
    category: str = Field("other", description="Category of the expense")


class DividendPolicyModel(BaseModel):
    """Model for a dividend policy."""
    enabled: bool = Field(False, description="Whether dividend distribution is enabled")
    type: str = Field("percentage", description="Type of dividend policy")
    percentage: float = Field(0.5, description="Percentage of net income to distribute as dividend")
    fixed_amount: float = Field(0, description="Fixed amount to distribute as dividend")
    frequency: str = Field("annual", description="Frequency of dividend distribution")
    min_cash_reserve: float = Field(0, description="Minimum cash reserve to maintain")
    start_year: int = Field(1, description="Year when dividend distribution starts")
    max_dividend: Optional[float] = Field(None, description="Maximum dividend amount")
    min_profitability: float = Field(0, description="Minimum net income for dividend distribution")


class StaffMemberModel(BaseModel):
    """Model for a staff member."""
    role: str = Field(..., description="Role of the staff member")
    count: int = Field(1, description="Number of staff members with this role")
    annual_cost: float = Field(..., description="Annual cost per staff member")
    start_year: int = Field(0, description="Year when the staff member starts")
    growth_rate: float = Field(0.03, description="Annual growth rate for the staff member's cost")


class ExpenseScalingModel(BaseModel):
    """Model for expense scaling."""
    aum_scaling_factor: float = Field(0, description="Scaling factor for AUM-based expenses")
    fund_count_scaling_factor: float = Field(0, description="Scaling factor for fund count-based expenses")
    loan_count_scaling_factor: float = Field(0, description="Scaling factor for loan count-based expenses")


class AdditionalRevenueSourceModel(BaseModel):
    """Model for an additional revenue source."""
    name: str = Field(..., description="Name of the revenue source")
    amount: float = Field(..., description="Annual amount of the revenue source")
    growth_rate: float = Field(0.03, description="Annual growth rate for the revenue source")
    start_year: int = Field(0, description="Year when the revenue source starts")
    end_year: Optional[int] = Field(None, description="Year when the revenue source ends (null for indefinite)")


class RevenueDiversificationModel(BaseModel):
    """Model for revenue diversification."""
    enabled: bool = Field(False, description="Whether revenue diversification is enabled")
    additional_revenue_sources: List[AdditionalRevenueSourceModel] = Field([], description="Additional revenue sources")


class ManagementCompanyModel(BaseModel):
    """Model for a management company."""
    base_expenses: float = Field(500000, description="Base annual expenses")
    expense_growth_rate: float = Field(0.03, description="Annual growth rate for expenses")
    staff: List[StaffMemberModel] = Field([], description="Staff configuration")
    office_expenses: float = Field(100000, description="Annual office expenses")
    technology_expenses: float = Field(50000, description="Annual technology expenses")
    marketing_expenses: float = Field(50000, description="Annual marketing expenses")
    legal_expenses: float = Field(100000, description="Annual legal expenses")
    other_expenses: float = Field(200000, description="Annual other expenses")
    expense_scaling: ExpenseScalingModel = Field(default_factory=ExpenseScalingModel, description="Expense scaling configuration")
    revenue_diversification: RevenueDiversificationModel = Field(default_factory=RevenueDiversificationModel, description="Revenue diversification configuration")


class PartnerModel(BaseModel):
    """Model for a partner."""
    name: str = Field(..., description="Name of the partner")
    carried_interest_allocation: float = Field(..., description="Percentage of carried interest allocated to the partner")
    management_fee_allocation: float = Field(0, description="Percentage of management fees allocated to the partner")
    origination_fee_allocation: float = Field(0, description="Percentage of origination fees allocated to the partner")


class EmployeeModel(BaseModel):
    """Model for an employee."""
    role: str = Field(..., description="Role of the employee")
    carried_interest_allocation: float = Field(0, description="Percentage of carried interest allocated to the employee")
    management_fee_allocation: float = Field(0, description="Percentage of management fees allocated to the employee")
    origination_fee_allocation: float = Field(0, description="Percentage of origination fees allocated to the employee")


class TeamAllocationModel(BaseModel):
    """Model for team allocation."""
    partners: List[PartnerModel] = Field([], description="Partner configuration")
    employees: List[EmployeeModel] = Field([], description="Employee configuration")


class CrossFundCarryRulesModel(BaseModel):
    """Model for cross-fund carry rules."""
    hurdle_rate: float = Field(0.08, description="Hurdle rate for cross-fund carried interest")
    carried_interest_rate: float = Field(0.20, description="Carried interest rate for cross-fund carried interest")
    catch_up_rate: float = Field(0.50, description="Catch-up rate for cross-fund carried interest")
    waterfall_structure: str = Field("european", description="Waterfall structure for cross-fund carried interest")


class GPEntityModel(BaseModel):
    """Model for a GP entity."""
    name: str = Field("Equihome Partners", description="Name of the GP entity")
    management_company: ManagementCompanyModel = Field(default_factory=ManagementCompanyModel, description="Management company configuration")
    team_allocation: TeamAllocationModel = Field(default_factory=TeamAllocationModel, description="Team allocation configuration")
    gp_commitment_percentage: float = Field(0.01, description="GP commitment as percentage of fund size")
    cross_fund_carry: bool = Field(False, description="Whether to calculate carried interest across funds")
    cross_fund_carry_rules: CrossFundCarryRulesModel = Field(default_factory=CrossFundCarryRulesModel, description="Rules for cross-fund carried interest calculation")
    cashflow_frequency: str = Field("yearly", description="Frequency of cashflow generation")
    expenses: List[ExpenseItemModel] = Field([], description="Custom expense items")
    dividend_policy: DividendPolicyModel = Field(default_factory=DividendPolicyModel, description="Dividend policy configuration")
    initial_cash_reserve: float = Field(0, description="Initial cash reserve")


# Response Models

class BasicEconomicsResponse(BaseModel):
    """Response model for basic GP entity economics."""
    total_management_fees: float
    total_origination_fees: float
    total_carried_interest: float
    total_catch_up: float
    total_return_of_capital: float
    total_distributions: float
    total_revenue: float
    yearly_management_fees: Dict[str, float]
    yearly_carried_interest: Dict[str, float]
    yearly_distributions: Dict[str, float]
    yearly_origination_fees: Dict[str, float]
    yearly_total_revenue: Dict[str, float]


class ExpenseBreakdownResponse(BaseModel):
    """Response model for expense breakdown."""
    base: float
    staff: float
    office: float
    technology: float
    marketing: float
    legal: float
    other: float
    scaled: float


class StaffGrowthResponse(RootModel):
    """Response model for staff growth."""
    root: Dict[str, Dict[str, int]]


class ManagementCompanyResponse(BaseModel):
    """Response model for management company metrics."""
    yearly_expenses: Dict[str, float]
    total_expenses: float
    yearly_additional_revenue: Dict[str, float]
    total_additional_revenue: float
    expense_breakdown: ExpenseBreakdownResponse
    staff_growth: StaffGrowthResponse
    yearly_aum: Dict[str, float]
    yearly_fund_count: Dict[str, int]
    yearly_loan_count: Dict[str, int]


class TeamEconomicsResponse(BaseModel):
    """Response model for team economics."""
    partner_carried_interest: Dict[str, float]
    employee_carried_interest: Dict[str, float]
    partner_management_fees: Dict[str, float]
    employee_management_fees: Dict[str, float]
    partner_origination_fees: Dict[str, float]
    employee_origination_fees: Dict[str, float]
    partner_total_compensation: Dict[str, float]
    employee_total_compensation: Dict[str, float]
    total_partner_allocation: float
    total_employee_allocation: float
    yearly_allocations: Dict[str, Dict[str, Dict[str, Dict[str, float]]]]


class FundCommitmentResponse(BaseModel):
    """Response model for fund commitment."""
    commitment: float
    return_value: float = Field(alias="return")
    multiple: float
    roi: float


class GPCommitmentResponse(BaseModel):
    """Response model for GP commitment."""
    total_commitment: float
    total_return: float
    multiple: float
    roi: float
    by_fund: Dict[str, FundCommitmentResponse]


class CashflowResponse(BaseModel):
    """Response model for a single cashflow."""
    management_fees: float
    carried_interest: float
    origination_fees: float
    additional_revenue: float
    total_revenue: float
    base_expenses: float
    custom_expenses: float
    expense_breakdown: Dict[str, float]
    total_expenses: float
    net_income: float
    dividend: float
    cash_reserve: float


class GPEntityCashflowsResponse(BaseModel):
    """Response model for GP entity cashflows."""
    yearly: Dict[str, CashflowResponse]
    monthly: Dict[str, CashflowResponse]


class GPEntityMetricsResponse(BaseModel):
    """Response model for GP entity metrics."""
    total_revenue: float
    total_expenses: float
    total_net_income: float
    profit_margin: float
    revenue_cagr: float
    expense_cagr: float
    net_income_cagr: float
    revenue_per_employee: float
    profit_per_employee: float
    irr: float
    payback_period: int


class ChartDataResponse(BaseModel):
    """Response model for chart data."""
    labels: List[str]
    values: List[float]
    colors: Optional[List[str]] = None
    tooltips: Optional[List[str]] = None


class TimeSeriesChartDataResponse(BaseModel):
    """Response model for time series chart data."""
    years: List[int]
    values: Dict[str, List[float]]
    colors: Optional[Dict[str, str]] = None
    annotations: Optional[Dict[str, List[Dict[str, Any]]]] = None


class PortfolioCompositionResponse(BaseModel):
    """Response model for portfolio composition data."""
    time_points: List[str]  # Years or dates
    categories: List[str]  # Property types, loan sizes, etc.
    values: List[List[float]]  # Matrix of values [time_point][category]
    percentages: Optional[List[List[float]]] = None  # Matrix of percentages
    colors: Optional[Dict[str, str]] = None


class GeographicDistributionResponse(BaseModel):
    """Response model for geographic distribution data."""
    regions: List[Dict[str, Any]]  # Region data with coordinates
    values: Dict[str, float]  # Values by region code
    metrics: Optional[Dict[str, Dict[str, float]]] = None  # Additional metrics by region


class VisualizationDataResponse(BaseModel):
    """Response model for visualization data."""
    # Basic charts
    revenue_sources: Optional[Dict[str, float]] = None
    expense_breakdown: Optional[Dict[str, Union[List[str], List[float]]]] = None
    custom_expense_breakdown: Optional[Dict[str, Union[List[str], List[float]]]] = None

    # Time series charts
    yearly_revenue: Optional[Dict[str, Union[List[int], List[float]]]] = None
    cashflow_over_time: Optional[Dict[str, Union[List[int], List[float]]]] = None
    dividend_over_time: Optional[Dict[str, Union[List[int], List[float]]]] = None
    expenses_over_time: Optional[Dict[str, Union[List[int], List[float]]]] = None
    aum_over_time: Optional[Dict[str, Union[List[int], List[float]]]] = None

    # Team allocation charts
    team_allocation: Optional[Dict[str, Any]] = None
    carried_interest_distribution: Optional[Dict[str, Any]] = None
    management_fee_distribution: Optional[Dict[str, Any]] = None

    # Portfolio charts
    portfolio_composition: Optional[PortfolioCompositionResponse] = None
    geographic_distribution: Optional[GeographicDistributionResponse] = None
    loan_performance: Optional[Dict[str, Any]] = None
    exit_timing: Optional[Dict[str, Any]] = None

    # Advanced charts
    waterfall_chart: Optional[Dict[str, Any]] = None
    sensitivity_analysis: Optional[Dict[str, Any]] = None
    comparative_metrics: Optional[Dict[str, Any]] = None

    # Time granularity data
    time_series: Optional[Dict[str, Dict[str, Any]]] = None  # Contains monthly, quarterly data


class GPEntityEconomicsResponse(BaseModel):
    """Response model for GP entity economics."""
    basic_economics: BasicEconomicsResponse
    management_company: ManagementCompanyResponse
    team_economics: TeamEconomicsResponse
    gp_commitment: GPCommitmentResponse
    cashflows: GPEntityCashflowsResponse
    metrics: GPEntityMetricsResponse
    visualization_data: VisualizationDataResponse
