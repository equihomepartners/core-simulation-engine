"""
Multi-Fund and Tranche Management Module

This module provides functionality for managing multiple funds and tranches
within the simulation engine. It allows for:
1. Running simulations for multiple funds with different parameters
2. Dividing a single fund into multiple tranches with sequenced deployments
3. Aggregating results across funds and tranches for consolidated reporting

Result Structure:
self.results = {
    fund_id: { ... individual simulation results ... },
    tranche_id: { ... individual simulation results ... },
    'aggregated': { ... aggregated metrics ... },
    'errors': [ ... error messages ... ]
}
"""

from typing import Dict, List, Any, Optional, Callable
import copy
import logging
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import json

# Import the simulation controller - will be imported at runtime to avoid circular imports
# from .simulation_controller import SimulationController

# Import GP economics functions
from .gp_economics import aggregate_gp_economics, generate_gp_economics_report, prepare_gp_economics_visualization_data

# Import GP entity model
from .gp_entity import GPEntity

logger = logging.getLogger(__name__)

# --- Schema validation utility ---
def validate_config_schema(config: Dict[str, Any]) -> Optional[str]:
    """Validate config against simulation schema. Returns error string if invalid, else None."""
    try:
        from .simulation_controller import SimulationConfig
        schemas_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'schemas')
        schema_path = os.path.join(schemas_dir, 'simulation_config_schema.json')
        with open(schema_path, 'r') as f:
            schema = json.load(f)
        import jsonschema
        base_uri = f"file://{schemas_dir}/"
        resolver = jsonschema.RefResolver(base_uri=base_uri, referrer=schema)
        jsonschema.validate(instance=config, schema=schema, resolver=resolver)
        return None
    except Exception as e:
        return str(e)

# --- Base class for shared logic ---
class BaseFundManager:
    """
    Base class for MultiFundManager and TrancheManager to DRY up shared logic.
    """
    def __init__(self):
        self.funds: Dict[str, Dict[str, Any]] = {}
        self.tranches: Dict[str, Dict[str, Any]] = {}
        self.fund_groups: Dict[str, List[str]] = {}
        self.results: Dict[str, Any] = {}
        self.errors: List[str] = []

    def _aggregate_cash_flows(self, source_cash_flows: Dict[str, Dict[str, float]],
                             target_cash_flows: Dict[str, Dict[str, float]]) -> None:
        for year, cf in source_cash_flows.items():
            if year not in target_cash_flows:
                target_cash_flows[year] = {
                    'capital_calls': 0,
                    'loan_deployments': 0,
                    'interest_income': 0,
                    'appreciation_income': 0,
                    'exit_proceeds': 0,
                    'management_fees': 0,
                    'fund_expenses': 0,
                    'reinvestment': 0,
                    'net_cash_flow': 0
                }
            for key in target_cash_flows[year].keys():
                if key in cf:
                    target_cash_flows[year][key] += cf[key]

    def _log_and_store_error(self, msg: str) -> None:
        logger.error(msg)
        self.errors.append(msg)
        self.results.setdefault('errors', []).append(msg)

