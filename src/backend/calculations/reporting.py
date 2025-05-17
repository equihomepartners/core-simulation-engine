"""
Reporting and Export Functionality Module

This module implements reporting and export functionality for the Equihome Fund Simulation Engine.
It generates reports and exports data in various formats for analysis and presentation.

Key components:
1. Report generation (now supports yearly, monthly, quarterly, and custom period granularity)
2. Data export to various formats (CSV, Excel, JSON)
3. Chart image generation
4. PDF report generation
5. Summary statistics calculation
6. Custom report templates
"""

from decimal import Decimal
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any, Optional
import json
import csv
import os
import datetime
import base64
from io import BytesIO
import glob

# Constants for reporting
DECIMAL_ZERO = Decimal('0')
DECIMAL_ONE = Decimal('1')

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../auditapr24/templates')

def load_report_template(template_name: str) -> Dict[str, Any]:
    """
    Load a report template from the auditapr24/templates directory.
    """
    template_path = os.path.join(TEMPLATE_DIR, f"{template_name}_template.json")
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template {template_name} not found at {template_path}")
    with open(template_path, 'r') as f:
        return json.load(f)

def generate_summary_report(
    simulation_results: Dict[str, Any],
    report_config: Dict[str, Any],
    granularity: str = 'yearly'
) -> Dict[str, Any]:
    """
    Generate a summary report from simulation results.
    Now supports yearly, monthly, quarterly, and custom period granularity for cash flows and metrics.

    Args:
        simulation_results: Results from simulation
        report_config: Configuration for the report
        granularity: 'yearly', 'monthly', 'quarterly', or custom period key

    Returns:
        Dictionary with summary report data
    """
    # Extract key metrics based on report configuration
    metrics = report_config.get('metrics', [
        'irr', 'equity_multiple', 'roi', 'sharpe_ratio', 'max_drawdown'
    ])

    # Initialize summary report
    summary_report = {
        'title': report_config.get('title', 'Fund Simulation Summary Report'),
        'date_generated': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'fund_parameters': {},
        'performance_metrics': {},
        'waterfall_distribution': {},
        'cash_flow_summary': {},
        'risk_metrics': {}
    }

    # Extract fund parameters
    if 'scenario_params' in simulation_results:
        summary_report['fund_parameters'] = {
            k: float(v) if isinstance(v, Decimal) else v
            for k, v in simulation_results['scenario_params'].items()
            if not isinstance(v, dict)
        }

    # Extract performance metrics
    if 'performance_metrics' in simulation_results:
        performance_metrics = simulation_results['performance_metrics']

        # Extract IRR
        if 'irr' in performance_metrics and 'irr' in metrics:
            if isinstance(performance_metrics['irr'], dict):
                summary_report['performance_metrics']['irr'] = float(performance_metrics['irr'].get('irr', 0) or 0)
            else:
                summary_report['performance_metrics']['irr'] = float(performance_metrics['irr'] or 0)

        # Extract equity multiple
        if 'equity_multiple' in performance_metrics and 'equity_multiple' in metrics:
            if isinstance(performance_metrics['equity_multiple'], dict):
                summary_report['performance_metrics']['equity_multiple'] = float(performance_metrics['equity_multiple'].get('equity_multiple', 0) or 0)
            else:
                summary_report['performance_metrics']['equity_multiple'] = float(performance_metrics['equity_multiple'] or 0)

        # Extract ROI
        if 'roi' in performance_metrics and 'roi' in metrics:
            if isinstance(performance_metrics['roi'], dict):
                summary_report['performance_metrics']['roi'] = float(performance_metrics['roi'].get('roi', 0) or 0)
            else:
                summary_report['performance_metrics']['roi'] = float(performance_metrics['roi'] or 0)

        # Extract risk metrics
        if 'risk_metrics' in performance_metrics:
            risk_metrics = performance_metrics['risk_metrics']

            if 'sharpe_ratio' in risk_metrics and 'sharpe_ratio' in metrics:
                summary_report['risk_metrics']['sharpe_ratio'] = float(risk_metrics.get('sharpe_ratio', 0) or 0)

            if 'max_drawdown' in risk_metrics and 'max_drawdown' in metrics:
                summary_report['risk_metrics']['max_drawdown'] = float(risk_metrics.get('max_drawdown', 0) or 0)

            if 'volatility' in risk_metrics and 'volatility' in metrics:
                summary_report['risk_metrics']['volatility'] = float(risk_metrics.get('volatility', 0) or 0)

    # Extract waterfall distribution
    if 'waterfall_results' in simulation_results:
        waterfall_results = simulation_results['waterfall_results']

        summary_report['waterfall_distribution'] = {
            k: float(v) if isinstance(v, Decimal) else v
            for k, v in waterfall_results.items()
        }

    # Extract cash flow summary with granularity support
    if 'cash_flows' in simulation_results:
        cash_flows = simulation_results['cash_flows']
        # Support for multiple granularities
        if granularity in cash_flows:
            period_cash_flows = cash_flows[granularity]
        else:
            # Fallback to yearly if not found
            period_cash_flows = cash_flows.get('yearly', cash_flows)
        total_inflows = 0
        total_outflows = 0
        for period, period_cash in period_cash_flows.items():
            net_cash_flow = float(period_cash.get('net_cash_flow', 0) or 0)
            if net_cash_flow > 0:
                total_inflows += net_cash_flow
            else:
                total_outflows += abs(net_cash_flow)
        summary_report['cash_flow_summary'] = {
            'total_inflows': total_inflows,
            'total_outflows': total_outflows,
            'net_cash_flow': total_inflows - total_outflows,
            'granularity': granularity
        }

    return summary_report


