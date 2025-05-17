"""
Verification system for the simulation engine.

This module provides a framework for verifying the accuracy of the simulation engine
by comparing actual calculation results with expected results.
"""

import logging
import json
import os
import time
import uuid
from typing import Dict, Any, List, Optional, Callable, Union
import pandas as pd
import numpy as np
from decimal import Decimal
from datetime import datetime

from calculations.simulation_controller import SimulationController

# Set up logging
logger = logging.getLogger(__name__)

class VerificationSystem:
    """System for verifying calculation accuracy."""

    def __init__(self, test_cases_dir: str = 'verification/test_cases'):
        """Initialize the verification system.
        
        Args:
            test_cases_dir: Directory containing test case JSON files
        """
        self.test_cases_dir = test_cases_dir
        self.test_cases = {}
        self.results = {}
        self.verification_id = str(uuid.uuid4())
        
        # Create test cases directory if it doesn't exist
        os.makedirs(test_cases_dir, exist_ok=True)
        
        # Load test cases
        self._load_test_cases()
        
        logger.info(f"Verification system initialized with ID {self.verification_id}")
        logger.info(f"Loaded {len(self.test_cases)} test cases from {self.test_cases_dir}")

    def _load_test_cases(self) -> None:
        """Load test cases from the test cases directory."""
        logger.info(f"Loading test cases from {self.test_cases_dir}")

        if not os.path.exists(self.test_cases_dir):
            logger.warning(f"Test cases directory {self.test_cases_dir} does not exist")
            return

        for filename in os.listdir(self.test_cases_dir):
            if not filename.endswith('.json'):
                continue

            test_case_path = os.path.join(self.test_cases_dir, filename)
            try:
                with open(test_case_path, 'r') as f:
                    test_case = json.load(f)

                # Validate test case
                if not self._validate_test_case(test_case):
                    logger.warning(f"Invalid test case in {filename}")
                    continue

                # Add test case to the collection
                test_case_id = test_case.get('id', filename.replace('.json', ''))
                self.test_cases[test_case_id] = test_case
                logger.info(f"Loaded test case {test_case_id}: {test_case.get('name', 'Unnamed')}")

            except Exception as e:
                logger.error(f"Error loading test case {filename}: {str(e)}", exc_info=True)

    def _validate_test_case(self, test_case: Dict[str, Any]) -> bool:
        """Validate a test case.
        
        Args:
            test_case: Test case to validate
            
        Returns:
            bool: True if the test case is valid, False otherwise
        """
        required_fields = ['name', 'description', 'config', 'expected_results']

        for field in required_fields:
            if field not in test_case:
                logger.warning(f"Test case missing required field: {field}")
                return False
                
        # Validate config
        if not isinstance(test_case['config'], dict):
            logger.warning(f"Test case config must be a dictionary")
            return False
            
        # Validate expected_results
        if not isinstance(test_case['expected_results'], dict):
            logger.warning(f"Test case expected_results must be a dictionary")
            return False

        return True

    def add_test_case(self, test_case: Dict[str, Any]) -> str:
        """Add a new test case.
        
        Args:
            test_case: Test case to add
            
        Returns:
            str: ID of the added test case
            
        Raises:
            ValueError: If the test case is invalid
        """
        # Validate test case
        if not self._validate_test_case(test_case):
            raise ValueError("Invalid test case")
            
        # Generate ID if not provided
        if 'id' not in test_case:
            test_case['id'] = f"test_case_{len(self.test_cases) + 1}"
            
        test_case_id = test_case['id']
        
        # Add test case to the collection
        self.test_cases[test_case_id] = test_case
        
        # Save test case to file
        test_case_path = os.path.join(self.test_cases_dir, f"{test_case_id}.json")
        try:
            with open(test_case_path, 'w') as f:
                json.dump(test_case, f, indent=2)
            logger.info(f"Saved test case {test_case_id} to {test_case_path}")
        except Exception as e:
            logger.error(f"Error saving test case {test_case_id}: {str(e)}", exc_info=True)
            
        return test_case_id

    def run_verification(self, test_case_id: str, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Run verification for a specific test case.
        
        Args:
            test_case_id: ID of the test case to verify
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dict[str, Any]: Verification results
            
        Raises:
            ValueError: If the test case is not found
        """
        if test_case_id not in self.test_cases:
            logger.error(f"Test case {test_case_id} not found")
            raise ValueError(f"Test case {test_case_id} not found")

        test_case = self.test_cases[test_case_id]
        logger.info(f"Running verification for test case {test_case_id}: {test_case['name']}")
        
        if progress_callback:
            progress_callback('setup', 0.1, f"Setting up verification for test case {test_case_id}")

        # Create simulation controller
        controller = SimulationController(test_case['config'])
        
        # Set progress callback if provided
        if progress_callback:
            controller.set_progress_callback(
                lambda step, progress, message: progress_callback(
                    step, 0.1 + progress * 0.8, message
                )
            )

        # Run simulation
        start_time = time.time()
        results = controller.run_simulation()
        end_time = time.time()
        
        if progress_callback:
            progress_callback('comparing', 0.9, f"Comparing results with expected values")

        # Compare results with expected results
        comparison_results = self._compare_results(results, test_case['expected_results'])
        
        if progress_callback:
            progress_callback('completed', 1.0, f"Verification completed")

        # Store verification results
        verification_results = {
            'verification_id': self.verification_id,
            'test_case_id': test_case_id,
            'test_case_name': test_case['name'],
            'test_case_description': test_case['description'],
            'status': 'passed' if comparison_results['match'] else 'failed',
            'execution_time': end_time - start_time,
            'timestamp': datetime.now().isoformat(),
            'comparison_results': comparison_results,
            'config': test_case['config'],
            'expected_results': test_case['expected_results'],
            'actual_results': results
        }

        self.results[test_case_id] = verification_results

        logger.info(f"Verification for test case {test_case_id} completed with status: {verification_results['status']}")
        if not comparison_results['match']:
            logger.warning(f"Mismatches found: {comparison_results['mismatches']}")
            
        return verification_results

    def run_all_verifications(self, progress_callback: Optional[Callable] = None) -> Dict[str, Any]:
        """Run verification for all test cases.
        
        Args:
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dict[str, Any]: Verification results for all test cases
        """
        logger.info(f"Running verification for all {len(self.test_cases)} test cases")
        
        if progress_callback:
            progress_callback('setup', 0.0, f"Setting up verification for {len(self.test_cases)} test cases")

        all_results = {}
        for i, test_case_id in enumerate(self.test_cases):
            if progress_callback:
                overall_progress = i / len(self.test_cases)
                progress_callback('running', overall_progress, f"Running test case {i+1}/{len(self.test_cases)}: {test_case_id}")
                
            # Create a wrapped progress callback for this test case
            if progress_callback:
                test_case_progress_callback = lambda step, progress, message: progress_callback(
                    step, 
                    overall_progress + progress / len(self.test_cases), 
                    f"Test case {i+1}/{len(self.test_cases)} - {message}"
                )
            else:
                test_case_progress_callback = None
                
            # Run verification for this test case
            all_results[test_case_id] = self.run_verification(
                test_case_id, 
                progress_callback=test_case_progress_callback
            )
            
        if progress_callback:
            progress_callback('completed', 1.0, f"All verifications completed")

        # Calculate summary statistics
        passed = sum(1 for r in all_results.values() if r['status'] == 'passed')
        failed = sum(1 for r in all_results.values() if r['status'] == 'failed')
        error = sum(1 for r in all_results.values() if r['status'] == 'error')

        summary = {
            'verification_id': self.verification_id,
            'timestamp': datetime.now().isoformat(),
            'total': len(all_results),
            'passed': passed,
            'failed': failed,
            'error': error,
            'pass_rate': passed / len(all_results) if all_results else 0
        }

        logger.info(f"All verifications completed. Summary: {summary}")

        return {
            'verification_id': self.verification_id,
            'timestamp': datetime.now().isoformat(),
            'summary': summary,
            'results': all_results
        }

    def _compare_results(self, actual: Dict[str, Any], expected: Dict[str, Any]) -> Dict[str, Any]:
        """Compare actual results with expected results.
        
        Args:
            actual: Actual results from the simulation
            expected: Expected results
            
        Returns:
            Dict[str, Any]: Comparison results
        """
        comparison = {
            'match': True,
            'mismatches': [],
            'details': {}
        }

        # Compare top-level keys
        actual_keys = set(actual.keys())
        expected_keys = set(expected.keys())

        missing_keys = expected_keys - actual_keys
        extra_keys = actual_keys - expected_keys

        if missing_keys:
            comparison['match'] = False
            comparison['mismatches'].append(f"Missing keys: {missing_keys}")

        if extra_keys:
            # Extra keys are not considered a mismatch, but we log them
            logger.info(f"Extra keys in actual results: {extra_keys}")

        # Compare values for common keys
        for key in actual_keys.intersection(expected_keys):
            if key not in expected:
                continue

            # Handle different types of values
            if isinstance(expected[key], dict) and isinstance(actual[key], dict):
                # Recursively compare dictionaries
                sub_comparison = self._compare_results(actual[key], expected[key])
                comparison['details'][key] = sub_comparison

                if not sub_comparison['match']:
                    comparison['match'] = False
                    comparison['mismatches'].append(f"Mismatch in {key}")

            elif isinstance(expected[key], (list, tuple)) and isinstance(actual[key], (list, tuple)):
                # Compare lists
                if len(expected[key]) != len(actual[key]):
                    comparison['match'] = False
                    comparison['mismatches'].append(f"Length mismatch for {key}: expected {len(expected[key])}, got {len(actual[key])}")
                    comparison['details'][key] = {
                        'match': False,
                        'expected_length': len(expected[key]),
                        'actual_length': len(actual[key])
                    }
                else:
                    # Compare list items
                    list_comparison = {'match': True, 'mismatches': []}
                    for i, (exp_item, act_item) in enumerate(zip(expected[key], actual[key])):
                        if isinstance(exp_item, dict) and isinstance(act_item, dict):
                            item_comparison = self._compare_results(act_item, exp_item)
                            if not item_comparison['match']:
                                list_comparison['match'] = False
                                list_comparison['mismatches'].append(f"Mismatch in item {i}")
                        elif not self._values_match(exp_item, act_item):
                            list_comparison['match'] = False
                            list_comparison['mismatches'].append(f"Mismatch in item {i}: expected {exp_item}, got {act_item}")

                    comparison['details'][key] = list_comparison
                    if not list_comparison['match']:
                        comparison['match'] = False
                        comparison['mismatches'].append(f"Mismatch in {key} list items")

            elif not self._values_match(expected[key], actual[key]):
                comparison['match'] = False
                comparison['mismatches'].append(f"Value mismatch for {key}: expected {expected[key]}, got {actual[key]}")
                comparison['details'][key] = {
                    'match': False,
                    'expected': expected[key],
                    'actual': actual[key],
                    'difference': self._calculate_difference(expected[key], actual[key])
                }

        return comparison

    def _values_match(self, expected: Any, actual: Any) -> bool:
        """Check if two values match, with tolerance for numerical values.
        
        Args:
            expected: Expected value
            actual: Actual value
            
        Returns:
            bool: True if the values match, False otherwise
        """
        # Handle None
        if expected is None and actual is None:
            return True

        # Handle different types
        if type(expected) != type(actual):
            # Special case: numeric types
            if isinstance(expected, (int, float, Decimal)) and isinstance(actual, (int, float, Decimal)):
                return self._numeric_values_match(float(expected), float(actual))
            return False

        # Handle numeric types
        if isinstance(expected, (int, float, Decimal)):
            return self._numeric_values_match(float(expected), float(actual))

        # Handle strings
        if isinstance(expected, str):
            return expected == actual

        # Handle other types
        return expected == actual

    def _numeric_values_match(self, expected: float, actual: float) -> bool:
        """Check if two numeric values match, with relative tolerance.
        
        Args:
            expected: Expected value
            actual: Actual value
            
        Returns:
            bool: True if the values match within tolerance, False otherwise
        """
        # For small values, use absolute tolerance
        if abs(expected) < 1e-10 and abs(actual) < 1e-10:
            return True

        # For larger values, use relative tolerance
        relative_diff = abs(expected - actual) / max(abs(expected), abs(actual))
        return relative_diff < 1e-6

    def _calculate_difference(self, expected: Any, actual: Any) -> Any:
        """Calculate the difference between expected and actual values.
        
        Args:
            expected: Expected value
            actual: Actual value
            
        Returns:
            Any: Difference between the values
        """
        if isinstance(expected, (int, float, Decimal)) and isinstance(actual, (int, float, Decimal)):
            expected_float = float(expected)
            actual_float = float(actual)
            absolute_diff = abs(expected_float - actual_float)
            if abs(expected_float) > 1e-10:
                relative_diff = absolute_diff / abs(expected_float)
                return {'absolute': absolute_diff, 'relative': relative_diff}
            return {'absolute': absolute_diff}

        return "Values are not comparable"

    def generate_report(self, output_path: str = 'verification_report.json') -> str:
        """Generate a verification report.
        
        Args:
            output_path: Path to save the report
            
        Returns:
            str: Path to the generated report
            
        Raises:
            ValueError: If no verification results are available
        """
        if not self.results:
            logger.warning("No verification results to report")
            raise ValueError("No verification results to report")

        # Calculate summary statistics
        passed = sum(1 for r in self.results.values() if r['status'] == 'passed')
        failed = sum(1 for r in self.results.values() if r['status'] == 'failed')
        error = sum(1 for r in self.results.values() if r['status'] == 'error')

        summary = {
            'verification_id': self.verification_id,
            'timestamp': datetime.now().isoformat(),
            'total': len(self.results),
            'passed': passed,
            'failed': failed,
            'error': error,
            'pass_rate': passed / len(self.results) if self.results else 0
        }

        # Create report
        report = {
            'verification_id': self.verification_id,
            'timestamp': datetime.now().isoformat(),
            'summary': summary,
            'results': self.results
        }

        # Save report
        try:
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
            logger.info(f"Verification report saved to {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Error saving verification report: {str(e)}", exc_info=True)
            raise

    def generate_html_report(self, output_path: str = 'verification_report.html') -> str:
        """Generate an HTML verification report.
        
        Args:
            output_path: Path to save the report
            
        Returns:
            str: Path to the generated report
            
        Raises:
            ValueError: If no verification results are available
        """
        if not self.results:
            logger.warning("No verification results to report")
            raise ValueError("No verification results to report")

        # Calculate summary statistics
        passed = sum(1 for r in self.results.values() if r['status'] == 'passed')
        failed = sum(1 for r in self.results.values() if r['status'] == 'failed')
        error = sum(1 for r in self.results.values() if r['status'] == 'error')
        
        pass_rate = passed / len(self.results) if self.results else 0
        
        # Create HTML report
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Verification Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #333; }}
                .summary {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
                .passed {{ color: green; }}
                .failed {{ color: red; }}
                .error {{ color: orange; }}
                table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
                .details {{ margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-radius: 5px; }}
                .toggle-btn {{ cursor: pointer; color: blue; text-decoration: underline; }}
                .hidden {{ display: none; }}
                pre {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }}
                .progress-bar {{ height: 20px; background-color: #e0e0e0; border-radius: 10px; margin-bottom: 10px; }}
                .progress {{ height: 100%; background-color: green; border-radius: 10px; }}
            </style>
            <script>
                function toggleDetails(id) {{
                    var element = document.getElementById(id);
                    if (element.classList.contains('hidden')) {{
                        element.classList.remove('hidden');
                    }} else {{
                        element.classList.add('hidden');
                    }}
                }}
            </script>
        </head>
        <body>
            <h1>Verification Report</h1>
            <div class="summary">
                <h2>Summary</h2>
                <p><strong>Verification ID:</strong> {self.verification_id}</p>
                <p><strong>Timestamp:</strong> {datetime.now().isoformat()}</p>
                <p><strong>Total Test Cases:</strong> {len(self.results)}</p>
                <p><strong>Passed:</strong> <span class="passed">{passed}</span></p>
                <p><strong>Failed:</strong> <span class="failed">{failed}</span></p>
                <p><strong>Error:</strong> <span class="error">{error}</span></p>
                <p><strong>Pass Rate:</strong> {pass_rate:.2%}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: {pass_rate * 100}%;"></div>
                </div>
            </div>
            
            <h2>Test Case Results</h2>
            <table>
                <tr>
                    <th>Test Case ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Execution Time</th>
                    <th>Details</th>
                </tr>
        """
        
        # Add rows for each test case
        for test_case_id, result in self.results.items():
            status_class = "passed" if result['status'] == 'passed' else "failed" if result['status'] == 'failed' else "error"
            html += f"""
                <tr>
                    <td>{test_case_id}</td>
                    <td>{result['test_case_name']}</td>
                    <td class="{status_class}">{result['status'].upper()}</td>
                    <td>{result['execution_time']:.2f} seconds</td>
                    <td><span class="toggle-btn" onclick="toggleDetails('details-{test_case_id}')">Show/Hide Details</span></td>
                </tr>
            """
            
            # Add details section
            html += f"""
                <tr>
                    <td colspan="5">
                        <div id="details-{test_case_id}" class="details hidden">
                            <h3>Test Case Description</h3>
                            <p>{result['test_case_description']}</p>
                            
                            <h3>Configuration</h3>
                            <pre>{json.dumps(result['config'], indent=2)}</pre>
                            
                            <h3>Comparison Results</h3>
            """
            
            if result['status'] == 'passed':
                html += "<p>All values match expected results.</p>"
            else:
                html += "<h4>Mismatches</h4><ul>"
                for mismatch in result['comparison_results']['mismatches']:
                    html += f"<li>{mismatch}</li>"
                html += "</ul>"
                
            html += f"""
                            <h3>Expected vs Actual Results</h3>
                            <div class="toggle-btn" onclick="toggleDetails('expected-{test_case_id}')">Show/Hide Expected Results</div>
                            <pre id="expected-{test_case_id}" class="hidden">{json.dumps(result['expected_results'], indent=2)}</pre>
                            
                            <div class="toggle-btn" onclick="toggleDetails('actual-{test_case_id}')">Show/Hide Actual Results</div>
                            <pre id="actual-{test_case_id}" class="hidden">{json.dumps(result['actual_results'], indent=2)}</pre>
                        </div>
                    </td>
                </tr>
            """
        
        # Close the HTML
        html += """
            </table>
        </body>
        </html>
        """
        
        # Save the HTML report
        try:
            with open(output_path, 'w') as f:
                f.write(html)
            logger.info(f"HTML verification report saved to {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Error saving HTML verification report: {str(e)}", exc_info=True)
            raise