# --- MultiFundManager ---
class MultiFundManager(BaseFundManager):
    """
    Manager for running and coordinating multiple fund simulations.
    See file docstring for result structure.
    """
    def add_fund(self, fund_id: str, config: Dict[str, Any]) -> None:
        if fund_id in self.funds:
            logger.warning(f"Fund with ID {fund_id} already exists. Overwriting.")
        self.funds[fund_id] = copy.deepcopy(config)
        logger.info(f"Added fund with ID {fund_id}")

    def add_tranche(self, tranche_id: str, config: Dict[str, Any], fund_group: Optional[str] = None) -> None:
        if tranche_id in self.tranches:
            logger.warning(f"Tranche with ID {tranche_id} already exists. Overwriting.")
        self.tranches[tranche_id] = copy.deepcopy(config)
        if fund_group:
            if fund_group not in self.fund_groups:
                self.fund_groups[fund_group] = []
            self.fund_groups[fund_group].append(tranche_id)
        logger.info(f"Added tranche with ID {tranche_id}")

    def run_simulations(self, max_workers: int = 4) -> Dict[str, Any]:
        """
        Run simulations for all funds and tranches in parallel and aggregate results.
        Returns dict containing results for each fund/tranche and aggregated metrics.
        """
        from .simulation_controller import SimulationController
        self.results = {}
        self.errors = []
        self.results['errors'] = []
        futures = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Funds
            for fund_id, config in self.funds.items():
                error = validate_config_schema(config)
                if error:
                    self._log_and_store_error(f"Invalid config for fund {fund_id}: {error}")
                    continue
                futures.append((fund_id, executor.submit(self._run_simulation_safe, SimulationController, config, fund_id)))
            # Tranches
            for tranche_id, config in self.tranches.items():
                error = validate_config_schema(config)
                if error:
                    self._log_and_store_error(f"Invalid config for tranche {tranche_id}: {error}")
                    continue
                futures.append((tranche_id, executor.submit(self._run_simulation_safe, SimulationController, config, tranche_id)))
            for sim_id, future in futures:
                try:
                    result = future.result()
                    if result is not None:
                        self.results[sim_id] = result
                        logger.info(f"Completed simulation for {sim_id}")
                except Exception as e:
                    self._log_and_store_error(f"Simulation failed for {sim_id}: {e}")
        # Aggregate results
        aggregated_results = self._aggregate_results()
        self.results['aggregated'] = aggregated_results
        logger.info("Completed all simulations")
        return self.results

    def _run_simulation_safe(self, SimulationController: Callable, config: Dict[str, Any], sim_id: str) -> Optional[Dict[str, Any]]:
        try:
            simulation = SimulationController(config)
            result = simulation.run_simulation()
            # Patch: Ensure yearly_portfolio is included in results for export
            if hasattr(simulation, 'results') and 'yearly_portfolio' in simulation.results:
                result['yearly_portfolio'] = simulation.results['yearly_portfolio']
            return result
        except Exception as e:
            self._log_and_store_error(f"Exception in simulation for {sim_id}: {e}")
            return None

    def get_aggregated_results(self) -> Dict[str, Any]:
        if 'aggregated' not in self.results:
            self.run_simulations()
        return self.results.get('aggregated', {})

    def get_aggregated_gp_economics(self) -> Dict[str, Any]:
        if not self.results:
            self.run_simulations()
        gp_economics = generate_gp_economics_report(self.results)
        self.results['gp_economics'] = gp_economics
        self.results['gp_economics_visualization'] = prepare_gp_economics_visualization_data(gp_economics)
        return gp_economics

    def calculate_gp_entity_economics(self, gp_entity_config: Dict[str, Any]) -> Dict[str, Any]:
        if not self.results:
            self.run_simulations()
        gp_entity = GPEntity(gp_entity_config)
        gp_entity_economics = gp_entity.calculate_economics(self.results)
        self.results['gp_entity_economics'] = gp_entity_economics
        return gp_entity_economics

    def _aggregate_results(self) -> Dict[str, Any]:
        logger.info("Aggregating results across funds and tranches")
        if not self.results:
            logger.warning("No results to aggregate")
            return {}
        aggregated = {
            'total_fund_size': 0,
            'total_loan_count': 0,
            'weighted_irr': 0,
            'weighted_multiple': 0,
            'aggregated_cash_flows': {},
            'funds': {},
            'tranches': {},
            'fund_groups': {},
            'errors': self.errors
        }
        total_invested = 0
        total_returned = 0
        # Funds
        if self.funds:
            for fund_id, config in self.funds.items():
                fund_size = config.get('fund_size', 0)
                aggregated['total_fund_size'] += fund_size
                aggregated['funds'][fund_id] = {
                    'fund_size': fund_size,
                    'loan_count': 0,
                    'irr': 0,
                    'multiple': 0
                }
                if fund_id in self.results:
                    results = self.results[fund_id]
                    if 'performance_metrics' in results:
                        perf = results['performance_metrics']
                        aggregated['funds'][fund_id].update({
                            'irr': perf.get('irr', 0) if not isinstance(perf.get('irr', 0), dict) else 0,
                            'multiple': perf.get('multiple', 0) if not isinstance(perf.get('multiple', 0), dict) else 0
                        })
                    if 'portfolio' in results:
                        portfolio = results['portfolio']
                        if hasattr(portfolio, 'loans'):
                            loan_count = len(portfolio.loans)
                        else:
                            loan_count = portfolio.get('loan_count', 0)
                        aggregated['total_loan_count'] += loan_count
                        aggregated['funds'][fund_id]['loan_count'] = loan_count
                    if 'cash_flows' in results:
                        self._aggregate_cash_flows(results['cash_flows'], aggregated['aggregated_cash_flows'])
        # Tranches
        if self.tranches:
            for tranche_id, config in self.tranches.items():
                tranche_size = config.get('fund_size', 0)
                aggregated['total_fund_size'] += tranche_size
                aggregated['tranches'][tranche_id] = {
                    'size': tranche_size,
                    'deploy_start': config.get('deploy_start', 0),
                    'deploy_period': config.get('deployment_period', 1),
                    'loan_count': 0,
                    'irr': 0,
                    'multiple': 0
                }
                if tranche_id in self.results:
                    results = self.results[tranche_id]
                    if 'performance_metrics' in results:
                        perf = results['performance_metrics']
                        aggregated['tranches'][tranche_id].update({
                            'irr': perf.get('irr', 0) if not isinstance(perf.get('irr', 0), dict) else 0,
                            'multiple': perf.get('multiple', 0) if not isinstance(perf.get('multiple', 0), dict) else 0,
                            'total_returned': perf.get('total_returned', 0) if not isinstance(perf.get('total_returned', 0), dict) else 0
                        })
                    if 'portfolio' in results:
                        portfolio = results['portfolio']
                        if hasattr(portfolio, 'loans'):
                            loan_count = len(portfolio.loans)
                        else:
                            loan_count = portfolio.get('loan_count', 0)
                        aggregated['total_loan_count'] += loan_count
                        aggregated['tranches'][tranche_id]['loan_count'] = loan_count
                    if 'cash_flows' in results:
                        self._aggregate_cash_flows(results['cash_flows'], aggregated['aggregated_cash_flows'])
                        for year, cf in results['cash_flows'].items():
                            if cf.get('capital_calls', 0) > 0:
                                total_invested += cf['capital_calls']
                            if cf.get('net_cash_flow', 0) > 0 and year != 0:
                                total_returned += cf['net_cash_flow']
        # Fund groups
        if self.fund_groups:
            for group_id, tranche_ids in self.fund_groups.items():
                group_size = 0
                group_loan_count = 0
                group_weighted_irr = 0
                group_weighted_multiple = 0
                for tranche_id in tranche_ids:
                    if tranche_id in aggregated['tranches']:
                        tranche = aggregated['tranches'][tranche_id]
                        group_size += tranche['size']
                        group_loan_count += tranche.get('loan_count', 0)
                for tranche_id in tranche_ids:
                    if tranche_id in aggregated['tranches']:
                        tranche = aggregated['tranches'][tranche_id]
                        weight = tranche['size'] / group_size if group_size > 0 else 0
                        irr_value = tranche.get('irr', 0)
                        multiple_value = tranche.get('multiple', 0)
                        if isinstance(irr_value, dict):
                            irr_value = 0
                        if isinstance(multiple_value, dict):
                            multiple_value = 0
                        group_weighted_irr += float(irr_value) * weight
                        group_weighted_multiple += float(multiple_value) * weight
                aggregated['fund_groups'][group_id] = {
                    'size': group_size,
                    'tranche_count': len(tranche_ids),
                    'loan_count': group_loan_count,
                    'irr': group_weighted_irr,
                    'multiple': group_weighted_multiple
                }
        # Weighted metrics
        total_size = aggregated['total_fund_size']
        if total_size > 0:
            for fund_id, fund in aggregated['funds'].items():
                weight = fund['fund_size'] / total_size
                irr_value = fund.get('irr', 0)
                multiple_value = fund.get('multiple', 0)
                if isinstance(irr_value, dict):
                    irr_value = 0
                if isinstance(multiple_value, dict):
                    multiple_value = 0
                aggregated['weighted_irr'] += float(irr_value) * weight
                aggregated['weighted_multiple'] += float(multiple_value) * weight
            for tranche_id, tranche in aggregated['tranches'].items():
                weight = tranche['size'] / total_size
                irr_value = tranche.get('irr', 0)
                multiple_value = tranche.get('multiple', 0)
                if isinstance(irr_value, dict):
                    irr_value = 0
                if isinstance(multiple_value, dict):
                    multiple_value = 0
                aggregated['weighted_irr'] += float(irr_value) * weight
                aggregated['weighted_multiple'] += float(multiple_value) * weight
        if self.tranches:
            aggregated['total_invested'] = total_invested
            aggregated['total_returned'] = total_returned
        logger.info("Completed aggregation of results")
        return aggregated

