"""
Schema validation utilities for API responses.
"""
from typing import Dict, Any, List, Optional, Set
import logging

logger = logging.getLogger(__name__)

def validate_response_schema(response: Dict[str, Any], required_fields: List[str]) -> Dict[str, Any]:
    """
    Validate that a response contains all required fields.
    
    Args:
        response: The response to validate
        required_fields: List of required fields
        
    Returns:
        Dict containing validation results
    """
    missing_fields = []
    for field in required_fields:
        if field not in response:
            missing_fields.append(field)
    
    return {
        'valid': len(missing_fields) == 0,
        'missing_fields': missing_fields
    }

def get_all_keys(obj: Dict[str, Any], prefix: str = '') -> Set[str]:
    """
    Recursively get all keys in a dictionary.
    
    Args:
        obj: Dictionary to get keys from
        prefix: Prefix for nested keys
        
    Returns:
        Set of all keys
    """
    keys = set()
    for key, value in obj.items():
        full_key = f"{prefix}.{key}" if prefix else key
        keys.add(full_key)
        if isinstance(value, dict):
            keys.update(get_all_keys(value, full_key))
    return keys

def validate_simulation_results(results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate simulation results against the expected schema.
    
    Args:
        results: Simulation results to validate
        
    Returns:
        Dict containing validation results
    """
    # Define required top-level fields
    required_fields = [
        'metrics',
        'cash_flows',
        'portfolio_evolution',
        'yearly_portfolio',
        'gp_economics',
        'sensitivity',
        'waterfall_results',
        'portfolio'
    ]
    
    # Validate top-level fields
    validation_result = validate_response_schema(results, required_fields)
    
    # Log validation results
    if validation_result['valid']:
        logger.info("Simulation results schema validation passed")
    else:
        logger.warning(f"Simulation results schema validation failed: missing fields {validation_result['missing_fields']}")
    
    # Get all keys for debugging
    all_keys = get_all_keys(results)
    logger.debug(f"All keys in simulation results: {all_keys}")
    
    return validation_result
