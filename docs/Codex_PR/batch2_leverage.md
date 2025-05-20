# Batch 2: Leverage Configuration and Metrics

This document provides detailed review guidelines for the Leverage Configuration and Metrics PRs.

## PRs in this Batch

- PR #11/#12: Add leverage_metrics to simulation results (duplicate PRs)
- PR #35: Update leverage docs
- PR #36: Add leverage config to SimulationConfig
- PR #37: Add leverage config to simulation schemas
- PR #38: Add leverage fields to OpenAPI and SDK

## Review Focus Areas

### 1. Leverage Configuration Model (PR #36)

#### Key Files to Review:
- Pydantic model definitions for `LeverageConfig`
- `SimulationConfig` extensions
- Controller default settings

#### Review Checklist:
- [ ] Verify the structure and fields of the `LeverageConfig` model
- [ ] Check that the `SimulationConfig` is properly extended with leverage fields
- [ ] Ensure that unknown keys are properly handled in configuration
- [ ] Confirm that default values are appropriate and well-documented
- [ ] Check for any validation rules on leverage parameters

### 2. Schema and API Updates (PRs #37, #38)

#### Key Files to Review:
- OpenAPI specification (`openapi.yaml`)
- Frontend API index files
- TypeScript model definitions
- SDK generation scripts

#### Review Checklist:
- [ ] Verify that the leverage configuration is properly defined in the OpenAPI spec
- [ ] Check that leverage metrics are included in the `SimulationResults` schema
- [ ] Ensure that leverage models are properly exposed in the frontend API
- [ ] Confirm that TypeScript models are correctly generated
- [ ] Check for any breaking changes to existing APIs

### 3. Leverage Metrics Integration (PR #11/#12)

#### Key Files to Review:
- API specification for leverage metrics
- `SimulationController` storage of leverage metrics
- Endpoint implementation for `/api/leverage/metrics`
- SDK model updates

#### Review Checklist:
- [ ] Verify that leverage metrics are properly stored in the simulation controller
- [ ] Check that the metrics endpoint is correctly implemented
- [ ] Ensure consistent response formats
- [ ] Confirm that the SDK models are updated to include leverage metrics
- [ ] Test the endpoint with various input parameters

### 4. Documentation (PR #35)

#### Key Files to Review:
- Parameter tracking documentation
- Leverage UI guide
- Any other relevant documentation files

#### Review Checklist:
- [ ] Verify that `run_dual_leverage_comparison` is documented in Parameter Tracking
- [ ] Check that the dual levered/unlevered comparison toggle is explained in the UI guide
- [ ] Ensure documentation is clear and comprehensive
- [ ] Confirm that examples are provided where appropriate
- [ ] Check for consistency with existing documentation

## Integration Strategy

The recommended integration order for this batch is:

1. PR #36: Add leverage config to SimulationConfig (foundational model)
2. PR #37: Add leverage config to simulation schemas (schema updates)
3. PR #11/#12: Add leverage_metrics to simulation results (choose one of the duplicate PRs)
4. PR #38: Add leverage fields to OpenAPI and SDK (API and SDK updates)
5. PR #35: Update leverage docs (documentation)

## Potential Issues to Watch For

1. **Duplicate PRs**: PRs #11 and #12 appear to be duplicates. Review both to determine if there are any differences, and choose the more complete implementation.

2. **SDK Generation**: Several PRs mention failures in the SDK generation script. Ensure that the SDK is properly generated after integrating these changes.

3. **Model Consistency**: Verify that the leverage model is consistently defined across the backend, API specification, and frontend.

4. **Default Values**: Check that default values for leverage parameters are sensible and well-documented.

5. **UI Integration**: Ensure that the leverage configuration is properly exposed in the UI and that the dual comparison toggle works as expected.

## Post-Integration Verification

After integrating these PRs, verify:

1. The ability to configure leverage parameters in the simulation
2. The calculation and display of leverage metrics in simulation results
3. The functioning of the dual levered/unlevered comparison
4. The correct generation of SDK models
5. The accuracy of leverage calculations in the simulation
