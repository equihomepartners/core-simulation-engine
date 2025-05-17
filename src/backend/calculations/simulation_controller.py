"""
Simulation Controller Module

This module contains the SimulationController class, which serves as the central
orchestrator for the entire simulation process. It coordinates the execution of
all calculation modules in the correct sequence, ensuring that data flows properly
between them.
"""

from decimal import Decimal
import logging
import time
import uuid
import json
import os
import asyncio
from typing import Dict, Any, Optional, Callable, List, Union
import datetime
import copy
from typing import TypedDict

import jsonschema

# Import WebSocket event handlers (will be used in async context)
from api.websocket.router import (
    send_gp_entity_economics_calculation_started,
    send_gp_entity_economics_calculation_progress,
    send_gp_entity_economics_calculation_completed,
    send_gp_entity_economics_calculation_failed
)

# Import calculation modules
from .portfolio_gen import generate_portfolio_from_config
from .loan_lifecycle import model_portfolio_evolution_from_config, model_portfolio_evolution_granular
from .cash_flows import project_cash_flows, project_cash_flows_granular
from .waterfall import calculate_waterfall_distribution
from .performance import calculate_performance_metrics
# Import monte_carlo functions
try:
    from .monte_carlo import generate_market_conditions, run_monte_carlo_simulation, run_config_mc
except ImportError as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.warning(f"Production dependency missing: {e}")
    # Fallback implementation for generate_market_conditions
    def generate_market_conditions(
        years=10,
        base_appreciation_rate=0.03,
        appreciation_volatility=0.02,
        base_default_rate=0.01,
        default_volatility=0.005,
        correlation=0.3,
        seed=None
    ):
        """Fallback implementation for generate_market_conditions"""
        market_conditions = {}
        zones = ['green', 'orange', 'red']
        zone_appreciation_modifiers = {'green': 0.8, 'orange': 1.0, 'red': 1.2}
        zone_default_modifiers = {'green': 0.7, 'orange': 1.0, 'red': 1.5}

        for year in range(years + 1):
            year_str = str(year)
            appreciation_rates_by_zone = {}
            default_rates_by_zone = {}

            for zone in zones:
                appreciation_rates_by_zone[zone] = float(base_appreciation_rate * zone_appreciation_modifiers[zone])
                default_rates_by_zone[zone] = float(base_default_rate * zone_default_modifiers[zone])

            market_conditions[year_str] = {
                'appreciation_rates': appreciation_rates_by_zone,
                'default_rates': default_rates_by_zone,
                'base_appreciation_rate': float(base_appreciation_rate),
                'base_default_rate': float(base_default_rate),
                'housing_market_trend': 'stable',
                'interest_rate_environment': 'stable',
                'economic_outlook': 'stable'
            }

        return market_conditions

    def run_monte_carlo_simulation(*args, **kwargs):
        return {'monte_carlo_results': 'mocked'}
    def run_config_mc(*args, **kwargs):
        return {'summary_stats': {}}
from .gp_entity import GPEntity
from .multi_fund import MultiFundManager

# Mock imports for testing
try:
    from .optimization import optimize_portfolio
except ImportError:
    def optimize_portfolio(*args, **kwargs):
        return {'optimization_result': 'mocked'}

try:
    from .stress_testing import generate_stress_scenarios, run_stress_test
except ImportError:
    def generate_stress_scenarios(*args, **kwargs):
        return {'stress_scenarios': 'mocked'}
    def run_stress_test(*args, **kwargs):
        return {'stress_test_results': 'mocked'}

try:
    from .reporting import generate_detailed_report
except ImportError:
    def generate_detailed_report(*args, **kwargs):
        return {'report': 'mocked'}

try:
    from .external_data import MarketDataManager, generate_market_conditions_from_external_data
except ImportError:
    class MarketDataManager:
        def __init__(self, *args, **kwargs):
            pass
    def generate_market_conditions_from_external_data(*args, **kwargs):
        return {'market_conditions': 'mocked'}

# Set up logging
logger = logging.getLogger(__name__)

# --- Audit Fix: TypedDicts for config and results ---
class SimulationConfig(TypedDict, total=False):
    fund_size: int
    fund_term: int
    gp_commitment_percentage: float
    hurdle_rate: float
    carried_interest_rate: float
    waterfall_structure: str
    monte_carlo_enabled: bool
    inner_monte_carlo_enabled: bool
    num_inner_simulations: int
    optimization_enabled: bool
    stress_testing_enabled: bool
    external_data_enabled: bool
    generate_reports: bool
    gp_entity_enabled: bool
    aggregate_gp_economics: bool
    deployment_monthly_granularity: bool
    time_granularity: str
    zone_rebalancing_enabled: bool
    rebalancing_strength: float
    zone_drift_threshold: float
    zone_allocation_precision: float
    # ... add other config keys as needed ...

class SimulationResults(TypedDict, total=False):
    market_conditions: dict
    portfolio: dict
    yearly_portfolio: dict
    monthly_portfolio: dict
    cash_flows: dict
    monthly_cash_flows: dict
    waterfall_results: dict
    performance_metrics: dict
    gp_entity_economics: dict
    monte_carlo_results: dict
    leverage_metrics: dict
    inner_monte_carlo: dict
    optimization_results: dict
    stress_test_results: dict
    reports: dict
    errors: list
    # ... add other result keys as needed ...

