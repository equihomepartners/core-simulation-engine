"""
Integration with External Data Sources for Market Conditions Module

This module implements integration with external data sources for market conditions
for the Equihome Fund Simulation Engine.

Key components:
1. API clients for external data sources
2. Data fetching and caching
3. Data transformation and normalization
4. Market condition generation based on external data
5. Historical data analysis
6. Forecast generation
"""

import requests
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import datetime
import time
import os
import logging
from decimal import Decimal
import hashlib
import pickle

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'cache')
CACHE_EXPIRY = 86400  # 24 hours in seconds


class ExternalDataClient:
    """Base class for external data clients."""
    
    def __init__(self, api_key: Optional[str] = None, cache_enabled: bool = True):
        """
        Initialize the external data client.
        
        Args:
            api_key: API key for the external data source
            cache_enabled: Whether to enable caching
        """
        self.api_key = api_key
        self.cache_enabled = cache_enabled
        
        # Create cache directory if it doesn't exist
        if self.cache_enabled and not os.path.exists(CACHE_DIR):
            os.makedirs(CACHE_DIR)
    
    def _get_cache_path(self, endpoint: str, params: Dict[str, Any]) -> str:
        """
        Get the cache path for the given endpoint and parameters.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            
        Returns:
            Cache path
        """
        # Create a unique cache key based on endpoint and parameters
        cache_key = f"{endpoint}_{json.dumps(params, sort_keys=True)}"
        cache_hash = hashlib.md5(cache_key.encode()).hexdigest()
        
        return os.path.join(CACHE_DIR, f"{self.__class__.__name__}_{cache_hash}.pkl")
    
    def _get_from_cache(self, endpoint: str, params: Dict[str, Any]) -> Optional[Any]:
        """
        Get data from cache.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            
        Returns:
            Cached data or None if not found or expired
        """
        if not self.cache_enabled:
            return None
        
        cache_path = self._get_cache_path(endpoint, params)
        
        if not os.path.exists(cache_path):
            return None
        
        # Check if cache is expired
        if time.time() - os.path.getmtime(cache_path) > CACHE_EXPIRY:
            return None
        
        try:
            with open(cache_path, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            logger.warning(f"Error loading from cache: {e}")
            return None
    
    def _save_to_cache(self, endpoint: str, params: Dict[str, Any], data: Any) -> None:
        """
        Save data to cache.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            data: Data to cache
        """
        if not self.cache_enabled:
            return
        
        cache_path = self._get_cache_path(endpoint, params)
        
        try:
            with open(cache_path, 'wb') as f:
                pickle.dump(data, f)
        except Exception as e:
            logger.warning(f"Error saving to cache: {e}")
    
    def fetch_data(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch data from the external data source.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            
        Returns:
            API response data
        """
        # Check cache first
        cached_data = self._get_from_cache(endpoint, params)
        if cached_data is not None:
            logger.info(f"Using cached data for {endpoint}")
            return cached_data
        
        # Implement in subclasses
        raise NotImplementedError("Subclasses must implement fetch_data")


class FredDataClient(ExternalDataClient):
    """Client for Federal Reserve Economic Data (FRED)."""
    
    BASE_URL = "https://api.stlouisfed.org/fred"
    
    def fetch_data(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch data from FRED.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            
        Returns:
            API response data
        """
        # Check cache first
        cached_data = self._get_from_cache(endpoint, params)
        if cached_data is not None:
            logger.info(f"Using cached data for {endpoint}")
            return cached_data
        
        # Add API key to parameters
        if self.api_key:
            params['api_key'] = self.api_key
        
        # Add format parameter
        params['file_type'] = 'json'
        
        # Build URL
        url = f"{self.BASE_URL}/{endpoint}"
        
        try:
            # Make request
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            # Parse response
            data = response.json()
            
            # Save to cache
            self._save_to_cache(endpoint, params, data)
            
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data from FRED: {e}")
            raise
    
    def get_series(self, series_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> pd.DataFrame:
        """
        Get time series data from FRED.
        
        Args:
            series_id: FRED series ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            DataFrame with time series data
        """
        # Set up parameters
        params = {
            'series_id': series_id
        }
        
        if start_date:
            params['observation_start'] = start_date
        
        if end_date:
            params['observation_end'] = end_date
        
        # Fetch data
        data = self.fetch_data('series/observations', params)
        
        # Convert to DataFrame
        df = pd.DataFrame(data['observations'])
        
        # Convert date column to datetime
        df['date'] = pd.to_datetime(df['date'])
        
        # Convert value column to float
        df['value'] = pd.to_numeric(df['value'], errors='coerce')
        
        # Set date as index
        df.set_index('date', inplace=True)
        
        return df


class ZillowDataClient(ExternalDataClient):
    """Client for Zillow Research Data."""
    
    BASE_URL = "https://www.zillow.com/research/data"
    
    def fetch_data(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch data from Zillow Research.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            
        Returns:
            API response data
        """
        # Check cache first
        cached_data = self._get_from_cache(endpoint, params)
        if cached_data is not None:
            logger.info(f"Using cached data for {endpoint}")
            return cached_data
        
        # Build URL
        url = f"{self.BASE_URL}/{endpoint}"
        
        try:
            # Make request
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            # Parse response
            data = response.json()
            
            # Save to cache
            self._save_to_cache(endpoint, params, data)
            
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data from Zillow: {e}")
            raise
    
    def get_zhvi(self, region_type: str, region_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None) -> pd.DataFrame:
        """
        Get Zillow Home Value Index (ZHVI) data.
        
        Args:
            region_type: Region type (e.g., 'zip', 'county', 'metro', 'state')
            region_id: Region ID
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            DataFrame with ZHVI data
        """
        # Set up parameters
        params = {
            'region_type': region_type,
            'region_id': region_id
        }
        
        if start_date:
            params['start_date'] = start_date
        
        if end_date:
            params['end_date'] = end_date
        
        # Fetch data
        data = self.fetch_data('zhvi', params)
        
        # Convert to DataFrame
        df = pd.DataFrame(data['data'])
        
        # Convert date column to datetime
        df['date'] = pd.to_datetime(df['date'])
        
        # Set date as index
        df.set_index('date', inplace=True)
        
        return df


class TrafficLightClient:
    """Client for the Traffic Light System."""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None, cache_enabled: bool = True):
        """
        Initialize the Traffic Light client.
        
        Args:
            base_url: Base URL for the Traffic Light API
            api_key: API key for the Traffic Light API
            cache_enabled: Whether to enable caching
        """
        self.base_url = base_url
        self.api_key = api_key
        self.cache_enabled = cache_enabled
        
        # Create cache directory if it doesn't exist
        if self.cache_enabled and not os.path.exists(CACHE_DIR):
            os.makedirs(CACHE_DIR)
    
    def _get_cache_path(self, endpoint: str, params: Dict[str, Any]) -> str:
        """
        Get the cache path for the given endpoint and parameters.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            
        Returns:
            Cache path
        """
        # Create a unique cache key based on endpoint and parameters
        cache_key = f"{endpoint}_{json.dumps(params, sort_keys=True)}"
        cache_hash = hashlib.md5(cache_key.encode()).hexdigest()
        
        return os.path.join(CACHE_DIR, f"TrafficLight_{cache_hash}.pkl")
    
    def _get_from_cache(self, endpoint: str, params: Dict[str, Any]) -> Optional[Any]:
        """
        Get data from cache.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            
        Returns:
            Cached data or None if not found or expired
        """
        if not self.cache_enabled:
            return None
        
        cache_path = self._get_cache_path(endpoint, params)
        
        if not os.path.exists(cache_path):
            return None
        
        # Check if cache is expired
        if time.time() - os.path.getmtime(cache_path) > CACHE_EXPIRY:
            return None
        
        try:
            with open(cache_path, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            logger.warning(f"Error loading from cache: {e}")
            return None
    
    def _save_to_cache(self, endpoint: str, params: Dict[str, Any], data: Any) -> None:
        """
        Save data to cache.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            data: Data to cache
        """
        if not self.cache_enabled:
            return
        
        cache_path = self._get_cache_path(endpoint, params)
        
        try:
            with open(cache_path, 'wb') as f:
                pickle.dump(data, f)
        except Exception as e:
            logger.warning(f"Error saving to cache: {e}")
    
    def fetch_data(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch data from the Traffic Light API.
        
        Args:
            endpoint: API endpoint
            params: API parameters
            
        Returns:
            API response data
        """
        # Check cache first
        cached_data = self._get_from_cache(endpoint, params)
        if cached_data is not None:
            logger.info(f"Using cached data for {endpoint}")
            return cached_data
        
        # Add API key to headers
        headers = {}
        if self.api_key:
            headers['Authorization'] = f"Bearer {self.api_key}"
        
        # Build URL
        url = f"{self.base_url}/{endpoint}"
        
        try:
            # Make request
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            # Parse response
            data = response.json()
            
            # Save to cache
            self._save_to_cache(endpoint, params, data)
            
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data from Traffic Light API: {e}")
            raise
    
    def get_appreciation_rates(self, zone_ids: List[str], start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, pd.DataFrame]:
        """
        Get appreciation rates from the Traffic Light System.
        
        Args:
            zone_ids: List of zone IDs
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            Dictionary mapping zone IDs to DataFrames with appreciation rates
        """
        # Set up parameters
        params = {
            'zone_ids': ','.join(zone_ids)
        }
        
        if start_date:
            params['start_date'] = start_date
        
        if end_date:
            params['end_date'] = end_date
        
        # Fetch data
        data = self.fetch_data('appreciation_rates', params)
        
        # Convert to DataFrames
        result = {}
        
        for zone_id, zone_data in data.items():
            df = pd.DataFrame(zone_data)
            
            # Convert date column to datetime
            df['date'] = pd.to_datetime(df['date'])
            
            # Set date as index
            df.set_index('date', inplace=True)
            
            result[zone_id] = df
        
        return result
    
    def get_default_rates(self, zone_ids: List[str], start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, pd.DataFrame]:
        """
        Get default rates from the Traffic Light System.
        
        Args:
            zone_ids: List of zone IDs
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            Dictionary mapping zone IDs to DataFrames with default rates
        """
        # Set up parameters
        params = {
            'zone_ids': ','.join(zone_ids)
        }
        
        if start_date:
            params['start_date'] = start_date
        
        if end_date:
            params['end_date'] = end_date
        
        # Fetch data
        data = self.fetch_data('default_rates', params)
        
        # Convert to DataFrames
        result = {}
        
        for zone_id, zone_data in data.items():
            df = pd.DataFrame(zone_data)
            
            # Convert date column to datetime
            df['date'] = pd.to_datetime(df['date'])
            
            # Set date as index
            df.set_index('date', inplace=True)
            
            result[zone_id] = df
        
        return result
    
    def get_zone_metrics(self, zone_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Get zone metrics from the Traffic Light System.
        
        Args:
            zone_ids: List of zone IDs
            
        Returns:
            Dictionary mapping zone IDs to zone metrics
        """
        # Set up parameters
        params = {
            'zone_ids': ','.join(zone_ids)
        }
        
        # Fetch data
        data = self.fetch_data('zone_metrics', params)
        
        return data


class MarketDataManager:
    """Manager for market data from external sources."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the market data manager.
        
        Args:
            config: Configuration for the market data manager
        """
        self.config = config
        
        # Initialize clients
        self.fred_client = None
        self.zillow_client = None
        self.traffic_light_client = None
        
        if 'fred' in config:
            self.fred_client = FredDataClient(
                api_key=config['fred'].get('api_key'),
                cache_enabled=config['fred'].get('cache_enabled', True)
            )
        
        if 'zillow' in config:
            self.zillow_client = ZillowDataClient(
                api_key=config['zillow'].get('api_key'),
                cache_enabled=config['zillow'].get('cache_enabled', True)
            )
        
        if 'traffic_light' in config:
            self.traffic_light_client = TrafficLightClient(
                base_url=config['traffic_light'].get('base_url'),
                api_key=config['traffic_light'].get('api_key'),
                cache_enabled=config['traffic_light'].get('cache_enabled', True)
            )
    
    def get_economic_indicators(self, indicators: List[str], start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, pd.DataFrame]:
        """
        Get economic indicators from FRED.
        
        Args:
            indicators: List of FRED series IDs
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            Dictionary mapping indicator IDs to DataFrames with indicator data
        """
        if not self.fred_client:
            raise ValueError("FRED client not initialized")
        
        result = {}
        
        for indicator in indicators:
            df = self.fred_client.get_series(indicator, start_date, end_date)
            result[indicator] = df
        
        return result
    
    def get_real_estate_indicators(self, region_type: str, region_ids: List[str], start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, pd.DataFrame]:
        """
        Get real estate indicators from Zillow.
        
        Args:
            region_type: Region type (e.g., 'zip', 'county', 'metro', 'state')
            region_ids: List of region IDs
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            Dictionary mapping region IDs to DataFrames with indicator data
        """
        if not self.zillow_client:
            raise ValueError("Zillow client not initialized")
        
        result = {}
        
        for region_id in region_ids:
            df = self.zillow_client.get_zhvi(region_type, region_id, start_date, end_date)
            result[region_id] = df
        
        return result
    
    def get_zone_data(self, zone_ids: List[str], start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        Get zone data from the Traffic Light System.
        
        Args:
            zone_ids: List of zone IDs
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            
        Returns:
            Dictionary mapping zone IDs to zone data
        """
        if not self.traffic_light_client:
            raise ValueError("Traffic Light client not initialized")
        
        # Get appreciation rates
        appreciation_rates = self.traffic_light_client.get_appreciation_rates(zone_ids, start_date, end_date)
        
        # Get default rates
        default_rates = self.traffic_light_client.get_default_rates(zone_ids, start_date, end_date)
        
        # Get zone metrics
        zone_metrics = self.traffic_light_client.get_zone_metrics(zone_ids)
        
        # Combine data
        result = {}
        
        for zone_id in zone_ids:
            result[zone_id] = {
                'appreciation_rates': appreciation_rates.get(zone_id),
                'default_rates': default_rates.get(zone_id),
                'metrics': zone_metrics.get(zone_id)
            }
        
        return result


def generate_market_conditions_from_external_data(
    market_data_manager: MarketDataManager,
    zone_ids: List[str],
    years: int,
    config: Dict[str, Any]
) -> Dict[int, Dict[str, Any]]:
    """
    Generate market conditions from external data.
    
    Args:
        market_data_manager: Market data manager
        zone_ids: List of zone IDs
        years: Number of years to generate
        config: Configuration for market condition generation
        
    Returns:
        Dictionary mapping years to market conditions
    """
    # Get zone data
    zone_data = market_data_manager.get_zone_data(zone_ids)
    
    # Generate market conditions
    market_conditions = {}
    
    for year in range(years + 1):
        market_conditions[year] = {
            'appreciation_rates': {},
            'default_rates': {}
        }
        
        for zone_id in zone_ids:
            # Get zone data
            zone_appreciation_rates = zone_data[zone_id]['appreciation_rates']
            zone_default_rates = zone_data[zone_id]['default_rates']
            zone_metrics = zone_data[zone_id]['metrics']
            
            # Get latest appreciation rate
            if zone_appreciation_rates is not None and not zone_appreciation_rates.empty:
                latest_appreciation_rate = zone_appreciation_rates['rate'].iloc[-1]
            else:
                latest_appreciation_rate = config.get('default_appreciation_rate', 0.03)
            
            # Get latest default rate
            if zone_default_rates is not None and not zone_default_rates.empty:
                latest_default_rate = zone_default_rates['rate'].iloc[-1]
            else:
                latest_default_rate = config.get('default_default_rate', 0.01)
            
            # Apply trend and volatility
            appreciation_trend = config.get('appreciation_trend', 0.0)
            appreciation_volatility = config.get('appreciation_volatility', 0.02)
            default_trend = config.get('default_trend', 0.0)
            default_volatility = config.get('default_volatility', 0.005)
            
            # Generate appreciation rate for this year
            appreciation_rate = latest_appreciation_rate + appreciation_trend * year
            appreciation_rate += np.random.normal(0, appreciation_volatility)
            
            # Generate default rate for this year
            default_rate = latest_default_rate + default_trend * year
            default_rate += np.random.normal(0, default_volatility)
            
            # Ensure rates are within bounds
            appreciation_rate = max(min(appreciation_rate, config.get('max_appreciation_rate', 0.1)), config.get('min_appreciation_rate', -0.05))
            default_rate = max(min(default_rate, config.get('max_default_rate', 0.05)), config.get('min_default_rate', 0.0))
            
            # Add to market conditions
            market_conditions[year]['appreciation_rates'][zone_id] = appreciation_rate
            market_conditions[year]['default_rates'][zone_id] = default_rate
    
    return market_conditions


def analyze_historical_data(
    market_data_manager: MarketDataManager,
    indicators: List[str],
    start_date: str,
    end_date: str
) -> Dict[str, Dict[str, float]]:
    """
    Analyze historical data to extract statistics.
    
    Args:
        market_data_manager: Market data manager
        indicators: List of indicator IDs
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        
    Returns:
        Dictionary mapping indicator IDs to statistics
    """
    # Get economic indicators
    economic_indicators = market_data_manager.get_economic_indicators(indicators, start_date, end_date)
    
    # Calculate statistics
    result = {}
    
    for indicator, df in economic_indicators.items():
        # Calculate statistics
        mean = df['value'].mean()
        std = df['value'].std()
        min_value = df['value'].min()
        max_value = df['value'].max()
        
        # Calculate trend
        if len(df) > 1:
            x = np.arange(len(df))
            y = df['value'].values
            trend, _ = np.polyfit(x, y, 1)
        else:
            trend = 0.0
        
        # Add to result
        result[indicator] = {
            'mean': mean,
            'std': std,
            'min': min_value,
            'max': max_value,
            'trend': trend
        }
    
    return result


def generate_forecast(
    market_data_manager: MarketDataManager,
    indicators: List[str],
    years: int,
    config: Dict[str, Any]
) -> Dict[str, pd.DataFrame]:
    """
    Generate forecast for economic indicators.
    
    Args:
        market_data_manager: Market data manager
        indicators: List of indicator IDs
        years: Number of years to forecast
        config: Configuration for forecast generation
        
    Returns:
        Dictionary mapping indicator IDs to DataFrames with forecast data
    """
    # Get historical data
    start_date = config.get('start_date')
    end_date = config.get('end_date')
    
    economic_indicators = market_data_manager.get_economic_indicators(indicators, start_date, end_date)
    
    # Analyze historical data
    historical_stats = analyze_historical_data(market_data_manager, indicators, start_date, end_date)
    
    # Generate forecast
    result = {}
    
    for indicator, df in economic_indicators.items():
        # Get statistics
        stats = historical_stats[indicator]
        
        # Get latest value
        latest_value = df['value'].iloc[-1]
        
        # Get trend and volatility
        trend = stats['trend']
        volatility = stats['std']
        
        # Apply forecast configuration
        trend_multiplier = config.get('trend_multiplier', 1.0)
        volatility_multiplier = config.get('volatility_multiplier', 1.0)
        
        trend *= trend_multiplier
        volatility *= volatility_multiplier
        
        # Generate forecast
        forecast_values = []
        current_value = latest_value
        
        for year in range(years + 1):
            # Apply trend and volatility
            current_value += trend
            current_value += np.random.normal(0, volatility)
            
            # Ensure value is within bounds
            current_value = max(min(current_value, stats['max'] * 1.5), stats['min'] * 0.5)
            
            # Add to forecast
            forecast_values.append(current_value)
        
        # Create DataFrame
        forecast_df = pd.DataFrame({
            'year': range(years + 1),
            'value': forecast_values
        })
        
        # Set year as index
        forecast_df.set_index('year', inplace=True)
        
        result[indicator] = forecast_df
    
    return result
