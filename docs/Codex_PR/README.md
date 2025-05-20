# Codex PR Review Guide

This document provides a structured approach to reviewing and integrating the PRs created by Codex, an AI SWE assistant, into the core-simulation-engine project.

## Overview

There are 34 open PRs that need to be reviewed and integrated. These PRs have been organized into logical batches based on their functionality and dependencies to facilitate a systematic review process.

## PR Batches

### Batch 1: Monte Carlo Simulation Enhancements
- PR #15: Add inner Monte Carlo runner
- PR #16: Add inner Monte Carlo support
- PR #17: Add inner Monte Carlo config options
- PR #19: Add variance analysis config options
- PR #20: Add variance analysis adapter
- PR #21: Add variance analysis endpoint
- PR #22: Add detailed Monte Carlo schema
- PR #23: Update docs for inner Monte Carlo and variance API
- PR #24: Add inner Monte Carlo tests

**Focus Areas:**
- Implementation of inner Monte Carlo simulation capabilities
- Variance analysis functionality
- Schema updates and documentation
- Test coverage

### Batch 2: Leverage Configuration and Metrics
- PR #11/#12: Add leverage_metrics to simulation results (duplicate PRs)
- PR #35: Update leverage docs
- PR #36: Add leverage config to SimulationConfig
- PR #37: Add leverage config to simulation schemas
- PR #38: Add leverage fields to OpenAPI and SDK

**Focus Areas:**
- Leverage configuration models
- Integration with simulation results
- API and SDK updates
- Documentation

### Batch 3: GP Entity and Dividend Logic
- PR #31/#32: Update dividend accrual logic (duplicate PRs)
- PR #33: Add GP entity routes to OpenAPI spec
- PR #34: Add monthly pattern support for GP cashflows

**Focus Areas:**
- GP entity cashflow calculations
- Dividend accrual and payout scheduling
- API specification updates
- Monthly pattern distribution

### Batch 4: Advanced Risk Parameters and Zone Controls
- PR #9: Update simulation config schema with new parameters
- PR #10: Add advanced correlation and rebalancing params
- PR #13: Enable zone rebalancing controls
- PR #14: Add monthly capital call pacing options
- PR #28: Add grid stress and vintage VaR integration

**Focus Areas:**
- Risk parameter configuration
- Zone rebalancing functionality
- Capital call pacing strategies
- Stress testing and VaR analysis

### Batch 5: Code Quality and Maintenance
- PR #18: Update OpenAPI spec and SDK
- PR #25: Cleanup backup and log artifacts
- PR #26: Remove redundant and unused analysis modules
- PR #27: Remove unused frontend scripts
- PR #29: Replace print statements with logging
- PR #30: Update fee drag calculation
- PR #39: Remove fallback logic for optional modules

**Focus Areas:**
- Code cleanup and organization
- Logging improvements
- Performance optimization
- Documentation updates

### Batch 6: Advanced Visualization and Export Features
- PR #40: Add Monte Carlo and frontier visualizations
- PR #41: Add optimization endpoints
- PR #42: Implement simulation export endpoints

**Focus Areas:**
- Frontend visualization components
- Portfolio optimization endpoints
- Data export functionality
- API enhancements

## Review Process

For each batch, follow this review process:

1. **Initial Assessment**
   - Review PR descriptions and summaries
   - Identify affected components and potential impacts
   - Note any dependencies between PRs

2. **Code Review**
   - Examine code changes for correctness and quality
   - Verify adherence to project coding standards
   - Check for potential bugs or edge cases
   - Ensure proper error handling

3. **Testing**
   - Attempt to run tests if possible (note: many test commands are failing)
   - Manually verify functionality where feasible
   - Consider writing additional tests if needed

4. **Documentation Review**
   - Verify that changes are properly documented
   - Check for updates to relevant guides and parameter tracking
   - Ensure API changes are reflected in OpenAPI specs

5. **Integration Planning**
   - Determine the order of PR integration within each batch
   - Identify potential merge conflicts
   - Plan for any necessary adjustments before merging

## Integration Checklist

For each PR:

- [ ] Review code changes thoroughly
- [ ] Check for test coverage (or add tests if missing)
- [ ] Verify documentation updates
- [ ] Resolve any merge conflicts
- [ ] Pull changes locally for testing
- [ ] Approve PR if changes are acceptable
- [ ] Merge PR or prepare for merging

## Notes on Testing Failures

Most PRs report test failures with messages like:
- `pytest` *(fails: command not found)*
- `python -m pytest -q` *(fails: No module named pytest)*
- `npm run lint` *(fails: ESLint couldn't find config)*
- `./generate-sdk.sh` *(fails: connect EHOSTUNREACH)*

These failures appear to be environment-related rather than issues with the code itself. Consider setting up a proper testing environment before final integration.

## Batch-Specific Review Guidelines

Detailed review guidelines for each batch are provided in separate documents:
- [Batch 1: Monte Carlo Simulation Enhancements](./batch1_monte_carlo.md)
- [Batch 2: Leverage Configuration and Metrics](./batch2_leverage.md)
- [Batch 3: GP Entity and Dividend Logic](./batch3_gp_entity.md)
- [Batch 4: Advanced Risk Parameters and Zone Controls](./batch4_risk_params.md)
- [Batch 5: Code Quality and Maintenance](./batch5_maintenance.md)
- [Batch 6: Advanced Visualization and Export Features](./batch6_visualization_export.md)
