"""
Tests for the variance analysis module.
"""

import unittest
import json
from unittest.mock import patch, MagicMock
import pandas as pd
import numpy as np

from calculations.variance_analysis import run_variance_analysis


class TestVarianceAnalysis(unittest.TestCase):
    """Test cases for the variance analysis module."""

    def setUp(self):
        """Set up test fixtures."""
        self.config = {
            'fund_size': 100000000,
            'fund_term': 10,
            'hurdle_rate': 0.08,
            'carried_interest_rate': 0.20,
            'waterfall_structure': 'european',
        }

    @patch('calculations.variance_analysis.run_config_mc')
    def test_run_variance_analysis(self, mock_run_config_mc):
        """Test that run_variance_analysis returns the expected results."""
        # Create a mock DataFrame with IRR, equity multiple, and ROI columns
        mock_df = pd.DataFrame({
            'irr': np.random.normal(0.15, 0.03, 100),
            'equity_multiple': np.random.normal(2.0, 0.2, 100),
            'roi': np.random.normal(1.0, 0.1, 100),
            'var_95': np.random.normal(0.1, 0.01, 100),
            'cvar_95': np.random.normal(0.12, 0.01, 100),
        })
        mock_run_config_mc.return_value = mock_df

        # Run the function
        result = run_variance_analysis(self.config, num_simulations=100, seed=42)

        # Check that the function was called with the expected arguments
        mock_run_config_mc.assert_called_once_with(self.config, n_inner=100)

        # Check that the result has the expected keys
        self.assertIn('summary', result)
        self.assertIn('histograms', result)
        self.assertIn('fan_chart', result)
        self.assertIn('raw_results', result)

        # Check that the summary has the expected keys
        self.assertIn('irr', result['summary'])
        self.assertIn('equity_multiple', result['summary'])
        self.assertIn('roi', result['summary'])
        self.assertIn('var_95', result['summary'])
        self.assertIn('cvar_95', result['summary'])

        # Check that the histograms have the expected keys
        self.assertIn('irr', result['histograms'])
        self.assertIn('equity_multiple', result['histograms'])
        self.assertIn('roi', result['histograms'])

        # Check that the fan chart has the expected keys
        self.assertIn('years', result['fan_chart'])
        self.assertIn('p5', result['fan_chart'])
        self.assertIn('p25', result['fan_chart'])
        self.assertIn('p50', result['fan_chart'])
        self.assertIn('p75', result['fan_chart'])
        self.assertIn('p95', result['fan_chart'])

        # Check that the raw results are a list
        self.assertIsInstance(result['raw_results'], list)


if __name__ == '__main__':
    unittest.main()
