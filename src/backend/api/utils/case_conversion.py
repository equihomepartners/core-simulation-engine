"""
Utility functions for converting between snake_case and camelCase.
"""
import re
from typing import Any, Dict, List, Union


def camel_to_snake(name: str) -> str:
    """
    Convert camelCase to snake_case.

    Args:
        name: String in camelCase

    Returns:
        String in snake_case
    """
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def snake_to_camel(name: str) -> str:
    """
    Convert snake_case to camelCase.

    Args:
        name: String in snake_case

    Returns:
        String in camelCase
    """
    components = name.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def transform_keys(obj: Any, transform_func: callable) -> Any:
    """
    Recursively transform all dictionary keys in an object using the provided transform function.

    Args:
        obj: Object to transform (can be a dict, list, or primitive type)
        transform_func: Function to apply to each key

    Returns:
        Transformed object
    """
    if isinstance(obj, dict):
        return {transform_func(k): transform_keys(v, transform_func) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [transform_keys(item, transform_func) for item in obj]
    else:
        return obj


def ensure_both_cases(obj: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure that a dictionary has both snake_case and camelCase versions of each key.

    Args:
        obj: Dictionary to transform

    Returns:
        Dictionary with both snake_case and camelCase keys
    """
    result = {}

    # First, collect all keys and their values
    for key, value in obj.items():
        # Handle nested dictionaries and lists
        if isinstance(value, dict):
            value = ensure_both_cases(value)
        elif isinstance(value, list):
            value = [ensure_both_cases(item) if isinstance(item, dict) else item for item in value]

        # Add the original key-value pair
        result[key] = value

        # Add the transformed key if it's different from the original
        if isinstance(key, str):  # Only process string keys
            if '_' in key:  # Likely snake_case
                camel_key = snake_to_camel(key)
                if camel_key != key:
                    result[camel_key] = value
            elif re.search('[a-z][A-Z]', key):  # Likely camelCase
                snake_key = camel_to_snake(key)
                if snake_key != key:
                    result[snake_key] = value

    return result
