"""
Distribution utilities for the Equihome Fund Simulation Engine.

This module provides utilities for generating random values from various
probability distributions, with a focus on numerical stability and accuracy.
"""

import numpy as np
from decimal import Decimal
from typing import List, Tuple, Dict, Any, Optional, Union
import scipy.stats as stats


def truncated_normal(mean: float, std_dev: float, lower_bound: float, upper_bound: float, size: int = 1) -> np.ndarray:
    """
    Generate random samples from a truncated normal distribution.

    Args:
        mean: Mean of the normal distribution
        std_dev: Standard deviation of the normal distribution
        lower_bound: Lower bound for truncation
        upper_bound: Upper bound for truncation
        size: Number of samples to generate

    Returns:
        Array of random samples
    """
    # Calculate the corresponding values for the standard normal distribution
    a = (lower_bound - mean) / std_dev
    b = (upper_bound - mean) / std_dev

    # Generate samples from the truncated standard normal distribution
    samples = stats.truncnorm.rvs(a, b, loc=mean, scale=std_dev, size=size)

    return samples


def decimal_truncated_normal(mean: Decimal, std_dev: Decimal, lower_bound: Decimal, upper_bound: Decimal, size: int = 1) -> List[Decimal]:
    """
    Generate random samples from a truncated normal distribution as Decimal objects.

    Args:
        mean: Mean of the normal distribution
        std_dev: Standard deviation of the normal distribution
        lower_bound: Lower bound for truncation
        upper_bound: Upper bound for truncation
        size: Number of samples to generate

    Returns:
        List of Decimal random samples
    """
    # Convert Decimal to float for numpy
    mean_float = float(mean)
    std_dev_float = float(std_dev)
    lower_bound_float = float(lower_bound)
    upper_bound_float = float(upper_bound)

    # Generate samples
    samples_float = truncated_normal(mean_float, std_dev_float, lower_bound_float, upper_bound_float, size)

    # Convert back to Decimal
    samples_decimal = [Decimal(str(sample)) for sample in samples_float]

    return samples_decimal


def generate_correlated_random_variables(correlation_matrix: np.ndarray, means: np.ndarray, std_devs: np.ndarray, size: int = 1) -> np.ndarray:
    """
    Generate correlated random variables from a multivariate normal distribution.

    Args:
        correlation_matrix: Correlation matrix (must be positive semi-definite)
        means: Mean vector
        std_devs: Standard deviation vector
        size: Number of samples to generate

    Returns:
        Array of correlated random samples
    """
    # Number of variables
    n = len(means)

    # Convert correlation matrix to covariance matrix
    covariance_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            covariance_matrix[i, j] = correlation_matrix[i, j] * std_devs[i] * std_devs[j]

    # Generate samples from multivariate normal distribution
    samples = np.random.multivariate_normal(means, covariance_matrix, size=size)

    return samples


def generate_zone_allocation(
    zone_weights: Dict[str, Decimal],
    num_loans: int,
    precision: float = 0.8
) -> List[str]:
    """
    Generate zone allocations based on weights with controllable precision.

    Args:
        zone_weights: Dictionary mapping zone names to weights
        num_loans: Number of loans to allocate
        precision: How precisely to match the target allocation (0-1)
                  0 = fully random, 1 = exact match

    Returns:
        List of zone allocations
    """
    zones = list(zone_weights.keys())
    weights = [float(zone_weights[zone]) for zone in zones]

    # Normalize weights to sum to 1
    total_weight = sum(weights)
    if total_weight > 0:
        weights = [w / total_weight for w in weights]
    else:
        # If all weights are 0, use equal weights
        weights = [1.0 / len(zones) for _ in zones]

    # Ensure precision is between 0 and 1
    precision = max(0.0, min(1.0, precision))

    # Calculate the exact number of loans for each zone
    exact_counts = [int(w * num_loans) for w in weights]

    # Adjust to ensure we have exactly num_loans
    remaining = num_loans - sum(exact_counts)
    for i in range(remaining):
        exact_counts[i % len(exact_counts)] += 1

    # Determine how many loans to allocate precisely vs randomly
    precise_count = int(num_loans * precision)
    random_count = num_loans - precise_count

    # Allocate the precise portion according to exact counts
    allocations = []
    precise_counts = [int(count * precision) for count in exact_counts]

    # Adjust precise counts to ensure they sum to precise_count
    precise_sum = sum(precise_counts)
    if precise_sum < precise_count:
        # Distribute remaining precise allocations
        for i in range(precise_count - precise_sum):
            precise_counts[i % len(precise_counts)] += 1
    elif precise_sum > precise_count:
        # Remove excess precise allocations
        excess = precise_sum - precise_count
        for i in range(excess):
            if precise_counts[i % len(precise_counts)] > 0:
                precise_counts[i % len(precise_counts)] -= 1

    # Create allocations for the precise portion
    for i, zone in enumerate(zones):
        allocations.extend([zone] * precise_counts[i])

    # Allocate the random portion using weighted random selection
    for _ in range(random_count):
        zone_index = np.random.choice(len(zones), p=weights)
        allocations.append(zones[zone_index])

    # Shuffle allocations
    np.random.shuffle(allocations)

    return allocations


def generate_exit_years(mean_exit_year: Decimal, std_dev: Decimal, min_exit_year: int, max_exit_year: int, num_loans: int) -> List[int]:
    """
    Generate exit years based on a truncated normal distribution.

    Args:
        mean_exit_year: Mean exit year
        std_dev: Standard deviation of exit years
        min_exit_year: Minimum exit year
        max_exit_year: Maximum exit year
        num_loans: Number of loans

    Returns:
        List of exit years
    """
    # Generate exit years as floats
    exit_years_float = truncated_normal(
        float(mean_exit_year),
        float(std_dev),
        min_exit_year,
        max_exit_year,
        num_loans
    )

    # Round to integers
    exit_years = [int(round(year)) for year in exit_years_float]

    return exit_years
