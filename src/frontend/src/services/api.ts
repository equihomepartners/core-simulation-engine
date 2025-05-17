import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create axios instance with configured baseURL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
  withCredentials: false,
});

/**
 * Get simulation results by ID
 * @param simulationId The ID of the simulation to fetch results for
 * @returns The simulation results data
 */
export const getSimulationResults = async (simulationId: string) => {
  try {
    // Ensure there's no leading slash if API_BASE_URL already ends with a slash
    const endpoint = API_BASE_URL.endsWith('/')
      ? `api/simulations/${simulationId}/results`
      : `/api/simulations/${simulationId}/results`;
    
    console.log(`Fetching results from: ${API_BASE_URL}${endpoint}`);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching simulation results:', error);
    throw error;
  }
};

/**
 * Get simulation status by ID
 * @param simulationId The ID of the simulation to check status for
 * @returns The simulation status data
 */
export const getSimulationStatus = async (simulationId: string) => {
  try {
    // Ensure there's no leading slash if API_BASE_URL already ends with a slash
    const endpoint = API_BASE_URL.endsWith('/')
      ? `api/simulations/${simulationId}/status`
      : `/api/simulations/${simulationId}/status`;
    
    console.log(`Fetching status from: ${API_BASE_URL}${endpoint}`);
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching simulation status:', error);
    throw error;
  }
};

/**
 * Get visualization data for a simulation
 * @param simulationId The ID of the simulation
 * @param chartType The type of chart to get data for
 * @param format The format of the data
 * @param options Additional options for the visualization
 * @returns The visualization data
 */
export const getVisualizationData = async (
  simulationId: string,
  chartType?: string,
  format?: string,
  options?: Record<string, any>
) => {
  try {
    const params = {
      chart_type: chartType,
      format,
      ...options,
    };

    // Ensure there's no leading slash if API_BASE_URL already ends with a slash
    const endpoint = API_BASE_URL.endsWith('/')
      ? `api/simulations/${simulationId}/visualization`
      : `/api/simulations/${simulationId}/visualization`;
    
    console.log(`Fetching visualization data from: ${API_BASE_URL}${endpoint}`, params);
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching visualization data:', error);
    throw error;
  }
};

// Export default API instance
export default api; 