# Batch 4: Advanced Risk Parameters and Zone Controls

This document provides detailed review guidelines for the Advanced Risk Parameters and Zone Controls PRs.

## PRs in this Batch

- PR #9: Update simulation config schema with new parameters
- PR #10: Add advanced correlation and rebalancing params
- PR #13: Enable zone rebalancing controls
- PR #14: Add monthly capital call pacing options
- PR #28: Add grid stress and vintage VaR integration

## Review Focus Areas

### 1. Simulation Config Schema Updates (PR #9)

#### Key Files to Review:
- Simulation configuration schema files
- Correlation object definitions
- Zone rebalancing parameter definitions

#### Review Checklist:
- [ ] Verify the structure and fields of the `default_correlation` object
- [ ] Check that zone rebalancing fields are properly defined
- [ ] Ensure that the `exit_year_max_std_dev` parameter is correctly implemented
- [ ] Confirm that schema changes are backward compatible
- [ ] Check for proper validation of new parameters

### 2. Advanced Parameters UI Integration (PR #10)

#### Key Files to Review:
- Frontend schema files
- Advanced wizard step implementation
- Parameter handling in the UI

#### Review Checklist:
- [ ] Verify that advanced risk parameters are exposed in the simulation schema
- [ ] Check that new parameters are properly rendered in the Advanced wizard step
- [ ] Ensure proper validation and error handling in the UI
- [ ] Confirm that parameter changes are correctly sent to the backend
- [ ] Test the UI with various parameter configurations

### 3. Zone Rebalancing Implementation (PR #13)

#### Key Files to Review:
- `Fund` class implementation
- Simulation controller default settings
- Portfolio evolution logic
- Zone balance maintenance code

#### Review Checklist:
- [ ] Verify that zone rebalancing parameters are correctly parsed in the `Fund` class
- [ ] Check that rebalancing defaults are properly exposed in the simulation controller
- [ ] Ensure that parameters are correctly forwarded to portfolio evolution
- [ ] Confirm that zone balance is maintained when enabled
- [ ] Test different rebalancing scenarios to ensure correct behavior

### 4. Capital Call Pacing Options (PR #14)

#### Key Files to Review:
- `generate_capital_call_schedule_monthly` implementation
- Pacing strategy logic for different distribution patterns

#### Review Checklist:
- [ ] Verify the implementation of `front_loaded`, `back_loaded`, and `bell_curve` pacing strategies
- [ ] Check that each strategy correctly distributes capital calls
- [ ] Ensure that the implementation is efficient and well-documented
- [ ] Confirm that the strategies produce expected distributions
- [ ] Test edge cases for each pacing strategy

### 5. Grid Stress and VaR Integration (PR #28)

#### Key Files to Review:
- `SimulationController` integration with grid stress and vintage VaR
- Default parameter settings
- CHANGELOG updates

#### Review Checklist:
- [ ] Verify the integration of `grid_stress_analysis.run_grid` with the simulation controller
- [ ] Check the integration of `vintage_var_analysis.run_vintage_var` with the controller
- [ ] Ensure that defaults for stress parameters are appropriate
- [ ] Confirm that the new feature is properly documented in the CHANGELOG
- [ ] Test the grid stress and VaR functionality with different configurations

## Integration Strategy

The recommended integration order for this batch is:

1. PR #9: Update simulation config schema with new parameters (foundational schema changes)
2. PR #14: Add monthly capital call pacing options (independent feature)
3. PR #13: Enable zone rebalancing controls (depends on schema updates)
4. PR #10: Add advanced correlation and rebalancing params (UI integration)
5. PR #28: Add grid stress and vintage VaR integration (advanced analysis features)

## Potential Issues to Watch For

1. **Parameter Validation**: Ensure that new parameters have appropriate validation to prevent invalid configurations.

2. **Performance Impact**: Zone rebalancing and grid stress analysis can be computationally intensive. Check for potential performance issues.

3. **UI Complexity**: The addition of advanced parameters increases UI complexity. Ensure that the interface remains usable and intuitive.

4. **Backward Compatibility**: Verify that existing simulations continue to work with the new parameters and defaults.

5. **Test Coverage**: Given the complexity of these features, ensure comprehensive test coverage, especially for edge cases.

## Post-Integration Verification

After integrating these PRs, verify:

1. The correct functioning of different capital call pacing strategies
2. The proper maintenance of zone balance when rebalancing is enabled
3. The generation of grid stress analysis results
4. The calculation of vintage VaR metrics
5. The usability of the advanced parameters in the UI
