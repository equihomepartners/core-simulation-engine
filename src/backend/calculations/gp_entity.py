"""
GP Entity module for the Equihome Fund Simulation Engine.

This module provides the main interface for GP entity modeling, integrating
GP economics, management company, and team allocation components.
"""

from decimal import Decimal
from typing import Dict, Any, List, Optional, Union
import copy
import uuid
import warnings
try:
    import numpy_financial as npf
except ImportError:
    npf = None

from .gp_economics import aggregate_gp_economics, generate_gp_economics_report, prepare_gp_economics_visualization_data
from .management_company import ManagementCompany
from .team_allocation import TeamAllocation
from .expense_item import ExpenseItem
from .dividend_policy import DividendPolicy


def _to_decimal(value: Union[int, float, str, Decimal]) -> Decimal:
    """
    Convert a value to Decimal.

    Args:
        value: Value to convert

    Returns:
        Decimal value
    """
    if isinstance(value, Decimal):
        return value

    try:
        return Decimal(str(value))
    except:
        return Decimal('0')


class GPEntity:
    """
    Represents the General Partner (GP) entity, Equihome Partners.
    """
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize a GP entity with the given configuration.

        Args:
            config: GP entity configuration
        """
        self.id = config.get('id', str(uuid.uuid4()))
        self.name = config.get('name', 'Equihome Partners')

        # Management company parameters
        self.management_company = ManagementCompany(config.get('management_company', {}))

        # Team allocation parameters
        self.team_allocation = TeamAllocation(config.get('team_allocation', {}))

        # GP commitment parameters
        self.gp_commitment_percentage = _to_decimal(config.get('gp_commitment_percentage', 0.01))

        # Cross-fund carry parameters
        self.cross_fund_carry = config.get('cross_fund_carry', False)
        self.cross_fund_carry_rules = config.get('cross_fund_carry_rules', {
            'hurdle_rate': 0.08,
            'carried_interest_rate': 0.20,
            'catch_up_rate': 0.50,
            'waterfall_structure': 'european'  # 'european' or 'american'
        })

        # Cashflow frequency
        self.cashflow_frequency = config.get('cashflow_frequency', 'yearly')  # 'yearly' or 'monthly'

        # Monthly distribution patterns for revenue and base expenses
        self.monthly_patterns = config.get('monthly_patterns', {})

        # Custom expenses
        self.expenses = [ExpenseItem(expense_config) for expense_config in config.get('expenses', [])]

        # Dividend policy
        self.dividend_policy = DividendPolicy(config.get('dividend_policy', {}))

        # Cash reserve tracking
        self.initial_cash_reserve = _to_decimal(config.get('initial_cash_reserve', 0))

        # Economics results (to be calculated)
        self.economics = {}

    def calculate_economics(self, multi_fund_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate GP entity economics based on multi-fund results.

        Args:
            multi_fund_results: Results from MultiFundManager

        Returns:
            Dictionary with GP entity economics
        """
        # First, aggregate basic GP economics
        basic_economics = generate_gp_economics_report(multi_fund_results)

        # If cross-fund carry is enabled, recalculate carried interest
        if self.cross_fund_carry:
            basic_economics = self._calculate_cross_fund_carry(basic_economics, multi_fund_results)

        # Calculate management company metrics
        management_company_metrics = self.management_company.calculate_metrics(basic_economics, multi_fund_results)

        # Apply team allocation
        team_economics = self.team_allocation.calculate_allocation(basic_economics)

        # Calculate GP commitment and returns
        gp_commitment = self._calculate_gp_commitment(multi_fund_results)

        # Generate GP cashflows
        gp_cashflows = self._generate_gp_cashflows(basic_economics, management_company_metrics)

        # Calculate GP metrics
        gp_metrics = self._calculate_gp_metrics(gp_cashflows, gp_commitment)

        # Prepare visualization data
        visualization_data = self._prepare_visualization_data(basic_economics, management_company_metrics, team_economics, gp_cashflows, gp_metrics)

        # Combine all results
        self.economics = {
            'basic_economics': basic_economics,
            'management_company': management_company_metrics,
            'team_economics': team_economics,
            'gp_commitment': gp_commitment,
            'cashflows': gp_cashflows,
            'metrics': gp_metrics,
            'visualization_data': visualization_data
        }

        return self.economics

    def _calculate_cross_fund_carry(self, basic_economics: Dict[str, Any], multi_fund_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate cross-fund carried interest.

        Args:
            basic_economics: Basic GP economics
            multi_fund_results: Results from MultiFundManager

        Returns:
            Updated basic economics with cross-fund carried interest
        """
        # Get cross-fund carry rules
        hurdle_rate = _to_decimal(self.cross_fund_carry_rules.get('hurdle_rate', 0.08))
        carried_interest_rate = _to_decimal(self.cross_fund_carry_rules.get('carried_interest_rate', 0.20))
        catch_up_rate = _to_decimal(self.cross_fund_carry_rules.get('catch_up_rate', 0.50))
        waterfall_structure = self.cross_fund_carry_rules.get('waterfall_structure', 'european')

        # Calculate total capital invested
        total_capital = Decimal('0')
        for fund_id, results in multi_fund_results.items():
            if fund_id == 'aggregated':
                continue

            if 'fund_size' in results:
                total_capital += _to_decimal(results['fund_size'])
            elif 'config' in results and 'fund_size' in results['config']:
                total_capital += _to_decimal(results['config']['fund_size'])

        # Calculate total distributions
        total_distributions = Decimal('0')
        for fund_id, results in multi_fund_results.items():
            if fund_id == 'aggregated':
                continue

            if 'waterfall' in results:
                waterfall = results['waterfall']
                total_distributions += _to_decimal(waterfall.get('total_distributions', 0))

        # Calculate preferred return
        preferred_return = total_capital * hurdle_rate

        # Calculate profits
        profits = total_distributions - total_capital

        # Calculate carried interest based on waterfall structure
        if waterfall_structure == 'european':
            # European waterfall: return capital and preferred return first, then catch-up, then carried interest
            if profits <= preferred_return:
                # Not enough profits to cover preferred return
                carried_interest = Decimal('0')
                catch_up = Decimal('0')
            else:
                # Calculate catch-up
                catch_up_amount = (profits - preferred_return) * catch_up_rate
                catch_up = min(catch_up_amount, preferred_return * carried_interest_rate / (1 - carried_interest_rate))

                # Calculate carried interest
                carried_interest = (profits - preferred_return - catch_up) * carried_interest_rate + catch_up
        else:
            # American waterfall: carried interest calculated on a deal-by-deal basis
            # For simplicity, we'll use the existing carried interest calculation
            carried_interest = basic_economics['total_carried_interest']
            catch_up = basic_economics['total_catch_up']

        # Update basic economics with cross-fund carried interest
        updated_economics = copy.deepcopy(basic_economics)
        updated_economics['total_carried_interest'] = carried_interest
        updated_economics['total_catch_up'] = catch_up

        # Update yearly carried interest (simplified approach)
        if 'yearly_carried_interest' in basic_economics:
            total_original_carried_interest = basic_economics['total_carried_interest']
            if total_original_carried_interest > Decimal('0'):
                scaling_factor = carried_interest / total_original_carried_interest

                updated_yearly_carried_interest = {}
                for year, amount in basic_economics['yearly_carried_interest'].items():
                    updated_yearly_carried_interest[year] = amount * scaling_factor

                updated_economics['yearly_carried_interest'] = updated_yearly_carried_interest

        return updated_economics

    def _calculate_gp_commitment(self, multi_fund_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate GP commitment and returns.

        Args:
            multi_fund_results: Results from MultiFundManager

        Returns:
            Dictionary with GP commitment and returns (all values in USD unless otherwise noted)
        """
        gp_commitment = {
            'total_commitment': Decimal('0'),
            'total_return': Decimal('0'),
            'multiple': Decimal('0'),
            'irr': None,
            'by_fund': {}
        }

        for fund_id, results in multi_fund_results.items():
            if fund_id == 'aggregated':
                continue

            # Calculate GP commitment for this fund
            fund_size = Decimal('0')
            if 'fund_size' in results:
                fund_size = _to_decimal(results['fund_size'])
            elif 'config' in results and 'fund_size' in results['config']:
                fund_size = _to_decimal(results['config']['fund_size'])
            else:
                warnings.warn(f"Missing fund_size for fund {fund_id} in multi_fund_results.")

            gp_commitment_amount = fund_size * self.gp_commitment_percentage

            # Calculate GP return for this fund
            gp_return = Decimal('0')
            if 'waterfall' in results and 'returns' in results['waterfall'] and 'lp' in results['waterfall']['returns']:
                lp_returns = results['waterfall']['returns']['lp']
                if 'multiple' in lp_returns:
                    lp_multiple = _to_decimal(lp_returns['multiple'])
                    gp_return = gp_commitment_amount * lp_multiple
            else:
                warnings.warn(f"Missing waterfall/returns for fund {fund_id} in multi_fund_results.")

            # Calculate metrics for this fund
            fund_multiple = gp_return / gp_commitment_amount if gp_commitment_amount > Decimal('0') else Decimal('0')
            fund_roi = (gp_return - gp_commitment_amount) / gp_commitment_amount if gp_commitment_amount > Decimal('0') else Decimal('0')

            # Add to total
            gp_commitment['total_commitment'] += gp_commitment_amount
            gp_commitment['total_return'] += gp_return

            # Add fund-specific metrics
            gp_commitment['by_fund'][fund_id] = {
                'commitment': gp_commitment_amount,
                'return': gp_return,
                'multiple': fund_multiple,
                'roi': fund_roi
            }

        # Calculate overall metrics
        if gp_commitment['total_commitment'] > Decimal('0'):
            gp_commitment['multiple'] = gp_commitment['total_return'] / gp_commitment['total_commitment']
            gp_commitment['roi'] = (gp_commitment['total_return'] - gp_commitment['total_commitment']) / gp_commitment['total_commitment']

        # IRR calculation would require cashflow timing, which we don't have here
        # For simplicity, we'll leave it as None

        return gp_commitment

    def _generate_gp_cashflows(self, basic_economics: Dict[str, Any], management_company_metrics: Dict[str, Any]) -> Dict[str, Dict[str, Dict[str, float]]]:
        """
        Generate GP cashflows (all values in USD unless otherwise noted).

        Args:
            basic_economics: Basic GP economics
            management_company_metrics: Management company metrics

        Returns:
            Dictionary with GP cashflows
        """
        if self.cashflow_frequency == 'monthly':
            # TODO: Support custom monthly cashflow patterns (e.g., lumpy carry, custom expense timing)
            return {
                'yearly': self._generate_yearly_cashflows(basic_economics, management_company_metrics),
                'monthly': self._generate_monthly_cashflows(basic_economics, management_company_metrics)
            }
        else:
            return {
                'yearly': self._generate_yearly_cashflows(basic_economics, management_company_metrics),
                'monthly': {}
            }

    def _generate_yearly_cashflows(self, basic_economics: Dict[str, Any], management_company_metrics: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Generate yearly GP cashflows with enhanced features (all values in USD).

        Args:
            basic_economics: Basic GP economics
            management_company_metrics: Management company metrics

        Returns:
            Dictionary with yearly GP cashflows
        """
        yearly_cashflows = {}
        cash_reserve = self.initial_cash_reserve

        # Get all years
        all_years = set()
        all_years.update(basic_economics['yearly_management_fees'].keys())
        all_years.update(basic_economics['yearly_carried_interest'].keys())
        all_years.update(basic_economics['yearly_distributions'].keys())
        all_years.update(basic_economics['yearly_origination_fees'].keys())
        all_years.update(management_company_metrics['yearly_expenses'].keys())
        all_years.update(management_company_metrics['yearly_additional_revenue'].keys())

        # Convert to integers and sort
        years = sorted([int(year) for year in all_years])

        # Generate cashflows for each year
        for year in years:
            year_str = str(year)
            # Revenue
            management_fees = basic_economics['yearly_management_fees'].get(year_str, Decimal('0'))
            carried_interest = basic_economics['yearly_carried_interest'].get(year_str, Decimal('0'))
            origination_fees = basic_economics['yearly_origination_fees'].get(year_str, Decimal('0'))
            additional_revenue = management_company_metrics['yearly_additional_revenue'].get(year_str, Decimal('0'))

            total_revenue = management_fees + carried_interest + origination_fees + additional_revenue

            # Base expenses
            base_expenses = management_company_metrics['yearly_expenses'].get(year_str, Decimal('0'))

            # Custom expenses
            custom_expenses = Decimal('0')
            expense_breakdown = {}

            metrics = {
                'aum': management_company_metrics['yearly_aum'].get(year_str, Decimal('0')),
                'fund_count': management_company_metrics['yearly_fund_count'].get(year_str, 0),
                'loan_count': management_company_metrics['yearly_loan_count'].get(year_str, 0)
            }

            for expense in self.expenses:
                expense_amount = expense.calculate_expense(year, metrics)
                custom_expenses += expense_amount
                expense_breakdown[expense.name] = float(expense_amount)

            # Total expenses
            total_expenses = base_expenses + custom_expenses

            # Net income
            net_income = total_revenue - total_expenses

            # Update cash reserve
            cash_reserve += net_income

            # Calculate dividend
            dividend = self.dividend_policy.calculate_dividend(year, net_income, cash_reserve)

            # Update cash reserve after dividend
            cash_reserve -= dividend

            # Store cashflow
            yearly_cashflows[year_str] = {
                'management_fees': float(management_fees),
                'carried_interest': float(carried_interest),
                'origination_fees': float(origination_fees),
                'additional_revenue': float(additional_revenue),
                'total_revenue': float(total_revenue),
                'base_expenses': float(base_expenses),
                'custom_expenses': float(custom_expenses),
                'expense_breakdown': expense_breakdown,
                'total_expenses': float(total_expenses),
                'net_income': float(net_income),
                'dividend': float(dividend),
                'cash_reserve': float(cash_reserve)
            }

        return yearly_cashflows

    def _generate_monthly_cashflows(self, basic_economics: Dict[str, Any], management_company_metrics: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Generate monthly GP cashflows with enhanced features (all values in USD).
        Uses custom monthly patterns for all revenue and expense sources if specified.

        Args:
            basic_economics: Basic GP economics
            management_company_metrics: Management company metrics

        Returns:
            Dictionary with monthly GP cashflows
        """
        monthly_cashflows = {}
        cash_reserve = self.initial_cash_reserve

        # Get all years
        all_years = set()
        all_years.update(basic_economics['yearly_management_fees'].keys())
        all_years.update(basic_economics['yearly_carried_interest'].keys())
        all_years.update(basic_economics['yearly_distributions'].keys())
        all_years.update(basic_economics['yearly_origination_fees'].keys())
        all_years.update(management_company_metrics['yearly_expenses'].keys())
        all_years.update(management_company_metrics['yearly_additional_revenue'].keys())

        years = sorted([int(year) for year in all_years])

        # Helper to convert a pattern to 12 monthly weights
        def weights_from_pattern(pattern: Union[str, List[float]]) -> List[float]:
            if isinstance(pattern, list) and len(pattern) == 12:
                weights = [float(w) for w in pattern]
                total = sum(weights)
                if total == 0:
                    return [1 / 12.0] * 12
                return [w / total for w in weights]
            if pattern == 'quarterly':
                return [0, 0, 1/4, 0, 0, 1/4, 0, 0, 1/4, 0, 0, 1/4]
            if pattern == 'annual':
                return [0]*11 + [1.0]
            return [1 / 12.0] * 12

        mgmt_weights = weights_from_pattern(self.monthly_patterns.get('management_fees', 'even'))
        carry_weights = weights_from_pattern(self.monthly_patterns.get('carried_interest', 'even'))
        orig_weights = weights_from_pattern(self.monthly_patterns.get('origination_fees', 'even'))
        addl_weights = weights_from_pattern(self.monthly_patterns.get('additional_revenue', 'even'))
        base_exp_weights = weights_from_pattern(self.monthly_patterns.get('base_expenses', 'even'))

        for year in years:
            year_str = str(year)
            # Get yearly values
            yearly_management_fees = basic_economics['yearly_management_fees'].get(year_str, Decimal('0'))
            yearly_carried_interest = basic_economics['yearly_carried_interest'].get(year_str, Decimal('0'))
            yearly_origination_fees = basic_economics['yearly_origination_fees'].get(year_str, Decimal('0'))
            yearly_additional_revenue = management_company_metrics['yearly_additional_revenue'].get(year_str, Decimal('0'))
            yearly_base_expenses = management_company_metrics['yearly_expenses'].get(year_str, Decimal('0'))



            # Custom expenses
            yearly_custom_expenses = Decimal('0')
            yearly_expense_breakdown = {}
            custom_expense_weights = {}
            metrics = {
                'aum': management_company_metrics['yearly_aum'].get(year_str, Decimal('0')),
                'fund_count': management_company_metrics['yearly_fund_count'].get(year_str, 0),
                'loan_count': management_company_metrics['yearly_loan_count'].get(year_str, 0)
            }
            custom_expense_monthly = [Decimal('0')]*12
            for expense in self.expenses:
                expense_amount = expense.calculate_expense(year, metrics)
                weights = expense.get_monthly_allocation(year)
                for m in range(12):
                    custom_expense_monthly[m] += expense_amount * Decimal(str(weights[m]))
                yearly_custom_expenses += expense_amount
                yearly_expense_breakdown[expense.name] = float(expense_amount)
                custom_expense_weights[expense.name] = weights

            # Distribute across months using patterns
            for month in range(1, 13):
                m_idx = month - 1
                # Management fees
                month_management_fees = float(yearly_management_fees) * mgmt_weights[m_idx]
                # Carried interest
                month_carried_interest = float(yearly_carried_interest) * carry_weights[m_idx]
                # Origination fees
                month_origination_fees = float(yearly_origination_fees) * orig_weights[m_idx]
                # Additional revenue
                month_additional_revenue = float(yearly_additional_revenue) * addl_weights[m_idx]
                # Base expenses
                month_base_expenses = float(yearly_base_expenses) * base_exp_weights[m_idx]
                # Custom expenses
                month_custom_expenses = float(custom_expense_monthly[m_idx])
                month_expense_breakdown = {name: float(yearly_expense_breakdown[name]) * custom_expense_weights[name][m_idx] for name in yearly_expense_breakdown}

                # Calculate monthly totals
                month_total_revenue = month_management_fees + month_carried_interest + month_origination_fees + month_additional_revenue
                month_total_expenses = month_base_expenses + month_custom_expenses
                month_net_income = month_total_revenue - month_total_expenses

                # Update cash reserve
                cash_reserve += month_net_income

                # Calculate dividend
                if self.dividend_policy.frequency == 'monthly':
                    month_dividend = self.dividend_policy.calculate_dividend(year, month_net_income, cash_reserve)
                elif self.dividend_policy.frequency == 'quarterly' and month in [3, 6, 9, 12]:
                    # Quarterly dividend: sum net income for the quarter
                    # For simplicity, pay out this month's net income as quarterly
                    month_dividend = self.dividend_policy.calculate_dividend(year, month_net_income, cash_reserve)
                elif self.dividend_policy.frequency == 'annual' and month == 12:
                    # Annual dividend: sum net income for the year
                    month_dividend = self.dividend_policy.calculate_dividend(year, month_net_income, cash_reserve)
                else:
                    month_dividend = Decimal('0')

                # Update cash reserve after dividend
                cash_reserve -= month_dividend

                # Store monthly cashflow
                month_key = f"{year}-{month:02d}"
                monthly_cashflows[month_key] = {
                    'management_fees': month_management_fees,
                    'carried_interest': month_carried_interest,
                    'origination_fees': month_origination_fees,
                    'additional_revenue': month_additional_revenue,
                    'total_revenue': month_total_revenue,
                    'base_expenses': month_base_expenses,
                    'custom_expenses': month_custom_expenses,
                    'expense_breakdown': month_expense_breakdown,
                    'total_expenses': month_total_expenses,
                    'net_income': month_net_income,
                    'dividend': float(month_dividend),
                    'cash_reserve': float(cash_reserve)
                }

        return monthly_cashflows

    def _calculate_gp_metrics(self, gp_cashflows: Dict[str, Dict[str, Dict[str, float]]], gp_commitment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate GP performance metrics (all values in USD unless otherwise noted).

        Args:
            gp_cashflows: GP cashflows
            gp_commitment: GP commitment and returns

        Returns:
            Dictionary with GP performance metrics
        """
        yearly_cashflows: Dict[str, Any] = gp_cashflows['yearly']
        years: List[str] = sorted(yearly_cashflows.keys(), key=lambda y: int(y))
        total_revenue: float = sum(cf['total_revenue'] for cf in yearly_cashflows.values())
        total_expenses: float = sum(cf['total_expenses'] for cf in yearly_cashflows.values())
        total_net_income: float = sum(cf['net_income'] for cf in yearly_cashflows.values())
        profit_margin: float = total_net_income / total_revenue if total_revenue > 0 else 0
        revenue_cagr: float = self._calculate_cagr([yearly_cashflows[year]['total_revenue'] for year in years])
        expense_cagr: float = self._calculate_cagr([yearly_cashflows[year]['total_expenses'] for year in years])
        net_income_cagr: float = self._calculate_cagr([yearly_cashflows[year]['net_income'] for year in years])
        staff_count: int = 0
        for staff_member in self.management_company.staff:
            staff_count += int(staff_member.get('count', 1))
        revenue_per_employee: float = total_revenue / staff_count if staff_count > 0 else 0
        profit_per_employee: float = total_net_income / staff_count if staff_count > 0 else 0
        # Proper IRR calculation for net income cashflows
        irr: Optional[float] = None
        if npf is not None and len(years) > 1:
            cashflows = [-float(gp_commitment.get('total_commitment', 0))] + [yearly_cashflows[year]['net_income'] for year in years]
            try:
                irr_val = npf.irr(cashflows)
                irr = float(irr_val) if irr_val is not None else None
            except Exception as e:
                warnings.warn(f"IRR calculation failed: {e}")
                irr = None
        else:
            irr = net_income_cagr  # fallback
        # Robust payback period logic
        payback_period: Optional[int] = None
        cumulative_net_income: float = 0
        for year in years:
            cumulative_net_income += yearly_cashflows[year]['net_income']
            if cumulative_net_income >= float(gp_commitment.get('total_commitment', 0)):
                payback_period = int(year)
                break
        # If never reached, payback_period remains None
        return {
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'total_net_income': total_net_income,
            'profit_margin': profit_margin,
            'revenue_cagr': revenue_cagr,
            'expense_cagr': expense_cagr,
            'net_income_cagr': net_income_cagr,
            'revenue_per_employee': revenue_per_employee,
            'profit_per_employee': profit_per_employee,
            'irr': irr,
            'payback_period': payback_period
        }

    def _calculate_cagr(self, values: List[float]) -> float:
        """
        Calculate Compound Annual Growth Rate (CAGR).

        Args:
            values: List of values (all in USD)

        Returns:
            CAGR (as a decimal, e.g., 0.05 for 5% annual growth)
        """
        if len(values) < 2 or values[0] == 0:
            return 0
        start_value: float = values[0]
        end_value: float = values[-1]
        years: int = len(values) - 1
        return (end_value / start_value) ** (1 / years) - 1

    def _prepare_visualization_data(self, basic_economics: Dict[str, Any], management_company_metrics: Dict[str, Any], team_economics: Dict[str, Any], gp_cashflows: Dict[str, Dict[str, Dict[str, Any]]], gp_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare visualization data for GP entity economics.

        Args:
            basic_economics: Basic GP economics
            management_company_metrics: Management company metrics
            team_economics: Team economics
            gp_cashflows: GP cashflows
            gp_metrics: GP metrics

        Returns:
            Dictionary with visualization data
        """
        # Prepare basic economics visualization data
        basic_visualization = prepare_gp_economics_visualization_data(basic_economics)

        # Prepare expense breakdown visualization data
        expense_breakdown = {
            'labels': ['Base', 'Staff', 'Office', 'Technology', 'Marketing', 'Legal', 'Other', 'Scaled'],
            'values': [
                float(management_company_metrics['expense_breakdown']['base']),
                float(management_company_metrics['expense_breakdown']['staff']),
                float(management_company_metrics['expense_breakdown']['office']),
                float(management_company_metrics['expense_breakdown']['technology']),
                float(management_company_metrics['expense_breakdown']['marketing']),
                float(management_company_metrics['expense_breakdown']['legal']),
                float(management_company_metrics['expense_breakdown']['other']),
                float(management_company_metrics['expense_breakdown']['scaled'])
            ]
        }

        # Prepare custom expense breakdown visualization data
        custom_expense_breakdown = {}
        for expense in self.expenses:
            if expense.enabled:
                category = expense.category
                if category not in custom_expense_breakdown:
                    custom_expense_breakdown[category] = 0

                # Sum up the expense across all years
                yearly_cashflows = gp_cashflows['yearly']
                for year in yearly_cashflows:
                    if expense.name in yearly_cashflows[year]['expense_breakdown']:
                        custom_expense_breakdown[category] += yearly_cashflows[year]['expense_breakdown'][expense.name]

        custom_expense_visualization = {
            'labels': list(custom_expense_breakdown.keys()),
            'values': list(custom_expense_breakdown.values())
        }

        # Prepare team allocation visualization data
        partner_allocation = {
            'labels': list(team_economics['partner_total_compensation'].keys()),
            'values': [float(value) for value in team_economics['partner_total_compensation'].values()]
        }

        employee_allocation = {
            'labels': list(team_economics['employee_total_compensation'].keys()),
            'values': [float(value) for value in team_economics['employee_total_compensation'].values()]
        }

        # Prepare cashflow visualization data
        yearly_cashflows = gp_cashflows['yearly']
        years = sorted(yearly_cashflows.keys(), key=lambda y: int(y))

        cashflow_over_time = {
            'years': [int(year) for year in years],
            'revenue': [yearly_cashflows[year]['total_revenue'] for year in years],
            'expenses': [yearly_cashflows[year]['total_expenses'] for year in years],
            'net_income': [yearly_cashflows[year]['net_income'] for year in years],
            'dividend': [yearly_cashflows[year]['dividend'] for year in years],
            'cash_reserve': [yearly_cashflows[year]['cash_reserve'] for year in years]
        }

        # Calculate cumulative cashflow
        cumulative_net_income = []
        cumulative_dividend = []
        running_net_income = 0
        running_dividend = 0
        for year in years:
            running_net_income += yearly_cashflows[year]['net_income']
            running_dividend += yearly_cashflows[year]['dividend']
            cumulative_net_income.append(running_net_income)
            cumulative_dividend.append(running_dividend)

        cumulative_cashflow = {
            'years': [int(year) for year in years],
            'cumulative_net_income': cumulative_net_income,
            'cumulative_dividend': cumulative_dividend
        }

        # Prepare revenue breakdown visualization data
        revenue_breakdown = {
            'years': [int(year) for year in years],
            'management_fees': [yearly_cashflows[year]['management_fees'] for year in years],
            'carried_interest': [yearly_cashflows[year]['carried_interest'] for year in years],
            'origination_fees': [yearly_cashflows[year]['origination_fees'] for year in years],
            'additional_revenue': [yearly_cashflows[year]['additional_revenue'] for year in years]
        }

        # Prepare expense breakdown over time visualization data
        expense_breakdown_over_time = {
            'years': [int(year) for year in years],
            'base_expenses': [yearly_cashflows[year]['base_expenses'] for year in years],
            'custom_expenses': [yearly_cashflows[year]['custom_expenses'] for year in years]
        }

        # Prepare metrics visualization data
        metrics_summary = {
            'profit_margin': gp_metrics['profit_margin'],
            'revenue_cagr': gp_metrics['revenue_cagr'],
            'expense_cagr': gp_metrics['expense_cagr'],
            'net_income_cagr': gp_metrics['net_income_cagr'],
            'revenue_per_employee': gp_metrics['revenue_per_employee'],
            'profit_per_employee': gp_metrics['profit_per_employee'],
            'irr': gp_metrics['irr'],
            'payback_period': gp_metrics['payback_period']
        }

        # Prepare dividend visualization data
        dividend_over_time = {
            'years': [int(year) for year in years],
            'dividend': [yearly_cashflows[year]['dividend'] for year in years],
            'dividend_yield': [yearly_cashflows[year]['dividend'] / yearly_cashflows[year]['net_income'] if yearly_cashflows[year]['net_income'] > 0 else 0 for year in years]
        }

        return {
            'revenue_sources': basic_visualization['revenue_sources'],
            'yearly_revenue': basic_visualization['yearly_revenue'],
            'yearly_distributions': basic_visualization['yearly_distributions'],
            'expense_breakdown': expense_breakdown,
            'custom_expense_breakdown': custom_expense_visualization,
            'partner_allocation': partner_allocation,
            'employee_allocation': employee_allocation,
            'cashflow_over_time': cashflow_over_time,
            'cumulative_cashflow': cumulative_cashflow,
            'revenue_breakdown': revenue_breakdown,
            'expense_breakdown_over_time': expense_breakdown_over_time,
            'dividend_over_time': dividend_over_time,
            'metrics_summary': metrics_summary,
            'gp_entity_config': {
                'expenses': [expense.to_dict() for expense in self.expenses],
                'dividend_policy': self.dividend_policy.to_dict(),
                'initial_cash_reserve': float(self.initial_cash_reserve)
            }
        }