# --- TrancheManager ---
class TrancheManager(BaseFundManager):
    """
    Manager for dividing a fund into multiple tranches with sequenced deployments.
    See file docstring for result structure.
    """
    def __init__(self, base_config: Dict[str, Any]):
        super().__init__()
        self.base_config = copy.deepcopy(base_config)
    def add_tranche(self, tranche_id: str, tranche_config: Dict[str, Any]) -> None:
        if tranche_id in self.tranches:
            logger.warning(f"Tranche with ID {tranche_id} already exists. Overwriting.")
        self.tranches[tranche_id] = copy.deepcopy(tranche_config)
        logger.info(f"Added tranche with ID {tranche_id}")
    def run_simulations(self, max_workers: int = 4) -> Dict[str, Any]:
        from .simulation_controller import SimulationController
        self.results = {}
        self.errors = []
        self.results['errors'] = []
        futures = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            for tranche_id, tranche_config in self.tranches.items():
                config = copy.deepcopy(self.base_config)
                config.update(tranche_config)
                error = validate_config_schema(config)
                if error:
                    self._log_and_store_error(f"Invalid config for tranche {tranche_id}: {error}")
                    continue
                futures.append((tranche_id, executor.submit(self._run_simulation_safe, SimulationController, config, tranche_id)))
            for sim_id, future in futures:
                try:
                    result = future.result()
                    if result is not None:
                        self.results[sim_id] = result
                        logger.info(f"Completed simulation for {sim_id}")
                except Exception as e:
                    self._log_and_store_error(f"Simulation failed for {sim_id}: {e}")
        aggregated_results = self._aggregate_results()
        self.results['aggregated'] = aggregated_results
        logger.info("Completed all tranche simulations")
        return self.results
    def get_aggregated_gp_economics(self) -> Dict[str, Any]:
        if 'gp_economics' not in self.results:
            self.run_simulations()
        return self.results.get('gp_economics', {})
    def calculate_gp_entity_economics(self, gp_entity_config: Dict[str, Any]) -> Dict[str, Any]:
        if not self.results:
            self.run_simulations()
        gp_entity = GPEntity(gp_entity_config)
        gp_entity_economics = gp_entity.calculate_economics(self.results)
        self.results['gp_entity_economics'] = gp_entity_economics
        return gp_entity_economics
    def _aggregate_results(self) -> Dict[str, Any]:
        logger.info("Aggregating results across tranches")
        if not self.results:
            logger.warning("No tranche results to aggregate")
            return {}
        aggregated = {
            'total_fund_size': 0,
            'total_loan_count': 0,
            'cash_flows_by_year': {},
            'performance_metrics': {},
            'tranche_metrics': [],
            'errors': self.errors
        }
        for tranche_id, tranche_config in self.tranches.items():
            tranche_size = tranche_config.get('fund_size', 0)
            aggregated['total_fund_size'] += tranche_size
        for tranche_id, results in self.results.items():
            tranche_size = self.tranches[tranche_id].get('fund_size', 0)
            tranche_metrics = {
                'tranche_id': tranche_id,
                'tranche_size': tranche_size,
                'deployment_start': self.tranches[tranche_id].get('deployment_start', 0),
                'deployment_period': self.tranches[tranche_id].get('deployment_period', 1)
            }
            if 'performance_metrics' in results:
                perf = results['performance_metrics']
                tranche_metrics.update({
                    'irr': perf.get('irr', 0) if not isinstance(perf.get('irr', 0), dict) else 0,
                    'multiple': perf.get('multiple', 0) if not isinstance(perf.get('multiple', 0), dict) else 0,
                    'total_returned': perf.get('total_returned', 0) if not isinstance(perf.get('total_returned', 0), dict) else 0
                })
            if 'portfolio' in results:
                portfolio = results['portfolio']
                if hasattr(portfolio, 'loans'):
                    loan_count = len(portfolio.loans)
                else:
                    loan_count = portfolio.get('loan_count', 0)
                aggregated['total_loan_count'] += loan_count
                tranche_metrics['loan_count'] = loan_count
            aggregated['tranche_metrics'].append(tranche_metrics)
            if 'cash_flows' in results:
                for year, cf in results['cash_flows'].items():
                    if year not in aggregated['cash_flows_by_year']:
                        aggregated['cash_flows_by_year'][year] = {
                            'capital_calls': 0,
                            'loan_deployments': 0,
                            'interest_income': 0,
                            'appreciation_income': 0,
                            'exit_proceeds': 0,
                            'management_fees': 0,
                            'fund_expenses': 0,
                            'net_cash_flow': 0
                        }
                    for key in aggregated['cash_flows_by_year'][year].keys():
                        if key in cf:
                            aggregated['cash_flows_by_year'][year][key] += cf[key]
        irr = self._calculate_fund_irr(aggregated['cash_flows_by_year'])
        total_invested = 0
        total_returned = 0
        for year, cf in aggregated['cash_flows_by_year'].items():
            if cf.get('capital_calls', 0) > 0:
                total_invested += cf['capital_calls']
            if cf.get('net_cash_flow', 0) > 0:
                total_returned += cf['net_cash_flow']
        multiple = total_returned / total_invested if total_invested > 0 else 0
        aggregated['performance_metrics'] = {
            'irr': irr,
            'multiple': multiple,
            'total_fund_size': aggregated['total_fund_size'],
            'total_loan_count': aggregated['total_loan_count'],
            'total_invested': total_invested,
            'total_returned': total_returned
        }
        logger.info("Completed aggregation of tranche results")
        return aggregated
    def _calculate_fund_irr(self, cash_flows_by_year: Dict[int, Dict[str, float]]) -> float:
        years = sorted(cash_flows_by_year.keys())
        cash_flows = [cash_flows_by_year[year].get('net_cash_flow', 0) for year in years]
        try:
            import numpy_financial as npf
            irr = npf.irr(cash_flows)
            return float(irr) if not np.isnan(irr) else 0.0
        except (ImportError, ValueError):
            return 0.0

