# Batch 3: GP Entity and Dividend Logic

This document provides detailed review guidelines for the GP Entity and Dividend Logic PRs.

## PRs in this Batch

- PR #31/#32: Update dividend accrual logic (duplicate PRs)
- PR #33: Add GP entity routes to OpenAPI spec
- PR #34: Add monthly pattern support for GP cashflows

## Review Focus Areas

### 1. Dividend Accrual Logic (PR #31/#32)

#### Key Files to Review:
- GP entity implementation files
- Monthly cashflow generation logic
- Quarterly/annual payout calculation
- Test files for dividend schedules

#### Review Checklist:
- [ ] Verify the implementation of QTD/YTD net income tracking
- [ ] Check that dividend accrual logic correctly accumulates income
- [ ] Ensure proper handling of quarterly and annual payout schedules
- [ ] Confirm that test cases cover different dividend scenarios
- [ ] Check for edge cases in the accrual calculations

### 2. GP Entity API Routes (PR #33)

#### Key Files to Review:
- OpenAPI specification (`openapi.yaml`)
- GP entity response schemas
- API route implementations

#### Review Checklist:
- [ ] Verify that GP entity endpoints are properly documented in the OpenAPI spec
- [ ] Check that response schemas are well-defined and comprehensive
- [ ] Ensure consistency with existing API patterns
- [ ] Confirm that all necessary endpoints are included
- [ ] Check for proper error handling and validation

### 3. Monthly Pattern Support (PR #34)

#### Key Files to Review:
- `gp_entity_schema.json`
- GP entity cashflow calculation logic
- Parameter tracking documentation
- Frontend schema files

#### Review Checklist:
- [ ] Verify that monthly patterns are properly defined in the schema
- [ ] Check that pattern distribution is correctly implemented in cashflow calculations
- [ ] Ensure that patterns are documented in the Parameter Tracking guide
- [ ] Confirm that monthly pattern fields are exposed in the frontend schema
- [ ] Test different pattern configurations to ensure correct behavior

## Integration Strategy

The recommended integration order for this batch is:

1. PR #31/#32: Update dividend accrual logic (choose one of the duplicate PRs)
2. PR #34: Add monthly pattern support for GP cashflows
3. PR #33: Add GP entity routes to OpenAPI spec

## Potential Issues to Watch For

1. **Duplicate PRs**: PRs #31 and #32 appear to be duplicates. Review both to determine if there are any differences, and choose the more complete implementation.

2. **Cashflow Calculation Complexity**: The dividend accrual and monthly pattern logic adds complexity to cashflow calculations. Ensure that the implementation is correct and efficient.

3. **API Consistency**: Verify that the new GP entity routes maintain consistency with existing API patterns and naming conventions.

4. **Schema Compatibility**: Ensure that schema changes are backward compatible or that appropriate migration paths are provided.

5. **Test Coverage**: Check that tests adequately cover the new functionality, especially edge cases in dividend accrual and monthly patterns.

## Post-Integration Verification

After integrating these PRs, verify:

1. The correct accrual and payout of dividends on different schedules (monthly, quarterly, annual)
2. The proper application of monthly patterns to GP cashflows
3. The functioning of GP entity API endpoints
4. The accuracy of cashflow calculations with different pattern configurations
5. The correct display of GP entity information in the UI