class SimulationController:
    """Controller for the entire simulation process.

    The SimulationController coordinates the execution of all calculation modules
    in the correct sequence, ensuring that data flows properly between them.

    Attributes:
        config (Dict[str, Any]): The configuration parameters for the simulation.
        results (Dict[str, Any]): The results of the simulation.
        progress (Dict[str, Any]): The progress of the simulation.
        progress_callback (Optional[Callable]): A callback function for progress updates.
        id (str): A unique identifier for this simulation run.
    """

    def __init__(self, config: Dict[str, Any]):
        """Initialize with comprehensive configuration.

        Args:
            config (Dict[str, Any]): The configuration parameters for the simulation.

        Raises:
            ValueError: If the configuration is invalid.
        """
        # --- Audit Fix: Deep copy config to avoid mutation side effects ---
        config = copy.deepcopy(config)
        # PATCH: Set time_granularity to 'monthly' if deployment_monthly_granularity is True and time_granularity is not set
        if (
            config.get('deployment_monthly_granularity', False)
            and 'time_granularity' not in config
        ):
            config['time_granularity'] = 'monthly'
        self.config: SimulationConfig = config  # type: ignore
        self.results: SimulationResults = {}
        self.progress = {
            'current_step': None,
            'total_steps': 10,
            'progress': 0.0,
            'start_time': None,
            'estimated_completion_time': None
        }
        self.progress_callback = None
        self.id = self._generate_id()

        # Validate configuration
        self._validate_config()

        # Set default parameters
        self._set_default_parameters()

        # Initialize market data manager if external data is enabled
        self.market_data_manager = None
        if self.config.get('external_data_enabled', False):
            self.market_data_manager = MarketDataManager(self.config.get('external_data', {}))

        logger.info(f"Simulation controller initialized with ID {self.id}")

        # PATCH: Set frequency and compounding for monthly runs
        granularity = self.config.get('time_granularity', 'yearly')
        if granularity == 'monthly':
            self.config['distribution_frequency'] = 'monthly'
            self.config['preferred_return_compounding'] = 'monthly'

    def _generate_id(self) -> str:
        """Generate a unique ID for this simulation.

        Returns:
            str: A unique identifier.
        """
        return str(uuid.uuid4())

    def _validate_config(self) -> None:
        """Validate the configuration against the schema.

        Raises:
            ValueError: If the configuration is invalid.
        """
        schemas_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'schemas')
        schema_path = os.path.join(schemas_dir, 'simulation_config_schema.json')
        try:
            with open(schema_path, 'r') as f:
                schema = json.load(f)
            import jsonschema
            base_uri = f"file://{schemas_dir}/"
            resolver = jsonschema.RefResolver(base_uri=base_uri, referrer=schema)
            jsonschema.validate(instance=self.config, schema=schema, resolver=resolver)
            logger.info("Configuration validated successfully")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.warning(f"Could not load schema: {str(e)}")
            # --- Audit Fix: Make schema validation failure a hard error unless in test/dev mode ---
            if not self.config.get('dev_mode', False):
                raise ValueError(f"Schema validation failed: {str(e)}")
        except jsonschema.exceptions.ValidationError as e:
            logger.error(f"Configuration validation failed: {str(e)}")
            raise ValueError(f"Invalid configuration: {str(e)}")

    def _set_default_parameters(self) -> None:
        """Set default values for missing parameters."""
        defaults = {
            'fund_size': 100000000,
            'fund_term': 10,
            'gp_commitment_percentage': 0.0,
            'hurdle_rate': 0.08,
            'carried_interest_rate': 0.20,
            'waterfall_structure': 'european',
            'monte_carlo_enabled': False,
            'inner_monte_carlo_enabled': False,
            'num_inner_simulations': 1000,
            'optimization_enabled': False,
            'stress_testing_enabled': False,
            'external_data_enabled': False,
            'generate_reports': True,
            'gp_entity_enabled': False,
            'aggregate_gp_economics': True,
            'monte_carlo_parameters': {},
            'leverage': {},
            'deployment_monthly_granularity': False,
            'time_granularity': 'yearly',
            'zone_rebalancing_enabled': True,
            'rebalancing_strength': 0.5,
            'zone_drift_threshold': 0.1,
            'zone_allocation_precision': 0.8,
        }

        for key, value in defaults.items():
            if key not in self.config:
                self.config[key] = value
                logger.debug(f"Using default value for {key}: {value}")

    def set_progress_callback(self, callback: Callable[[str, float, str], None]) -> None:
        """Set a callback function for progress updates.

        Args:
            callback (Callable[[str, float, str], None]): A function that takes step name,
                progress percentage, and message as arguments.
        """
        self.progress_callback = callback

    def _update_progress(self, step: str, progress: float, message: str) -> None:
        """Update the progress and call the progress callback if set.

        Args:
            step (str): The current step name.
            progress (float): The progress percentage (0-1).
            message (str): A message describing the current status.
        """
        self.progress['current_step'] = step
        self.progress['progress'] = progress
        if self.progress['start_time'] is None:
            self.progress['start_time'] = time.time()
        if progress > 0:
            elapsed_time = time.time() - self.progress['start_time']
            estimated_total_time = elapsed_time / progress
            self.progress['estimated_completion_time'] = self.progress['start_time'] + estimated_total_time
        if self.progress_callback:
            try:
                self.progress_callback(step, progress, message)
            except Exception as cb_err:
                logger.warning(f"Progress callback failed: {cb_err}")
        logger.info(f"Progress update: {step} - {progress:.1%} - {message}")

    def run_simulation(self) -> Dict[str, Any]:
        """Run the entire simulation pipeline.

        Returns:
            Dict[str, Any]: The simulation results.
        """
        try:
            logger.info(f"Starting simulation run with ID {self.id}")
            self.progress['start_time'] = time.time()

            # Step 1: Generate market conditions
            self._update_progress('market_conditions', 0.1, "Generating market conditions")
            self._generate_market_conditions()

            # Step 2: Generate portfolio
            self._update_progress('portfolio', 0.2, "Generating portfolio")
            self._generate_portfolio()

            if self.config.get('inner_monte_carlo_enabled', False):
                self._update_progress('inner_monte_carlo', 0.25, 'Running inner Monte Carlo')
                try:
                    inner_results = run_config_mc(
                        self.config,
                        num_simulations=self.config.get('num_inner_simulations', 1000),
                    )
                    self.results['inner_monte_carlo'] = inner_results
                except Exception as e:
                    logger.error(f"Error running inner Monte Carlo: {str(e)}", exc_info=True)
                    self.results['inner_monte_carlo'] = {}
                    self.results['errors'] = self.results.get('errors', []) + [f"Inner Monte Carlo error: {str(e)}"]

            # Ensure time granularity is consistently applied across all calculations
            granularity = self._handle_granularity()
            logger.info(f"Simulation will use {granularity} granularity for all calculations")

            # Step 3: Simulate loan lifecycle
            self._update_progress('loan_lifecycle', 0.3, "Simulating loan lifecycle")
            self._simulate_loan_lifecycle()

            # Step 4: Calculate cash flows
            self._update_progress('cash_flows', 0.4, "Calculating cash flows")
            self._calculate_cash_flows()

            # Step 5: Calculate waterfall distribution
            self._update_progress('waterfall', 0.5, "Calculating waterfall distribution")
            self._calculate_waterfall_distribution()

            # Step 6: Calculate performance metrics
            self._update_progress('performance_metrics', 0.6, "Calculating performance metrics")
            self._calculate_performance_metrics()

            # Step 7: Calculate GP entity economics (if enabled)
            if self.config.get('gp_entity_enabled', False):
                self._update_progress('gp_entity_economics', 0.65, "Calculating GP entity economics")
                self._calculate_gp_entity_economics()

            # Step 8: Run Monte Carlo simulation (if enabled)
            if self.config.get('monte_carlo_enabled', False):
                self._update_progress('monte_carlo', 0.7, "Running Monte Carlo simulation")
                self._run_monte_carlo_simulation()

            # Step 8: Optimize portfolio (if enabled)
            if self.config.get('optimization_enabled', False):
                self._update_progress('optimization', 0.8, "Optimizing portfolio")
                self._optimize_portfolio()

            # Step 9: Perform stress testing (if enabled)
            if self.config.get('stress_testing_enabled', False):
                self._update_progress('stress_testing', 0.9, "Performing stress testing")
                self._perform_stress_testing()

            # Step 10: Generate reports (if enabled)
            if self.config.get('generate_reports', True):
                self._update_progress('reports', 0.95, "Generating reports")
                self._generate_reports()

            # Simulation completed
            self._update_progress('completed', 1.0, "Simulation completed")
            logger.info(f"Simulation run {self.id} completed successfully")
            return self.results

        except Exception as e:
            logger.error(f"Error during simulation run: {str(e)}", exc_info=True)
            self.results['error'] = str(e)
            return self.results

    def _generate_market_conditions(self) -> None:
        """Generate market conditions for the simulation.

        This method generates market conditions for the simulation period, either
        from external data sources or using synthetic data generation. Market conditions
        include appreciation rates, default rates, and other economic factors that
        affect the performance of the portfolio.

        The market conditions include:
        - Yearly appreciation rates by zone
        - Yearly default rates by zone
        - Economic indicators
        - Interest rate projections

        Returns:
            None: Results are stored in self.results['market_conditions']
        """
        logger.info("Generating market conditions")

        # Extract relevant configuration parameters for logging
        market_config = {
            'fund_term': self.config.get('fund_term', 10),
            'external_data_enabled': self.config.get('external_data_enabled', False),
            'base_appreciation_rate': self.config.get('base_appreciation_rate', 0.03),
            'appreciation_volatility': self.config.get('appreciation_volatility', 0.02),
            'base_default_rate': self.config.get('base_default_rate', 0.01),
            'default_volatility': self.config.get('default_volatility', 0.005),
            'correlation': self.config.get('correlation', 0.3)
        }
        logger.debug(f"Market conditions parameters: {market_config}")

        try:
            if self.config.get('external_data_enabled', False) and self.market_data_manager:
                logger.info("Using external data for market conditions")

                # Get zone IDs from configuration
                zone_ids = self.config.get('zone_ids', [])
                if not zone_ids:
                    logger.warning("No zone IDs provided for external data, using default zones")
                    zone_ids = ['green', 'orange', 'red']

                # Get market condition configuration
                market_condition_config = self.config.get('market_condition_config', {})

                # Generate market conditions from external data
                market_conditions = generate_market_conditions_from_external_data(
                    self.market_data_manager,
                    zone_ids,
                    self.config.get('fund_term', 10),
                    market_condition_config
                )

                logger.info(f"Generated market conditions from external data for {len(zone_ids)} zones over {self.config.get('fund_term', 10)} years")
            else:
                logger.info("Using synthetic data for market conditions")

                # Generate synthetic market conditions
                market_conditions = generate_market_conditions(
                    years=self.config.get('fund_term', 10),
                    base_appreciation_rate=self.config.get('base_appreciation_rate', 0.03),
                    appreciation_volatility=self.config.get('appreciation_volatility', 0.02),
                    base_default_rate=self.config.get('base_default_rate', 0.01),
                    default_volatility=self.config.get('default_volatility', 0.005),
                    correlation=self.config.get('correlation', 0.3),
                    seed=self.config.get('monte_carlo_seed')
                )

                logger.info(f"Generated synthetic market conditions for {self.config.get('fund_term', 10)} years")

            # Store results
            self.results['market_conditions'] = market_conditions

            # Log summary statistics
            avg_appreciation = sum(year_data.get('appreciation_rate', 0) for year_data in market_conditions.values()) / len(market_conditions) if market_conditions else 0
            avg_default = sum(year_data.get('default_rate', 0) for year_data in market_conditions.values()) / len(market_conditions) if market_conditions else 0

            logger.info(f"Market conditions generated with average appreciation rate: {avg_appreciation:.2%}, average default rate: {avg_default:.2%}")

        except Exception as e:
            logger.error(f"Error generating market conditions: {str(e)}", exc_info=True)
            self.results['market_conditions'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"Market conditions generation error: {str(e)}"]
            raise

    def _generate_portfolio(self) -> None:
        """Generate the initial portfolio.

        This method generates the initial portfolio of loans based on the configuration
        parameters. It creates a diversified portfolio with loans of varying sizes,
        terms, interest rates, and other characteristics.

        The portfolio includes:
        - Loans with different sizes
        - Loans with different terms
        - Loans with different interest rates
        - Loans in different zones (green, orange, red)
        - Loans with different LTV ratios

        Returns:
            None: Results are stored in self.results['portfolio']
        """
        logger.info("Generating portfolio")

        # Extract relevant configuration parameters for logging
        portfolio_config = {
            'fund_size': self.config.get('fund_size', 100000000),
            'avg_loan_size': self.config.get('avg_loan_size', 250000),
            'loan_size_std_dev': self.config.get('loan_size_std_dev', 50000),
            'min_loan_size': self.config.get('min_loan_size', 100000),
            'max_loan_size': self.config.get('max_loan_size', 500000),
            'avg_loan_term': self.config.get('avg_loan_term', 5),
            'avg_loan_interest_rate': self.config.get('avg_loan_interest_rate', 0.06),
            'avg_loan_ltv': self.config.get('avg_loan_ltv', 0.75),
            'zone_allocations': self.config.get('zone_allocations', {'green': 0.6, 'orange': 0.3, 'red': 0.1})
        }
        logger.debug(f"Portfolio generation parameters: {portfolio_config}")

        try:
            # Generate portfolio
            portfolio = generate_portfolio_from_config(self.config)

            # Store results
            self.results['portfolio'] = portfolio  # object
            self.results['portfolio_dict'] = portfolio.to_dict()

            # Log summary statistics
            num_loans = len(portfolio.loans) if portfolio and hasattr(portfolio, 'loans') else 0
            total_value = sum(loan.loan_amount for loan in portfolio.loans) if portfolio and hasattr(portfolio, 'loans') else 0
            avg_loan_size = total_value / num_loans if num_loans > 0 else 0

            # Count loans by zone
            zone_counts = {}
            if portfolio and hasattr(portfolio, 'loans'):
                for loan in portfolio.loans:
                    zone = loan.zone if hasattr(loan, 'zone') else 'unknown'
                    zone_counts[zone] = zone_counts.get(zone, 0) + 1

            logger.info(f"Portfolio generated with {num_loans} loans, total value: ${total_value:,.2f}, average loan size: ${avg_loan_size:,.2f}")
            logger.info(f"Zone distribution: {zone_counts}")

        except Exception as e:
            logger.error(f"Error generating portfolio: {str(e)}", exc_info=True)
            self.results['portfolio'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"Portfolio generation error: {str(e)}"]
            raise

    def _simulate_loan_lifecycle(self) -> None:
        """
        @backend
        Simulate the loan lifecycle with support for both yearly and monthly granularity.
        Stores both yearly and monthly portfolio results if requested.
        """
        logger.info("Simulating loan lifecycle")
        portfolio = self.results.get('portfolio', {})
        market_conditions = self.results.get('market_conditions', {})
        if not portfolio:
            logger.warning("Portfolio is empty or missing")
        if not market_conditions:
            logger.warning("Market conditions are empty or missing")
        lifecycle_config = {
            'fund_term': self.config.get('fund_term', 10),
            'avg_loan_exit_year': self.config.get('avg_loan_exit_year', 7),
            'exit_year_std_dev': self.config.get('exit_year_std_dev', 1.5),
            'early_exit_probability': self.config.get('early_exit_probability', 0.3),
            'reinvestment_period': self.config.get('reinvestment_period', 5)
        }
        logger.debug(f"Loan lifecycle simulation parameters: {lifecycle_config}")
        try:
            from models_pkg import Fund
            fund_config = portfolio.config if hasattr(portfolio, 'config') else self.config

            # Ensure time_granularity is present in fund_config
            if 'time_granularity' not in fund_config and 'time_granularity' in self.config:
                fund_config['time_granularity'] = self.config['time_granularity']
            elif 'time_granularity' not in fund_config:
                # Set time_granularity based on deployment_monthly_granularity
                fund_config['time_granularity'] = 'monthly' if self.config.get('deployment_monthly_granularity', False) else 'yearly'

            # Create fund instance with the config
            fund = Fund(fund_config)

            # Force time_granularity into self.config for consistency
            if 'time_granularity' not in self.config:
                # Set time_granularity based on deployment_monthly_granularity
                self.config['time_granularity'] = 'monthly' if self.config.get('deployment_monthly_granularity', False) else 'yearly'

            logger.info(f"Using time granularity: {self.config.get('time_granularity', 'monthly')}")

            # Use the granular model for portfolio evolution
            portfolio_granular = model_portfolio_evolution_granular(
                portfolio.loans if hasattr(portfolio, 'loans') else [],
                fund,
                market_conditions,
                self.config,
                self.config.get('rebalancing_strength', 1.0),
                self.config.get('zone_rebalancing_enabled', True),
            )
            granularity = self.config.get('time_granularity', 'yearly')
            if granularity == 'monthly':
                self.results['monthly_portfolio'] = portfolio_granular
            else:
                self.results['yearly_portfolio'] = portfolio_granular
            # For backward compatibility, always store yearly_portfolio if possible
            if granularity == 'monthly' and 'yearly_portfolio' not in self.results:
                # Optionally, downsample monthly to yearly here if needed
                pass
            # --- NEW: Aggregate analytics for API endpoints ---
            # 1. Per-loan analytics (stub: flatten all loans with example metrics)
            all_loans = []
            for year, year_data in portfolio_granular.items():
                for loan in year_data.get('active_loans', []) + year_data.get('exited_loans', []):
                    # Example: collect loan_id, zone, irr, moic, holding_period, status
                    all_loans.append({
                        'loan_id': getattr(loan, 'loan_id', f'loan_{id(loan)}'),
                        'zone': getattr(loan, 'zone', 'green'),
                        'irr': getattr(loan, 'irr', 0.12),
                        'moic': getattr(loan, 'moic', 1.5),
                        'holding_period': getattr(loan, 'holding_period', 5),
                        'status': getattr(loan, 'status', 'active'),
                        'reinvested': getattr(loan, 'reinvested', False),
                        'origination_year': getattr(loan, 'origination_year', 0),
                        'exit_year': getattr(loan, 'exit_year', None)
                    })
            self.results['loans'] = all_loans

            # 2. Portfolio evolution (time series)
            portfolio_evolution = {}
            for year, year_data in portfolio_granular.items():
                reinvestment_loans = year_data.get('new_reinvestments', [])
                # Support new split-exit fields or fallback to old list
                orig_exits = year_data.get('exited_loans_original', year_data.get('exited_loans', []))
                reinv_exits = year_data.get('exited_loans_reinvest', [])

                # Handle case where values are counts instead of lists
                def _count(v):
                    if isinstance(v, int):
                        return v
                    if isinstance(v, list):
                        return len(v)
                    return 0

                portfolio_evolution[year] = {
                    'active_loans': len(year_data.get('active_loans', [])),
                    'exited_loans_original': _count(orig_exits),
                    'exited_loans_reinvest': _count(reinv_exits),
                    'exited_loans': _count(orig_exits) + _count(reinv_exits),
                    'new_loans': len(reinvestment_loans),
                    'reinvestments': len(reinvestment_loans),
                    'reinvested_amount': float(sum(getattr(l, 'loan_amount', 0) if not isinstance(l, dict) else l.get('loan_amount', 0) for l in reinvestment_loans)),
                    'defaulted_loans': 0  # placeholder; could compute similar counts if needed
                }

                # Track overall reinvestment stats
                self.results.setdefault('reinvestment_stats', {
                    'reinvestment_count': 0,
                    'total_reinvested': 0.0,
                    'annual_reinvestments': {}
                })
                stats = self.results['reinvestment_stats']
                stats['reinvestment_count'] += len(reinvestment_loans)
                stats['total_reinvested'] += portfolio_evolution[year]['reinvested_amount']
                stats['annual_reinvestments'][year] = {
                    'count': len(reinvestment_loans),
                    'amount': portfolio_evolution[year]['reinvested_amount']
                }

            self.results['portfolio_evolution'] = portfolio_evolution

            # 3. Recycling ratio and capital velocity (stub)
            total_unique_loans = len({loan['loan_id'] for loan in all_loans})
            initial_loans = len(portfolio_granular[0].get('active_loans', [])) if 0 in portfolio_granular else 1
            recycling_ratio = total_unique_loans / initial_loans if initial_loans else 1
            capital_velocity = recycling_ratio  # For now, use same value
            self.results['recycling'] = {
                'recycling_ratio': recycling_ratio,
                'capital_velocity': capital_velocity
            }

            # 4. Cohort/time-slice analytics (stub: by origination year)
            cohorts = {}
            for loan in all_loans:
                cohort_year = loan.get('origination_year', 0)
                if cohort_year not in cohorts:
                    cohorts[cohort_year] = {'loans': 0, 'defaults': 0, 'avg_irr': 0, 'irr_sum': 0}
                cohorts[cohort_year]['loans'] += 1
                if loan.get('status') == 'defaulted':
                    cohorts[cohort_year]['defaults'] += 1
                cohorts[cohort_year]['irr_sum'] += loan.get('irr', 0)
            for year, data in cohorts.items():
                data['default_rate'] = data['defaults'] / data['loans'] if data['loans'] else 0
                data['avg_irr'] = data['irr_sum'] / data['loans'] if data['loans'] else 0
                del data['irr_sum']
            self.results['cohorts'] = cohorts
            # --- END NEW ---

            # Log summary statistics
            num_years = len(portfolio_granular) if portfolio_granular else 0

            # Calculate total defaults, early repayments, and new loans
            total_defaults = 0
            total_early_repayments = 0
            total_loans_originated = 0

            for _, year_data in portfolio_granular.items() if portfolio_granular else {}:
                # Count defaults from exited loans
                for loan in year_data.get('exited_loans', []):
                    if isinstance(loan, dict) and loan.get('is_default', False):
                        total_defaults += 1
                    elif hasattr(loan, 'is_default') and loan.is_default:
                        total_defaults += 1

                # Count early repayments (loans that exited before their expected exit year)
                for loan in year_data.get('exited_loans', []):
                    if isinstance(loan, dict):
                        if loan.get('actual_exit_year', 0) < loan.get('expected_exit_year', 0):
                            total_early_repayments += 1
                    elif hasattr(loan, 'actual_exit_year') and hasattr(loan, 'expected_exit_year'):
                        if loan.actual_exit_year < loan.expected_exit_year:
                            total_early_repayments += 1

                # Count new loans originated (reinvestments)
                total_loans_originated += len(year_data.get('new_reinvestments', []))

            logger.info(f"Loan lifecycle simulation completed for {num_years} years")
            logger.info(f"Total defaults: {total_defaults}, Total early repayments: {total_early_repayments}, Total new loans originated: {total_loans_originated}")

        except Exception as e:
            logger.error(f"Error simulating loan lifecycle: {str(e)}", exc_info=True)
            self.results['yearly_portfolio'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"Loan lifecycle simulation error: {str(e)}"]
            raise

    def _calculate_cash_flows(self) -> None:
        """
        @backend
        Calculate cash flows with support for both yearly and monthly granularity.
        Stores both yearly and monthly cash flow results if requested.
        """
        logger.info("Calculating cash flows")
        granularity = self.config.get('time_granularity', 'yearly')
        if granularity == 'monthly':
            portfolio = self.results.get('monthly_portfolio', {})
        else:
            portfolio = self.results.get('yearly_portfolio', {})
        market_conditions = self.results.get('market_conditions', {})
        if not portfolio:
            logger.warning(f"{granularity.capitalize()} portfolio is empty or missing")
        if not market_conditions:
            logger.warning("Market conditions are empty or missing")
        cash_flow_config = {
            'fund_size': self.config.get('fund_size', 100000000),
            'fund_term': self.config.get('fund_term', 10),
            'management_fee_rate': self.config.get('management_fee_rate', 0.02),
            'management_fee_basis': self.config.get('management_fee_basis', 'committed_capital'),
            'fund_expenses': self.config.get('fund_expenses', 0.01),
            'distribution_frequency': self.config.get('distribution_frequency', 'annual'),
            'distribution_policy': self.config.get('distribution_policy', 'available_cash'),
            'capital_call_schedule': self.config.get('capital_call_schedule', 'upfront'),
            'deployment_schedule': self.config.get('deployment_schedule', 'even')
        }
        logger.debug(f"Cash flow calculation parameters: {cash_flow_config}")
        try:
            loans = self.results.get('portfolio', {}).loans if hasattr(self.results.get('portfolio', {}), 'loans') else []
            cash_flows = project_cash_flows_granular(
                self.config,
                portfolio,
                loans,
                market_conditions
            )
            if granularity == 'monthly':
                self.results['monthly_cash_flows'] = cash_flows
            else:
                self.results['cash_flows'] = cash_flows
            # For backward compatibility, always store cash_flows if possible
            if granularity == 'monthly' and 'cash_flows' not in self.results:
                # Optionally, downsample monthly to yearly here if needed
                pass
            # ... existing logging code ...

            # ------------------------------------------------------------------
            # Leverage module – Phase 1: NAV facility on Green sleeve
            # ------------------------------------------------------------------
            try:
                from calculations.leverage_engine import process_leverage  # local import to avoid circulars

                # For v0 we approximate NAV series from yearly_portfolio total value if available
                yearly_portfolio = self.results.get('yearly_portfolio', {})
                nav_by_year = {}
                for y, data in yearly_portfolio.items():
                    total_val = data.get('portfolio_value') or data.get('total_value') or 0
                    nav_by_year[int(y)] = Decimal(str(total_val)) if total_val is not None else Decimal('0')

                lev_outputs = process_leverage(nav_by_year, self.config)

                if lev_outputs['cash_flows']:
                    # Merge interest lines into main cash_flows dict
                    for yr, cf in lev_outputs['cash_flows'].items():
                        yr_str = str(yr)
                        if yr_str not in cash_flows['years']:
                            continue  # safety guard
                        # Add interest expense as negative distribution
                        idx = cash_flows['years'].index(yr_str)
                        interest = float(cf['interest'] + cf['commitment_fee'])
                        cash_flows['net_cash_flow'][idx] -= interest
                        cash_flows['distributions'][idx] -= interest

                self.results['leverage_metrics'] = lev_outputs['metrics']
            except Exception as lev_err:
                logger.warning(f"Leverage module skipped: {lev_err}")
            logger.info("Cash flow calculation completed")
        except Exception as e:
            logger.error(f"Error calculating cash flows: {str(e)}", exc_info=True)
            self.results['cash_flows'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"Cash flow calculation error: {str(e)}"]
            raise

    def _calculate_waterfall_distribution(self) -> None:
        """Calculate waterfall distribution.

        This method calculates the waterfall distribution of cash flows between
        the General Partner (GP) and Limited Partners (LP) based on the fund's
        waterfall structure, hurdle rate, and carried interest rate.

        The waterfall distribution includes:
        - Return of capital
        - Preferred return
        - GP catch-up (if applicable)
        - Carried interest

        Returns:
            None: Results are stored in self.results['waterfall_results']
        """
        logger.info("Calculating waterfall distribution")

        # Get required inputs from previous steps
        cash_flows = self.results.get('cash_flows', {})
        market_conditions = self.results.get('market_conditions', {})
        yearly_portfolio = self.results.get('yearly_portfolio', {})

        # Validate inputs
        if not cash_flows:
            logger.warning("Cash flows are empty or missing")

        # Extract relevant configuration parameters for logging
        waterfall_config = {
            'waterfall_structure': self.config.get('waterfall_structure', 'european'),
            'hurdle_rate': self.config.get('hurdle_rate', 0.08),
            'carried_interest_rate': self.config.get('carried_interest_rate', 0.20),
            'catch_up_rate': self.config.get('catch_up_rate', 0.0),
            'gp_commitment_percentage': self.config.get('gp_commitment_percentage', 0.05)
        }
        logger.debug(f"Waterfall calculation parameters: {waterfall_config}")

        # Extract exited loans by year for loan-to-waterfall correlation
        exited_loans_by_year = {}
        if yearly_portfolio:
            for year, year_data in yearly_portfolio.items():
                # Extract exited loans for this year (including defaults)
                exited_loans = year_data.get('exited_loans', [])
                defaulted_loans = year_data.get('defaulted_loans', [])

                # Combine all loans that exited this year
                all_exited_loans = exited_loans + defaulted_loans

                if all_exited_loans:
                    exited_loans_by_year[int(year) if isinstance(year, str) else year] = all_exited_loans

        # Calculate waterfall distribution
        try:
            waterfall_results = calculate_waterfall_distribution(
                cash_flows,
                self.config,
                market_conditions,
                exited_loans_by_year
            )

            # Store results
            self.results['waterfall_results'] = waterfall_results

            # Log summary statistics
            gp_total = waterfall_results.get('total_gp_distribution', 0)
            lp_total = waterfall_results.get('total_lp_distribution', 0)
            carried_interest = waterfall_results.get('gp_carried_interest', 0)

            logger.info(f"Waterfall distribution completed with GP total: {gp_total:.2f}, LP total: {lp_total:.2f}, Carried interest: {carried_interest:.2f}")

            # Log if loan contribution data was successfully included
            if 'loan_contribution_map' in waterfall_results:
                years_with_data = len(waterfall_results['loan_contribution_map'])
                total_loans = sum(len(year_data) for year_data in waterfall_results['loan_contribution_map'].values())
                logger.info(f"Loan contribution data included for {years_with_data} years, tracking {total_loans} loans")
            else:
                logger.info("No loan contribution data was included in waterfall results")

        except Exception as e:
            logger.error(f"Error calculating waterfall distribution: {str(e)}", exc_info=True)
            self.results['waterfall_results'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"Waterfall calculation error: {str(e)}"]
            raise

    def _calculate_performance_metrics(self) -> None:
        """Calculate performance metrics.

        This method calculates various performance metrics for the fund, including:
        - Internal Rate of Return (IRR)
        - Multiple on Invested Capital (MOIC)
        - Distributed to Paid-In (DPI)
        - Residual Value to Paid-In (RVPI)
        - Total Value to Paid-In (TVPI)
        - Payback Period
        - Time to Liquidity

        Returns:
            None: Results are stored in self.results['performance_metrics']
        """
        logger.info("Calculating performance metrics")

        # Get required inputs from previous steps
        cash_flows = self.results.get('cash_flows', {})
        waterfall_results = self.results.get('waterfall_results', {})

        # Validate inputs
        if not cash_flows:
            logger.warning("Cash flows are empty or missing")
            # Log the available keys in results for debugging
            logger.debug(f"Available result keys: {list(self.results.keys())}")

        if not waterfall_results:
            logger.warning("Waterfall results are empty or missing")

        # Calculate contributions
        try:
            contributions = {
                'gp_contribution': Decimal(str(self.config.get('fund_size', 100000000))) *
                                Decimal(str(self.config.get('gp_commitment_percentage', 0.05))),
                'lp_contribution': Decimal(str(self.config.get('fund_size', 100000000))) *
                                (Decimal('1') - Decimal(str(self.config.get('gp_commitment_percentage', 0.05)))),
                'total_contribution': Decimal(str(self.config.get('fund_size', 100000000)))
            }

            logger.debug(f"Contribution calculations: GP: {contributions['gp_contribution']}, LP: {contributions['lp_contribution']}, Total: {contributions['total_contribution']}")

            # Log cash flow summary for debugging
            if cash_flows:
                years = sorted([year for year in cash_flows.keys() if isinstance(year, int)])
                logger.debug(f"Cash flow years: {years}")

                total_inflows = sum(
                    float(cash_flows[year].get('net_cash_flow', 0))
                    for year in cash_flows.keys() if isinstance(year, int) and float(cash_flows[year].get('net_cash_flow', 0)) > 0
                )
                total_outflows = sum(
                    abs(float(cash_flows[year].get('net_cash_flow', 0)))
                    for year in cash_flows.keys() if isinstance(year, int) and float(cash_flows[year].get('net_cash_flow', 0)) < 0
                )

                logger.debug(f"Total cash inflows: {total_inflows}, outflows: {total_outflows}")

                # Log individual cash flows for further debugging
                for year in years:
                    net_cf = float(cash_flows[year].get('net_cash_flow', 0))
                    logger.debug(f"Year {year} net cash flow: {net_cf}")

            # Use monthly cash flows if available and granularity is monthly
            granularity = self.config.get('time_granularity', 'yearly')
            cf_for_metrics = cash_flows
            if granularity == 'monthly' and 'monthly_cash_flows' in self.results:
                cf_for_metrics = self.results['monthly_cash_flows']
            # Calculate performance metrics
            performance_metrics = calculate_performance_metrics(
                cf_for_metrics,
                contributions
            )

            # Use raw calculated values without any relationship enforcement
            logger.info("Using raw calculated IRR values without relationship enforcement")

            # Store results
            self.results['performance_metrics'] = performance_metrics

            # Check for diagnostic info
            if 'diagnostic' in performance_metrics:
                logger.warning(f"Performance metrics diagnostic: {performance_metrics['diagnostic']}")

            # Extract and validate IRR value
            irr_value = performance_metrics.get('irr', {})
            irr_method = performance_metrics.get('irr_method', 'unknown') if 'irr_method' in performance_metrics else 'unknown'

            # Handle different IRR result formats
            if isinstance(irr_value, dict):
                logger.warning(f"IRR returned as dictionary: {irr_value}")
                irr = 0.0
            elif irr_value is None:
                logger.warning("IRR calculation returned None")
                irr = 0.0
            else:
                irr = float(irr_value) * 100  # Convert to percentage

            # Extract other metrics with careful type checking
            moic_value = performance_metrics.get('equity_multiple', {})
            moic = float(moic_value) if not isinstance(moic_value, dict) and moic_value is not None else 0.0

            tvpi_value = performance_metrics.get('tvpi', {})
            tvpi = float(tvpi_value) if not isinstance(tvpi_value, dict) and tvpi_value is not None else 0.0

            payback_period_value = performance_metrics.get('payback_period', {})
            payback_period = float(payback_period_value) if not isinstance(payback_period_value, dict) and payback_period_value is not None else 0.0

            # Log summary statistics with method information
            logger.info(f"Performance metrics calculation completed with IRR: {irr:.2f}% (method: {irr_method}), MOIC: {moic:.2f}x, TVPI: {tvpi:.2f}x, Payback Period: {payback_period:.2f} years")

        except Exception as e:
            logger.error(f"Error calculating performance metrics: {str(e)}", exc_info=True)
            self.results['performance_metrics'] = {
                'irr': 0.0,
                'equity_multiple': 0.0,
                'tvpi': 0.0,
                'payback_period': 0.0,
                'error': str(e)
            }
            self.results['errors'] = self.results.get('errors', []) + [f"Performance metrics calculation error: {str(e)}"]
            raise

    def _calculate_gp_entity_economics(self) -> None:
        """Calculate GP entity economics.

        This method calculates the economics for the GP entity based on the
        fund performance and GP entity configuration. It uses the GPEntity class
        and MultiFundManager to perform the calculations.

        The GP entity economics include:
        - Basic economics (management fees, carried interest, etc.)
        - Management company metrics
        - Team economics
        - GP commitment
        - Cashflows
        - Performance metrics
        - Visualization data

        Returns:
            None: Results are stored in self.results['gp_entity_economics']
        """
        logger.info("Calculating GP entity economics")

        # Get required inputs from previous steps
        waterfall = self.results.get('waterfall_results', {})
        yearly_portfolio = self.results.get('yearly_portfolio', {})

        # --- Granularity-aware cash flow selection ---
        granularity = self.config.get('time_granularity', 'yearly')
        if granularity == 'monthly' and 'monthly_cash_flows' in self.results:
            cash_flows = self.results['monthly_cash_flows']
        else:
            cash_flows = self.results.get('cash_flows', {})

        # Validate inputs
        if not waterfall:
            logger.warning("Waterfall distribution is empty or missing")

        if not cash_flows:
            logger.warning("Cash flows are empty or missing")

        if not yearly_portfolio:
            logger.warning("Yearly portfolio is empty or missing")

        # Extract relevant configuration parameters
        gp_entity_config = self.config.get('gp_entity', {})
        aggregate_gp_economics = self.config.get('aggregate_gp_economics', True)

        try:
            # Create multi-fund manager
            multi_fund_manager = MultiFundManager()

            # Add fund to multi-fund manager
            fund_id = self.config.get('fund_id', 'fund_1')
            multi_fund_manager.add_fund(fund_id, self.config)
            multi_fund_manager.results[fund_id] = {
                'waterfall': waterfall,
                'cash_flows': cash_flows,
                'yearly_portfolio': yearly_portfolio,
                'fund_size': self.config.get('fund_size', 0),
                'config': self.config
            }

            # Calculate GP entity economics
            self._update_progress('gp_entity_economics', 0.1, "Initializing GP entity economics calculation")

            # Send WebSocket event for calculation started
            try:
                asyncio.run(send_gp_entity_economics_calculation_started(
                    simulation_id=self.id,
                ))
            except Exception as e:
                logger.warning(f"Failed to send WebSocket event for GP entity economics calculation started: {str(e)}")

            # Send WebSocket event for calculation progress
            try:
                asyncio.run(send_gp_entity_economics_calculation_progress(
                    simulation_id=self.id,
                    progress=10,
                    step="initializing",
                    message="Initializing GP entity economics calculation"
                ))
            except Exception as e:
                logger.warning(f"Failed to send WebSocket event for GP entity economics calculation progress: {str(e)}")

            # Calculate GP entity economics
            gp_entity_economics = multi_fund_manager.calculate_gp_entity_economics(
                gp_entity_config,
                aggregate_gp_economics=aggregate_gp_economics
            )

            # Store results
            self.results['gp_entity_economics'] = gp_entity_economics

            # Log summary statistics
            total_revenue = gp_entity_economics.get('basic_economics', {}).get('total_revenue', 0)
            total_expenses = gp_entity_economics.get('metrics', {}).get('total_expenses', 0)
            total_net_income = gp_entity_economics.get('metrics', {}).get('total_net_income', 0)
            profit_margin = gp_entity_economics.get('metrics', {}).get('profit_margin', 0)

            logger.info(f"GP entity economics calculated: Total Revenue: ${total_revenue:,.2f}, Total Expenses: ${total_expenses:,.2f}, Net Income: ${total_net_income:,.2f}, Profit Margin: {profit_margin:.2%}")
            self._update_progress('gp_entity_economics', 1.0, "GP entity economics calculation completed")

            # Send WebSocket event for calculation completed
            try:
                summary = {
                    'total_revenue': total_revenue,
                    'total_expenses': total_expenses,
                    'total_net_income': total_net_income,
                    'profit_margin': profit_margin
                }
                asyncio.run(send_gp_entity_economics_calculation_completed(
                    simulation_id=self.id,
                    summary=summary
                ))
            except Exception as e:
                logger.warning(f"Failed to send WebSocket event for GP entity economics calculation completed: {str(e)}")

        except Exception as e:
            error_message = f"Error calculating GP entity economics: {str(e)}"
            logger.error(error_message, exc_info=True)
            self.results['gp_entity_economics'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"GP entity economics calculation error: {str(e)}"]
            self._update_progress('gp_entity_economics', 1.0, f"GP entity economics calculation failed: {str(e)}")

            # Send WebSocket event for calculation failed
            try:
                asyncio.run(send_gp_entity_economics_calculation_failed(
                    simulation_id=self.id,
                    error=error_message
                ))
            except Exception as ws_error:
                logger.warning(f"Failed to send WebSocket event for GP entity economics calculation failed: {str(ws_error)}")

            raise

    def _run_monte_carlo_simulation(self) -> None:
        """Run Monte Carlo simulation.

        This method runs a Monte Carlo simulation to analyze the range of possible
        outcomes for the fund. It generates multiple scenarios with varying market
        conditions and calculates performance metrics for each scenario.

        The Monte Carlo simulation provides:
        - Distribution of possible IRRs
        - Distribution of possible MOICs
        - Confidence intervals for performance metrics
        - Sensitivity analysis to various parameters

        Note:
        When calling run_monte_carlo_simulation, always use named parameters to avoid
        parameter mismatches. The function accepts only one positional parameter (fund_params),
        and all other parameters should be passed by name.

        Returns:
            None: Results are stored in self.results['monte_carlo_results']
        """
        logger.info("Running Monte Carlo simulation")

        # Get required inputs from previous steps
        portfolio = self.results.get('portfolio', {})

        # Validate inputs
        if not portfolio:
            logger.warning("Portfolio is empty or missing")

        # Extract relevant configuration parameters for logging
        monte_carlo_config = {
            'num_simulations': self.config.get('num_simulations', 1000),
            'variation_factor': self.config.get('variation_factor', 0.1),
            'monte_carlo_seed': self.config.get('monte_carlo_seed', None)
        }
        logger.debug(f"Monte Carlo simulation parameters: {monte_carlo_config}")

        # Run Monte Carlo simulation
        try:
            monte_carlo_results = run_monte_carlo_simulation(
                fund_params=portfolio,
                num_simulations=self.config.get('num_simulations', 1000),
                variation_factor=self.config.get('variation_factor', 0.1),
                seed=self.config.get('monte_carlo_seed', None),
                monte_carlo_parameters=self.config.get('monte_carlo_parameters'),
                time_granularity=self.config.get('time_granularity', 'yearly'),
            )

            # Store results
            self.results['monte_carlo_results'] = monte_carlo_results

            # Log summary statistics
            mean_irr = monte_carlo_results.get('mean_irr', 0) * 100
            median_irr = monte_carlo_results.get('median_irr', 0) * 100
            irr_std_dev = monte_carlo_results.get('irr_std_dev', 0) * 100
            percentile_5_irr = monte_carlo_results.get('percentile_5_irr', 0) * 100
            percentile_95_irr = monte_carlo_results.get('percentile_95_irr', 0) * 100

            logger.info(f"Monte Carlo simulation completed with {self.config.get('num_simulations', 1000)} iterations")
            logger.info(f"Mean IRR: {mean_irr:.2f}%, Median IRR: {median_irr:.2f}%, IRR Std Dev: {irr_std_dev:.2f}%")
            logger.info(f"90% Confidence Interval for IRR: [{percentile_5_irr:.2f}%, {percentile_95_irr:.2f}%]")

        except Exception as e:
            logger.error(f"Error running Monte Carlo simulation: {str(e)}", exc_info=True)
            self.results['monte_carlo_results'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"Monte Carlo simulation error: {str(e)}"]
            raise

    def _optimize_portfolio(self) -> None:
        """Optimize portfolio.

        This method optimizes the portfolio allocation across different zones
        (green, orange, red) to maximize returns for a given level of risk or
        minimize risk for a given level of returns.

        The optimization provides:
        - Efficient frontier of optimal portfolios
        - Maximum Sharpe ratio portfolio
        - Minimum volatility portfolio
        - Optimal zone allocations

        Returns:
            None: Results are stored in self.results['optimization_results']
        """
        logger.info("Optimizing portfolio")

        # Get required inputs from previous steps
        monte_carlo_results = self.results.get('monte_carlo_results', {})
        performance_metrics = self.results.get('performance_metrics', {})

        # Validate inputs
        if not monte_carlo_results and not performance_metrics:
            logger.warning("Monte Carlo results and performance metrics are empty or missing")

        # Extract zone returns, risks, and correlations from results
        try:
            # Get zone returns, risks, and correlations from results
            zone_returns = {}
            zone_risks = {}
            zone_correlations = {}

            # Extract data from Monte Carlo results or performance metrics
            if monte_carlo_results:
                # Extract zone-specific returns and risks from Monte Carlo results
                zone_simulations = monte_carlo_results.get('zone_simulations', {})
                for zone, simulations in zone_simulations.items():
                    zone_returns[zone] = simulations.get('mean_return', 0)
                    zone_risks[zone] = simulations.get('std_dev', 0)

                # Extract zone correlations from Monte Carlo results
                zone_correlations = monte_carlo_results.get('zone_correlations', {})
            else:
                # Use default values based on configuration
                for zone in ['green', 'orange', 'red']:
                    zone_returns[zone] = self.config.get('appreciation_rates', {}).get(zone, 0)
                    zone_risks[zone] = self.config.get('appreciation_std_dev', {}).get(zone, 0)

                # Use default correlation matrix
                zone_correlations = {
                    'green': {'green': 1.0, 'orange': 0.5, 'red': 0.2},
                    'orange': {'green': 0.5, 'orange': 1.0, 'red': 0.6},
                    'red': {'green': 0.2, 'orange': 0.6, 'red': 1.0}
                }

            # Extract relevant configuration parameters for logging
            optimization_config = {
                'optimization_objective': self.config.get('optimization_objective', 'max_sharpe'),
                'risk_free_rate': self.config.get('risk_free_rate', 0.03),
                'min_allocation': self.config.get('min_allocation', 0.0),
                'max_allocation': self.config.get('max_allocation', 1.0)
            }
            logger.debug(f"Portfolio optimization parameters: {optimization_config}")

            # Run portfolio optimization
            optimization_results = optimize_portfolio(
                self.config,
                zone_returns,
                zone_risks,
                zone_correlations
            )

            # Store results
            self.results['optimization_results'] = optimization_results

            # Log summary statistics
            optimal_allocations = optimization_results.get('optimal_allocations', {})
            expected_return = optimization_results.get('expected_return', 0) * 100
            expected_risk = optimization_results.get('expected_risk', 0) * 100
            sharpe_ratio = optimization_results.get('sharpe_ratio', 0)

            logger.info(f"Portfolio optimization completed with objective: {optimization_config['optimization_objective']}")
            logger.info(f"Optimal allocations: {optimal_allocations}")
            logger.info(f"Expected return: {expected_return:.2f}%, Expected risk: {expected_risk:.2f}%, Sharpe ratio: {sharpe_ratio:.2f}")

        except Exception as e:
            logger.error(f"Error optimizing portfolio: {str(e)}", exc_info=True)
            self.results['optimization_results'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"Portfolio optimization error: {str(e)}"]
            raise

    def _perform_stress_testing(self) -> None:
        """Perform stress testing.

        This method performs stress testing on the portfolio to analyze how it
        would perform under various adverse scenarios. It generates stress scenarios
        based on the configuration and runs simulations for each scenario.

        The stress testing provides:
        - Performance under specific adverse scenarios
        - Sensitivity to various risk factors
        - Worst-case scenario analysis
        - Resilience assessment

        Returns:
            None: Results are stored in self.results['stress_test_results']
        """
        logger.info("Performing stress testing")

        # Get required inputs from previous steps
        portfolio = self.results.get('portfolio', {})

        # Validate inputs
        if not portfolio:
            logger.warning("Portfolio is empty or missing")

        # Extract relevant configuration parameters for logging
        stress_config = self.config.get('stress_config', {})
        individual_scenarios = stress_config.get('individual_scenarios', {})
        combined_scenarios = stress_config.get('combined_scenarios', {})

        logger.debug(f"Stress testing configuration: {len(individual_scenarios)} individual scenarios, {len(combined_scenarios)} combined scenarios")

        try:
            # Generate stress scenarios
            stress_scenarios = generate_stress_scenarios(
                portfolio,
                stress_config
            )

            # Run stress test
            stress_test_results = run_stress_test(
                stress_scenarios,
                self.config
            )

            # Store results
            self.results['stress_test_results'] = stress_test_results

            # Log summary statistics
            scenario_count = len(stress_test_results.get('scenarios', {}))
            worst_scenario = stress_test_results.get('worst_scenario', {})
            worst_irr = worst_scenario.get('irr', 0) * 100 if worst_scenario else 0
            worst_moic = worst_scenario.get('moic', 0) if worst_scenario else 0

            logger.info(f"Stress testing completed with {scenario_count} scenarios")
            logger.info(f"Worst scenario: {worst_scenario.get('name', 'Unknown')}, IRR: {worst_irr:.2f}%, MOIC: {worst_moic:.2f}x")

        except Exception as e:
            logger.error(f"Error performing stress testing: {str(e)}", exc_info=True)
            self.results['stress_test_results'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"Stress testing error: {str(e)}"]
            raise

    def _generate_reports(self) -> None:
        """Generate reports.

        This method generates detailed reports based on the simulation results.
        It formats the results into various report templates for different audiences,
        such as fund managers, investors, or analysts.

        The reports include:
        - Summary reports
        - Detailed performance reports
        - Investor-focused reports
        - Manager-focused reports
        - Charts and visualizations

        Returns:
            None: Results are stored in self.results['reports']
        """
        logger.info("Generating reports")

        # Extract relevant configuration parameters for logging
        report_config = self.config.get('report_config', {})
        report_template = report_config.get('report_template', 'summary')
        export_format = report_config.get('export_format', 'json')
        include_charts = report_config.get('include_charts', True)

        logger.debug(f"Report generation parameters: template={report_template}, format={export_format}, include_charts={include_charts}")

        try:
            # Generate detailed report
            report = generate_detailed_report(
                self.results,
                report_config
            )

            # Store results
            self.results['reports'] = report

            # Log summary statistics
            report_count = len(report.get('reports', []))
            chart_count = len(report.get('charts', []))

            logger.info(f"Report generation completed with {report_count} reports and {chart_count} charts")
            logger.info(f"Report template: {report_template}, Export format: {export_format}")

        except Exception as e:
            logger.error(f"Error generating reports: {str(e)}", exc_info=True)
            self.results['reports'] = {}
            self.results['errors'] = self.results.get('errors', []) + [f"Report generation error: {str(e)}"]
            # Don't raise the exception, just log it and continue
            # This allows the simulation to complete even if report generation fails

    def get_progress(self) -> Dict[str, Any]:
        """Get the current progress of the simulation.

        Returns:
            Dict[str, Any]: The progress information.
        """
        return self.progress

    def get_results(self) -> Dict[str, Any]:
        """Get the simulation results.

        Returns:
            Dict[str, Any]: The simulation results.
        """
        return self.results

    def get_config(self) -> Dict[str, Any]:
        """Get the simulation configuration.

        Returns:
            Dict[str, Any]: The simulation configuration.
        """
        return self.config

    def get_id(self) -> str:
        """Get the simulation ID.

        Returns:
            str: The simulation ID.
        """
        return self.id

    def _push_ws(self, payload: Dict[str, Any]) -> None:
        """Send an incremental update to the WebSocket manager.

        This helper enriches the payload with required identifiers and schedules
        the coroutine on the running event‑loop so it can be called from the
        worker thread without awaiting.  If the event‑loop is not yet up (unit
        tests), the call is silently ignored.
        """
        try:
            from api.websocket.connection_manager import connection_manager as _manager  # Local import to avoid circular ref in tests
            import asyncio
            loop = asyncio.get_running_loop()
            # Ensure mandatory metadata
            payload.setdefault("simulation_id", self.id)
            payload.setdefault("status", "running")
            payload.setdefault("updated_at", datetime.datetime.now().timestamp())
            # Schedule the coroutine in a thread‑safe way
            asyncio.run_coroutine_threadsafe(_manager.send_update(self.id, payload), loop)  # type: ignore
        except RuntimeError:
            # Not in an asyncio context (e.g. unit tests) – skip
            pass
        except Exception as ws_err:  # pragma: no‑cover – log but never break the simulation
            logger.warning(f"WebSocket push failed: {ws_err}")

    def _handle_granularity(self):
        """
        Normalize granularity-related config and ensure consistency across all components.

        This ensures that when time_granularity is set to 'monthly', all related settings
        are consistently set to use monthly calculations.

        Returns:
            str: The normalized time granularity setting ('yearly' or 'monthly')
        """
        granularity = self.config.get('time_granularity', 'yearly')
        logger.debug(f"Handling granularity: current setting is {granularity}")

        # Normalize granularity naming
        if granularity in ['monthly', 'month']:
            granularity = 'monthly'
            self.config['time_granularity'] = 'monthly'
        elif granularity in ['yearly', 'annual', 'year']:
            granularity = 'yearly'
            self.config['time_granularity'] = 'yearly'

        # Ensure proper configuration for monthly granularity
        if granularity == 'monthly':
            logger.info("Using monthly granularity for all calculations")
            self.config['distribution_frequency'] = 'monthly'
            self.config['preferred_return_compounding'] = 'monthly'
            self.config['deployment_monthly_granularity'] = True

            # Log that we're using monthly granularity
            logger.debug("Monthly granularity settings applied: distribution_frequency=monthly, preferred_return_compounding=monthly")
        else:
            # For yearly, ensure we're not using monthly settings unintentionally
            if self.config.get('deployment_monthly_granularity') == True:
                logger.debug("Note: deployment_monthly_granularity is True but time_granularity is yearly")

        return granularity

    def _calculate_recycling_ratio(self, all_loans, portfolio_granular):
        """Audit Fix: Utility for recycling ratio with error logging."""
        total_unique_loans = len({loan['loan_id'] for loan in all_loans})
        initial_loans = len(portfolio_granular.get(0, {}).get('active_loans', [])) if 0 in portfolio_granular else 0
        if initial_loans == 0:
            logger.error("Initial loans is zero when calculating recycling ratio. Possible data issue.")
            raise ValueError("Initial loans is zero; cannot compute recycling ratio.")
        recycling_ratio = total_unique_loans / initial_loans
        return recycling_ratio
