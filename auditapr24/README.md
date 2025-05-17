# Audit & Refactor: Reporting Module (April 2024)

## Overview
This document tracks the comprehensive audit and improvement of the reporting/export module (`src/backend/calculations/reporting.py`) and related visualization/reporting infrastructure. The goal is to address all identified gaps, red flags, and improvement opportunities to align with the full capabilities described in `API_CAPABILITIES.md`.

## Key Improvements
- **Granularity:** Add support for monthly, quarterly, and custom periods in all reports/exports.
- **Advanced Visualization:** Support for fan charts, heatmaps, tornado, multi-dimensional sensitivity, and more.
- **Dynamic Filtering/Aggregation:** Allow API-driven filtering and aggregation of metrics and categories.
- **Template Flexibility:** Move templates to external files; support user-defined/custom templates and versioning.
- **Export Robustness:** Improve handling of nested/time-series data in CSV/Excel; add validation and error reporting.
- **Error Handling/Logging:** Robust error handling and logging for all report/chart/export functions.
- **Performance:** Streaming/async support for large exports and long-running reports.
- **Chart Image Generation:** Add SVG/vector support, theming, and caching.
- **PDF Generation:** Improved formatting, pagination, and support for images/charts and branded templates.
- **API/Frontend Integration:** Metadata endpoints for available templates/metrics; full documentation of report fields.
- **Localization:** Support for localization (dates, numbers, currency, language).
- **Security:** Permission checks for sensitive reports/exports.

## Migration Guide
- All templates are now in `auditapr24/templates/` (JSON/YAML).
- New chart types and export options are available via the API.
- See below for usage examples and API integration notes.

## Usage Examples
- [To be filled in as improvements are implemented.]

## Changelog
- [To be updated with each improvement.] 