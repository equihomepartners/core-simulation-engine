# PR Integration Guide

This document outlines the process for integrating the Codex-generated PRs into the core-simulation-engine project.

## Prerequisites

Before beginning the integration process, ensure:

1. You have a local clone of the repository
2. Your local environment is set up for development
3. You have reviewed the PRs according to the batch-specific guidelines
4. You have permission to pull and push changes

## Integration Process Overview

The integration process follows these general steps:

1. Review PRs in a batch according to the batch-specific guidelines
2. Pull changes locally for each PR
3. Test changes in your local environment
4. Make any necessary adjustments
5. Push changes to the main branch
6. Close the PR

## Detailed Integration Steps

### 1. Prepare Your Local Environment

```bash
# Ensure you're on the main branch
git checkout main

# Pull the latest changes
git pull origin main

# Create a new branch for integration
git checkout -b integrate-codex-batch-X
```

### 2. Pull Changes from a PR

For each PR you want to integrate:

```bash
# Add the PR as a remote
git remote add pr-XX https://github.com/equihomepartners/core-simulation-engine.git

# Fetch the PR branch
git fetch pr-XX pull/XX/head:pr-XX

# Checkout the PR branch
git checkout pr-XX

# Review the changes
git log -p

# Return to your integration branch
git checkout integrate-codex-batch-X

# Merge the PR changes
git merge pr-XX
```

### 3. Resolve Conflicts

If there are merge conflicts:

```bash
# Identify conflicting files
git status

# Resolve conflicts in each file
# Use your preferred editor or IDE

# After resolving conflicts
git add .
git commit -m "Resolve conflicts from PR #XX"
```

### 4. Test Changes

Test the changes according to the project's testing procedures:

```bash
# Backend tests (if pytest is available)
cd /path/to/project
python -m pytest

# Frontend tests
cd src/frontend
npm test

# Manual testing
# Start the backend and frontend servers
# Test the functionality in the browser
```

### 5. Make Adjustments

If adjustments are needed:

```bash
# Make necessary changes
# Use your preferred editor or IDE

# Commit the adjustments
git add .
git commit -m "Adjust changes from PR #XX: description of adjustments"
```

### 6. Push Changes

Once you're satisfied with the integration:

```bash
# Push your integration branch
git push origin integrate-codex-batch-X

# Create a PR for your integration branch
# Use GitHub UI to create a PR from integrate-codex-batch-X to main

# After the PR is approved and merged
git checkout main
git pull origin main
```

### 7. Close the Original PR

After successfully integrating the changes:

1. Go to the original PR on GitHub
2. Add a comment indicating that the changes have been integrated
3. Close the PR

## Batch-Specific Integration Notes

### Batch 1: Monte Carlo Simulation Enhancements

- Follow the integration order specified in the batch1_monte_carlo.md document
- Pay special attention to performance implications of inner Monte Carlo simulations
- Verify that the variance analysis endpoints work correctly

### Batch 2: Leverage Configuration and Metrics

- Choose one of the duplicate PRs (#11 or #12) based on completeness
- Ensure that the SDK is properly generated after integrating these changes
- Verify that leverage metrics are correctly calculated and displayed

### Batch 3: GP Entity and Dividend Logic

- Choose one of the duplicate PRs (#31 or #32) based on completeness
- Test different dividend schedules to ensure correct accrual and payout
- Verify that monthly patterns are correctly applied to GP cashflows

### Batch 4: Advanced Risk Parameters and Zone Controls

- Test zone rebalancing with different configurations
- Verify that capital call pacing strategies produce expected distributions
- Ensure that grid stress and VaR analysis work correctly

### Batch 5: Code Quality and Maintenance

- Be cautious when removing files to avoid breaking functionality
- Verify that logging works correctly after replacing print statements
- Ensure that fee drag calculations produce correct results
- Check that the removal of fallback logic doesn't break functionality

### Batch 6: Advanced Visualization and Export Features

- Integrate backend endpoints before frontend visualizations
- Test export functionality with large datasets
- Verify that visualizations correctly display data from the API
- Ensure that the UI remains responsive when working with complex visualizations

## Troubleshooting

### Common Issues

1. **Test Failures**
   - Many PRs report test failures due to environment issues
   - Set up a proper testing environment before final integration
   - If tests continue to fail, investigate the specific failures

2. **SDK Generation**
   - Several PRs mention failures in the SDK generation script
   - Ensure that the SDK is properly generated after integrating changes
   - If generation fails, check network connectivity and dependencies

3. **Merge Conflicts**
   - PRs that modify the same files may cause conflicts
   - Resolve conflicts carefully, preserving the intent of both changes
   - When in doubt, consult with the team

4. **Breaking Changes**
   - Some PRs may introduce breaking changes
   - Ensure that existing functionality continues to work
   - Update documentation to reflect any API or behavior changes

### Getting Help

If you encounter issues during integration:

1. Consult the batch-specific guidelines for known issues
2. Review the PR descriptions for testing notes
3. Reach out to the team for assistance
4. Document any recurring issues for future reference