def generate_detailed_report(
    simulation_results: Dict[str, Any],
    report_config: Dict[str, Any],
    granularity: str = 'yearly'
) -> Dict[str, Any]:
    """
    Generate a detailed report from simulation results.
    Now supports yearly, monthly, quarterly, and custom period granularity for cash flows and metrics.

    Args:
        simulation_results: Results from simulation
        report_config: Configuration for the report
        granularity: 'yearly', 'monthly', 'quarterly', or custom period key

    Returns:
        Dictionary with detailed report data
    """
    # Generate summary report first
    summary_report = generate_summary_report(simulation_results, report_config, granularity=granularity)

    # Initialize detailed report
    detailed_report = {
        **summary_report,
        'period_metrics': {},
        'zone_performance': {},
        'loan_performance': {},
        'market_conditions': {}
    }

    # Extract period metrics (granularity-aware)
    if 'cash_flows' in simulation_results:
        cash_flows = simulation_results['cash_flows']
        if granularity in cash_flows:
            period_cash_flows = cash_flows[granularity]
        else:
            period_cash_flows = cash_flows.get('yearly', cash_flows)
        period_metrics = {}
        for period, period_cash in period_cash_flows.items():
            period_metrics[period] = {
                k: float(v) if isinstance(v, Decimal) else v
                for k, v in period_cash.items()
                if not isinstance(v, dict)
            }
        detailed_report['period_metrics'] = period_metrics

    # Extract zone performance
    if 'portfolio' in simulation_results:
        portfolio = simulation_results['portfolio']

        # Check if portfolio is a dictionary or an object
        if isinstance(portfolio, dict) and 'zone_performance' in portfolio:
            detailed_report['zone_performance'] = portfolio['zone_performance']

    # Extract loan performance
    if 'yearly_portfolio' in simulation_results:
        yearly_portfolio = simulation_results['yearly_portfolio']

        loan_performance = {}

        for year, year_portfolio in yearly_portfolio.items():
            if isinstance(year, int) and 'loans' in year_portfolio:
                loans = year_portfolio['loans']

                for loan_id, loan in loans.items():
                    if loan_id not in loan_performance:
                        loan_performance[loan_id] = {}

                    loan_performance[loan_id][year] = {
                        k: float(v) if isinstance(v, Decimal) else v
                        for k, v in loan.items()
                        if not isinstance(v, dict)
                    }

        detailed_report['loan_performance'] = loan_performance

    # Extract market conditions
    if 'market_conditions' in simulation_results:
        market_conditions = simulation_results['market_conditions']

        detailed_report['market_conditions'] = {
            year: {
                k: float(v) if isinstance(v, Decimal) else v
                for k, v in conditions.items()
            }
            for year, conditions in market_conditions.items()
            if isinstance(year, int)
        }

    return detailed_report


