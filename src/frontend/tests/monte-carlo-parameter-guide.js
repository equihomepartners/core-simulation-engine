/**
 * Monte Carlo Parameter Guide
 * 
 * This guide demonstrates the correct way to call run_monte_carlo_simulation
 * to avoid the "argument of type 'Portfolio' is not iterable" error.
 * 
 * The key insight is to always use named parameters for all arguments after
 * the first one to avoid parameter mismatches.
 */

/**
 * INCORRECT way (causing errors):
 * 
 * ```python
 * # This will cause errors because the portfolio object is passed as a positional parameter
 * # and the config object is passed as the second positional parameter, which is expected
 * # to be num_simulations (a number)
 * monte_carlo_results = run_monte_carlo_simulation(
 *    portfolio,             # This is correct - first positional parameter 
 *    self.config,           # THIS IS WRONG - expected to be num_simulations (a number)
 *    num_simulations=1000   # This doesn't fix the previous error
 * )
 * ```
 * 
 * CORRECT way:
 * 
 * ```python
 * # Only the first parameter (fund_params) should be positional
 * # ALL other parameters should be named
 * monte_carlo_results = run_monte_carlo_simulation(
 *    fund_params=portfolio,                             # Named parameter is clearer
 *    num_simulations=self.config.get('num_simulations', 1000),
 *    variation_factor=self.config.get('variation_factor', 0.1),
 *    seed=self.config.get('monte_carlo_seed', None)
 * )
 * ```
 */

/**
 * JavaScript Example (for comparison with Python)
 * 
 * In JavaScript, we'd follow similar principles with object destructuring:
 */

function runMonteCarloSimulation({
  fundParams,
  numSimulations = 1000,
  variationFactor = 0.1,
  numProcesses = null,
  seed = null
}) {
  // Implementation would go here
  console.log(`Running Monte Carlo with ${numSimulations} simulations`);
  console.log(`Variation factor: ${variationFactor}`);
  console.log(`Using seed: ${seed || 'random'}`);
  
  // The portfolio object is accessed as fundParams
  // Without trying to iterate over it directly
  const numberOfLoans = fundParams.loans?.length || 0;
  console.log(`Portfolio has ${numberOfLoans} loans`);
  
  // Properties are accessed directly
  const zoneAllocations = fundParams.zone_allocations || {};
  console.log('Zone allocations:', zoneAllocations);
  
  // Return mock results
  return {
    simulation_results: [],
    analysis_results: {
      irr_stats: {
        mean: 0.143,
        median: 0.145
      }
    }
  };
}

/**
 * Sample usage:
 */

// Mock Portfolio object similar to Python
class Portfolio {
  constructor() {
    this.loans = [{ id: 1 }, { id: 2 }, { id: 3 }];
    this.zone_allocations = { green: 0.6, orange: 0.3, red: 0.1 };
    this.fund_size = 100000000;
  }
  
  // Not iterable
}

// Create sample portfolio
const portfolio = new Portfolio();

// Config object
const config = {
  num_simulations: 5000,
  variation_factor: 0.2,
  monte_carlo_seed: 42
};

// CORRECT call - all parameters are named
const results = runMonteCarloSimulation({
  fundParams: portfolio,
  numSimulations: config.num_simulations,
  variationFactor: config.variation_factor,
  seed: config.monte_carlo_seed
});

console.log('Results:', results);

/**
 * Portfolio Object Handling Guidelines
 * 
 * When working with Portfolio objects in Monte Carlo simulations:
 * 
 * 1. Never try to iterate over the Portfolio object directly
 * 2. Always access specific properties like portfolio.loans or portfolio.zone_allocations
 * 3. Use hasattr() in Python (or hasOwnProperty in JS) to check for property existence
 * 4. Create helper functions that extract needed data from Portfolio objects
 * 5. Consider converting Portfolio objects to dictionaries before using them in functions
 *    that expect dictionary-like behavior
 */

/**
 * Example property extraction function:
 */
function extractPortfolioData(portfolio) {
  // Handle null/undefined portfolio
  if (!portfolio) {
    return { loans: [], zone_allocations: {} };
  }
  
  // Safely extract properties with defaults
  return {
    loans: portfolio.loans || [],
    zone_allocations: portfolio.zone_allocations || {},
    fund_size: portfolio.fund_size || 0
  };
}

// Use the extraction function
const portfolioData = extractPortfolioData(portfolio);
console.log('Extracted portfolio data:', portfolioData);

/**
 * Example Portfolio to dictionary conversion:
 */
function portfolioToDict(portfolio) {
  if (!portfolio) {
    return {};
  }
  
  const result = {};
  const propertiesToExtract = ['loans', 'zone_allocations', 'fund_size'];
  
  for (const prop of propertiesToExtract) {
    if (portfolio[prop] !== undefined) {
      result[prop] = portfolio[prop];
    }
  }
  
  return result;
}

// Convert to dictionary
const portfolioDict = portfolioToDict(portfolio);
console.log('Portfolio as dictionary:', portfolioDict);

/**
 * Running this guide will demonstrate how to properly handle Portfolio objects
 * and avoid the "argument of type 'Portfolio' is not iterable" error.
 */

// Note: In a real implementation, you would make API calls to the backend
// rather than having this mock implementation.

/**
 * Run this with:
 * node monte-carlo-parameter-guide.js
 */ 