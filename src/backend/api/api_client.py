"""
API client for testing the simulation API.

This module provides a simple API client for testing the simulation API endpoints.
"""

import requests
import json
import logging
import argparse
import time
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class SimulationAPIClient:
    """Client for the simulation API."""
    
    def __init__(self, base_url="http://localhost:8000", username="admin", password="admin"):
        """Initialize the client.
        
        Args:
            base_url: Base URL of the API server
            username: Username for authentication
            password: Password for authentication
        """
        self.base_url = base_url
        self.username = username
        self.password = password
        self.token = None
        self.headers = {}
        
        # Authenticate
        self.authenticate()
    
    def authenticate(self):
        """Authenticate with the API server."""
        url = f"{self.base_url}/token"
        data = {"username": self.username, "password": self.password}
        
        try:
            response = requests.post(url, data=data)
            response.raise_for_status()
            
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            
            logger.info("Authentication successful")
        except requests.exceptions.RequestException as e:
            logger.error(f"Authentication failed: {str(e)}")
            raise
    
    def create_simulation(self, config):
        """Create a new simulation.
        
        Args:
            config: Configuration for the simulation
        
        Returns:
            dict: Response from the API
        """
        url = f"{self.base_url}/api/simulations/"
        
        try:
            response = requests.post(url, json=config, headers=self.headers)
            response.raise_for_status()
            
            simulation_id = response.json()["simulation_id"]
            logger.info(f"Simulation created with ID {simulation_id}")
            
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create simulation: {str(e)}")
            raise
    
    def get_simulation_status(self, simulation_id):
        """Get the status of a simulation.
        
        Args:
            simulation_id: ID of the simulation
        
        Returns:
            dict: Response from the API
        """
        url = f"{self.base_url}/api/simulations/{simulation_id}/status"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            status = response.json()["status"]
            progress = response.json()["progress"]
            
            # Format progress bar
            progress_bar = "=" * int(progress * 20)
            progress_bar = progress_bar + ">" if progress < 1.0 else progress_bar
            progress_bar = progress_bar.ljust(20)
            
            logger.info(f"Simulation {simulation_id} status: {status} [{progress_bar}] {progress:.1%}")
            
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get simulation status: {str(e)}")
            raise
    
    def get_simulation_results(self, simulation_id):
        """Get the results of a simulation.
        
        Args:
            simulation_id: ID of the simulation
        
        Returns:
            dict: Response from the API
        """
        url = f"{self.base_url}/api/simulations/{simulation_id}/results"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            logger.info(f"Retrieved results for simulation {simulation_id}")
            
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get simulation results: {str(e)}")
            raise
    
    def list_simulations(self, status=None, limit=10, offset=0):
        """List simulations.
        
        Args:
            status: Filter by status (created, running, completed, or failed)
            limit: Maximum number of simulations to return
            offset: Offset for pagination
        
        Returns:
            dict: Response from the API
        """
        url = f"{self.base_url}/api/simulations/"
        params = {}
        
        if status:
            params["status"] = status
        
        params["limit"] = limit
        params["offset"] = offset
        
        try:
            response = requests.get(url, params=params, headers=self.headers)
            response.raise_for_status()
            
            simulations = response.json()["simulations"]
            total = response.json()["total"]
            
            logger.info(f"Listed {len(simulations)} simulations (total: {total})")
            
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to list simulations: {str(e)}")
            raise
    
    def delete_simulation(self, simulation_id):
        """Delete a simulation.
        
        Args:
            simulation_id: ID of the simulation
        
        Returns:
            dict: Response from the API
        """
        url = f"{self.base_url}/api/simulations/{simulation_id}"
        
        try:
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            
            logger.info(f"Simulation {simulation_id} deleted")
            
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to delete simulation: {str(e)}")
            raise
    
    def wait_for_simulation(self, simulation_id, poll_interval=1, timeout=300):
        """Wait for a simulation to complete.
        
        Args:
            simulation_id: ID of the simulation
            poll_interval: Interval between status checks in seconds
            timeout: Maximum time to wait in seconds
        
        Returns:
            dict: Final status of the simulation
        """
        start_time = time.time()
        
        while True:
            # Check if timeout has been reached
            if time.time() - start_time > timeout:
                logger.error(f"Timeout waiting for simulation {simulation_id} to complete")
                raise TimeoutError(f"Timeout waiting for simulation {simulation_id} to complete")
            
            # Get simulation status
            status = self.get_simulation_status(simulation_id)
            
            # Check if simulation has completed or failed
            if status["status"] in ["completed", "failed"]:
                logger.info(f"Simulation {simulation_id} {status['status']}")
                return status
            
            # Wait before checking again
            time.sleep(poll_interval)

def main():
    """Main function."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="API client for simulation API")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Base URL of the API server")
    parser.add_argument("--username", default="admin", help="Username for authentication")
    parser.add_argument("--password", default="admin", help="Password for authentication")
    parser.add_argument("--config", default="config.json", help="Path to configuration file")
    args = parser.parse_args()
    
    # Load configuration
    try:
        with open(args.config, "r") as f:
            config = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load configuration: {str(e)}")
        config = {
            "fund_size": 100000000,
            "fund_term": 10,
            "gp_commitment_percentage": 0.05,
            "hurdle_rate": 0.08,
            "carried_interest_rate": 0.20,
            "waterfall_structure": "european",
            "monte_carlo_enabled": False,
            "optimization_enabled": False,
            "stress_testing_enabled": False,
            "external_data_enabled": False,
            "generate_reports": True
        }
        logger.info("Using default configuration")
    
    # Create client
    client = SimulationAPIClient(args.base_url, args.username, args.password)
    
    # Create simulation
    simulation = client.create_simulation(config)
    simulation_id = simulation["simulation_id"]
    
    # Wait for simulation to complete
    try:
        client.wait_for_simulation(simulation_id)
        
        # Get simulation results
        results = client.get_simulation_results(simulation_id)
        
        # Print summary of results
        logger.info("Simulation results:")
        if "performance_metrics" in results:
            metrics = results["performance_metrics"]
            logger.info(f"IRR: {metrics.get('irr', 0) * 100:.2f}%")
            logger.info(f"MOIC: {metrics.get('moic', 0):.2f}x")
            logger.info(f"TVPI: {metrics.get('tvpi', 0):.2f}x")
            logger.info(f"Payback Period: {metrics.get('payback_period', 0):.2f} years")
        else:
            logger.info("No performance metrics available")
    except Exception as e:
        logger.error(f"Error waiting for simulation: {str(e)}")

if __name__ == "__main__":
    main()