def export_to_csv(
    report_data: Dict[str, Any],
    file_path: str,
    sections: Optional[List[str]] = None
) -> str:
    """
    Export report data to CSV format.
    Now supports period_metrics and other granular sections.
    """
    # Determine sections to export
    if sections is None:
        sections = list(report_data.keys())

    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # Flatten report data for CSV export
    flattened_data = {}

    for section in sections:
        if section in report_data and isinstance(report_data[section], dict):
            section_data = report_data[section]
            if section == 'period_metrics':
                for period, metrics in section_data.items():
                    for key, value in metrics.items():
                        flattened_key = f"{section}.{period}.{key}"
                        flattened_data[flattened_key] = value
            else:
                for key, value in section_data.items():
                    flattened_key = f"{section}.{key}"
                    if isinstance(value, dict):
                        for subkey, subvalue in value.items():
                            flattened_subkey = f"{flattened_key}.{subkey}"
                            flattened_data[flattened_subkey] = subvalue
                    else:
                        flattened_data[flattened_key] = value

    # Write to CSV
    with open(file_path, 'w', newline='') as csvfile:
        fieldnames = ['Metric', 'Value']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()

        for key, value in flattened_data.items():
            writer.writerow({'Metric': key, 'Value': value})

    return file_path


def export_to_excel(
    report_data: Dict[str, Any],
    file_path: str,
    sections: Optional[List[str]] = None
) -> str:
    """
    Export report data to Excel format.
    Now supports period_metrics and other granular sections.
    """
    # Determine sections to export
    if sections is None:
        sections = list(report_data.keys())

    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # Create Excel writer
    writer = pd.ExcelWriter(file_path, engine='xlsxwriter')

    # Export each section to a separate sheet
    for section in sections:
        if section in report_data and isinstance(report_data[section], dict):
            section_data = report_data[section]
            if section == 'period_metrics':
                df = pd.DataFrame.from_dict(section_data, orient='index')
            elif section == 'loan_performance':
                # Special handling for loan performance
                loan_dfs = []

                for loan_id, loan_data in section_data.items():
                    loan_df = pd.DataFrame.from_dict(loan_data, orient='index')
                    loan_df['loan_id'] = loan_id
                    loan_dfs.append(loan_df)

                if loan_dfs:
                    df = pd.concat(loan_dfs)
                else:
                    df = pd.DataFrame()
            elif section == 'market_conditions':
                # Special handling for market conditions
                df = pd.DataFrame.from_dict(section_data, orient='index')
            else:
                # Default handling
                df = pd.DataFrame.from_dict(section_data, orient='index', columns=['Value'])
                df.index.name = 'Metric'

            # Write DataFrame to Excel sheet
            df.to_excel(writer, sheet_name=section)

    # Save Excel file
    writer.close()

    return file_path