# --- Utility functions ---
def create_tranches(fund_config: Dict[str, Any], num_tranches: int,
                   tranche_spacing: float = 0.5) -> Dict[str, Dict[str, Any]]:
    tranches = {}
    total_fund_size = fund_config.get('fund_size', 0)
    tranche_size = total_fund_size / num_tranches
    for i in range(num_tranches):
        tranche_id = f"tranche_{i+1}"
        tranche_config = {
            'fund_size': tranche_size,
            'deployment_start': i * tranche_spacing,
            'deployment_period': fund_config.get('deployment_period', 1)
        }
        tranches[tranche_id] = tranche_config
    return tranches

def run_multi_fund_simulation(fund_configs: List[Dict[str, Any]], max_workers: int = 4) -> Dict[str, Any]:
    manager = MultiFundManager()
    for i, config in enumerate(fund_configs):
        manager.add_fund(f'fund_{i+1}', config)
    return manager.run_simulations(max_workers=max_workers)

def run_tranched_fund_simulation(base_config: Dict[str, Any],
                                num_tranches: int,
                                tranche_spacing: float = 0.5,
                                max_workers: int = 4) -> Dict[str, Any]:
    manager = TrancheManager(base_config)
    tranches = create_tranches(base_config, num_tranches, tranche_spacing)
    for tranche_id, tranche_config in tranches.items():
        manager.add_tranche(tranche_id, tranche_config)
    return manager.run_simulations(max_workers=max_workers)