def export_to_json(
    report_data: Dict[str, Any],
    file_path: str,
    sections: Optional[List[str]] = None
) -> str:
    """
    Export report data to JSON format.

    Args:
        report_data: Report data to export
        file_path: Path to save the JSON file
        sections: Sections of the report to export (None for all)

    Returns:
        Path to the saved JSON file
    """
    # Determine sections to export
    if sections is None:
        sections = list(report_data.keys())

    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # Filter report data by sections
    filtered_data = {
        section: report_data[section]
        for section in sections
        if section in report_data
    }

    # Convert Decimal to float for JSON serialization
    def decimal_to_float(obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, dict):
            return {k: decimal_to_float(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [decimal_to_float(item) for item in obj]
        else:
            return obj

    filtered_data = decimal_to_float(filtered_data)

    # Write to JSON
    with open(file_path, 'w') as jsonfile:
        json.dump(filtered_data, jsonfile, indent=2)

    return file_path


def generate_chart_image(
    chart_data: Dict[str, Any],
    chart_type: str,
    chart_config: Dict[str, Any]
) -> str:
    """
    Generate a chart image from chart data.

    Args:
        chart_data: Data for the chart
        chart_type: Type of chart to generate
        chart_config: Configuration for the chart

    Returns:
        Base64-encoded image data
    """
    try:
        import matplotlib.pyplot as plt
        import matplotlib
        matplotlib.use('Agg')
    except ImportError:
        return ""

    # Create figure
    fig, ax = plt.subplots(figsize=(10, 6))

    # Generate chart based on type
    if chart_type == 'line':
        x = chart_data.get('x', [])
        y = chart_data.get('y', [])

        ax.plot(x, y, marker='o')

        # Set labels
        ax.set_xlabel(chart_config.get('x_label', 'X'))
        ax.set_ylabel(chart_config.get('y_label', 'Y'))

        # Set title
        ax.set_title(chart_config.get('title', 'Line Chart'))

        # Set grid
        ax.grid(chart_config.get('grid', True))

    elif chart_type == 'bar':
        x = chart_data.get('x', [])
        y = chart_data.get('y', [])

        ax.bar(x, y)

        # Set labels
        ax.set_xlabel(chart_config.get('x_label', 'X'))
        ax.set_ylabel(chart_config.get('y_label', 'Y'))

        # Set title
        ax.set_title(chart_config.get('title', 'Bar Chart'))

        # Set grid
        ax.grid(chart_config.get('grid', True), axis='y')

    elif chart_type == 'pie':
        values = chart_data.get('values', [])
        labels = chart_data.get('labels', [])

        ax.pie(values, labels=labels, autopct='%1.1f%%')

        # Set title
        ax.set_title(chart_config.get('title', 'Pie Chart'))

        # Set aspect ratio
        ax.axis('equal')

    elif chart_type == 'scatter':
        x = chart_data.get('x', [])
        y = chart_data.get('y', [])

        ax.scatter(x, y)

        # Set labels
        ax.set_xlabel(chart_config.get('x_label', 'X'))
        ax.set_ylabel(chart_config.get('y_label', 'Y'))

        # Set title
        ax.set_title(chart_config.get('title', 'Scatter Plot'))

        # Set grid
        ax.grid(chart_config.get('grid', True))

    # Save chart to BytesIO
    buffer = BytesIO()
    plt.savefig(buffer, format='png')
    buffer.seek(0)

    # Encode as base64
    image_data = base64.b64encode(buffer.read()).decode('utf-8')

    # Close figure
    plt.close(fig)

    return image_data


def generate_pdf_report(
    report_data: Dict[str, Any],
    file_path: str,
    template_config: Dict[str, Any]
) -> str:
    """
    Generate a PDF report from report data.

    Args:
        report_data: Report data to include in the PDF
        file_path: Path to save the PDF file
        template_config: Configuration for the report template

    Returns:
        Path to the saved PDF file
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet
    except ImportError:
        return ""

    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # Create PDF document
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()

    # Initialize elements
    elements = []

    # Add title
    title = template_config.get('title', report_data.get('title', 'Fund Simulation Report'))
    elements.append(Paragraph(title, styles['Title']))
    elements.append(Spacer(1, 12))

    # Add date
    date_generated = report_data.get('date_generated', datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    elements.append(Paragraph(f"Generated on: {date_generated}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Add sections based on template configuration
    sections = template_config.get('sections', [
        'fund_parameters',
        'performance_metrics',
        'waterfall_distribution',
        'cash_flow_summary',
        'risk_metrics'
    ])

    for section in sections:
        if section in report_data and isinstance(report_data[section], dict):
            # Add section title
            section_title = section.replace('_', ' ').title()
            elements.append(Paragraph(section_title, styles['Heading2']))
            elements.append(Spacer(1, 6))

            # Add section data as table
            section_data = report_data[section]

            if section == 'period_metrics':
                # Special handling for period metrics
                table_data = [['Period'] + list(next(iter(section_data.values())).keys())]

                for period, metrics in sorted(section_data.items()):
                    table_data.append([period] + list(metrics.values()))
            elif section == 'loan_performance':
                # Special handling for loan performance
                loan_dfs = []

                for loan_id, loan_data in section_data.items():
                    loan_df = pd.DataFrame.from_dict(loan_data, orient='index')
                    loan_df['loan_id'] = loan_id
                    loan_dfs.append(loan_df)

                if loan_dfs:
                    df = pd.concat(loan_dfs)
                else:
                    df = pd.DataFrame()
            elif section == 'market_conditions':
                # Special handling for market conditions
                df = pd.DataFrame.from_dict(section_data, orient='index')
            else:
                # Default handling
                df = pd.DataFrame.from_dict(section_data, orient='index', columns=['Value'])
                df.index.name = 'Metric'

            # Write DataFrame to Excel sheet
            df.to_excel(writer, sheet_name=section)

    # Build PDF
    doc.build(elements)

    return file_path


def generate_report_from_template(
    simulation_results: Dict[str, Any],
    template_name: str,
    output_format: str = 'json',
    output_path: str = None
) -> Dict[str, Any]:
    """
    Generate a report from a template.

    Args:
        simulation_results: Results from simulation
        template_name: Name of the template to use (must match a file in auditapr24/templates/)
        output_format: Format to output the report (json, csv, excel, pdf)
        output_path: Path to save the report file (None for in-memory)

    Returns:
        Dictionary with report data and file path
    """
    # Load template from external file
    template_config = load_report_template(template_name)

    # Generate report data
    if template_name == 'detailed':
        report_data = generate_detailed_report(simulation_results, template_config)
    else:
        report_data = generate_summary_report(simulation_results, template_config)

    # Export report if output path is provided
    file_path = None

    if output_path is not None:
        if output_format == 'csv':
            file_path = export_to_csv(report_data, output_path, template_config.get('sections'))
        elif output_format == 'excel':
            file_path = export_to_excel(report_data, output_path, template_config.get('sections'))
        elif output_format == 'pdf':
            file_path = generate_pdf_report(report_data, output_path, template_config)
        else:  # default to json
            file_path = export_to_json(report_data, output_path, template_config.get('sections'))

    return {
        'report_data': report_data,
        'file_path': file_path
    }

def generate_fan_chart_data(simulation_results: Dict[str, Any], metric: str = 'irr', granularity: str = 'yearly', percentiles: list = [10, 25, 50, 75, 90]) -> Dict[str, Any]:
    """
    Generate data for a fan chart showing percentiles of a metric over time.
    Args:
        simulation_results: Results from simulation (should include period_metrics or similar)
        metric: The metric to visualize (e.g., 'irr', 'roi')
        granularity: 'yearly', 'monthly', etc.
        percentiles: List of percentiles to include
    Returns:
        Dict with 'periods' and 'percentiles' as described in chart_types.md
    """
    # Assume simulation_results['period_metrics'] is a dict: {period: {metric: value, ...}}
    period_metrics = simulation_results.get('period_metrics', {})
    periods = sorted(period_metrics.keys())
    # Collect all values for each period (if multiple simulations, otherwise just one value)
    # Here, assume each period has a list of values for the metric (for MC, etc.)
    values_by_period = {p: period_metrics[p].get(metric, []) for p in periods}
    # If values are not lists, wrap them
    for p in values_by_period:
        if not isinstance(values_by_period[p], list):
            values_by_period[p] = [values_by_period[p]]
    percentiles_dict = {}
    for pct in percentiles:
        percentiles_dict[str(pct)] = [
            float(np.percentile(values_by_period[p], pct)) if values_by_period[p] else None
            for p in periods
        ]
    return {
        'periods': periods,
        'percentiles': percentiles_dict
    }

def generate_heatmap_data(matrix_data: Dict[str, Dict[str, float]], x_axis: str = 'x', y_axis: str = 'y') -> Dict[str, Any]:
    """
    Generate data for a heatmap chart.
    Args:
        matrix_data: Dict of dicts, e.g., {y_label: {x_label: value}}
        x_axis: Name for x labels
        y_axis: Name for y labels
    Returns:
        Dict with 'x_labels', 'y_labels', and 'values' (2D array)
    """
    y_labels = list(matrix_data.keys())
    x_labels = list({x for row in matrix_data.values() for x in row.keys()})
    x_labels.sort()
    values = [
        [matrix_data[y].get(x, None) for x in x_labels]
        for y in y_labels
    ]
    return {
        'x_labels': x_labels,
        'y_labels': y_labels,
        'values': values
    }

def generate_tornado_chart_data(sensitivity_data: Dict[str, float]) -> Dict[str, Any]:
    """
    Generate data for a tornado chart (sensitivity analysis).
    Args:
        sensitivity_data: Dict mapping parameter name to impact value
    Returns:
        Dict with 'parameters' and 'impacts' lists
    """
    sorted_items = sorted(sensitivity_data.items(), key=lambda x: abs(x[1]), reverse=True)
    parameters = [k for k, v in sorted_items]
    impacts = [v for k, v in sorted_items]
    return {
        'parameters': parameters,
        'impacts': impacts
    }

def generate_multi_dim_sensitivity_data(x_param: str, y_param: str, x_values: list, y_values: list, z_matrix: list) -> Dict[str, Any]:
    """
    Generate data for a multi-dimensional sensitivity chart.
    Args:
        x_param: Name of x parameter
        y_param: Name of y parameter
        x_values: List of x values
        y_values: List of y values
        z_matrix: 2D array of outcome values (z) for each (x, y) pair
    Returns:
        Dict as described in chart_types.md
    """
    return {
        'x_param': x_param,
        'y_param': y_param,
        'x_values': x_values,
        'y_values': y_values,
        'z_values': z_matrix
    }

def generate_correlation_matrix_data(labels: list, matrix: list) -> Dict[str, Any]:
    """
    Generate data for a correlation matrix chart.
    Args:
        labels: List of parameter/metric names
        matrix: 2D array of correlation values
    Returns:
        Dict as described in chart_types.md
    """
    return {
        'labels': labels,
        'matrix': matrix
    }
