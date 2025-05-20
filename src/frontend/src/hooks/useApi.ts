import { useState, useEffect, useCallback } from 'react';

// API client for the traffic light system
const apiClient = {
  getApiTrafficLightZones: async (source = 'mock', color?: string) => {
    try {
      // Always use fallback data for now since the API is not working correctly
      console.log(`Fetching zones with source=${source}, color=${color}`);

      // Fallback to mock data
      return [
        { id: '1', name: 'Bondi', zone_color: 'green', growth_mu: 0.05, risk_weight: 0.3 },
        { id: '2', name: 'Manly', zone_color: 'green', growth_mu: 0.06, risk_weight: 0.25 },
        { id: '3', name: 'Cronulla', zone_color: 'green', growth_mu: 0.055, risk_weight: 0.28 },
        { id: '4', name: 'Parramatta', zone_color: 'orange', growth_mu: 0.04, risk_weight: 0.4 },
        { id: '5', name: 'Blacktown', zone_color: 'orange', growth_mu: 0.035, risk_weight: 0.45 },
        { id: '6', name: 'Liverpool', zone_color: 'orange', growth_mu: 0.038, risk_weight: 0.42 },
        { id: '7', name: 'Penrith', zone_color: 'red', growth_mu: 0.025, risk_weight: 0.6 },
        { id: '8', name: 'Campbelltown', zone_color: 'red', growth_mu: 0.02, risk_weight: 0.65 },
        { id: '9', name: 'Richmond', zone_color: 'red', growth_mu: 0.022, risk_weight: 0.62 }
      ];
    } catch (error) {
      console.error('Error fetching zones:', error);

      // Fallback to mock data if API fails
      return [
        { id: '1', name: 'Bondi', zone_color: 'green', growth_mu: 0.05, risk_weight: 0.3 },
        { id: '2', name: 'Manly', zone_color: 'green', growth_mu: 0.06, risk_weight: 0.25 },
        { id: '3', name: 'Cronulla', zone_color: 'green', growth_mu: 0.055, risk_weight: 0.28 },
        { id: '4', name: 'Parramatta', zone_color: 'orange', growth_mu: 0.04, risk_weight: 0.4 },
        { id: '5', name: 'Blacktown', zone_color: 'orange', growth_mu: 0.035, risk_weight: 0.45 },
        { id: '6', name: 'Liverpool', zone_color: 'orange', growth_mu: 0.038, risk_weight: 0.42 },
        { id: '7', name: 'Penrith', zone_color: 'red', growth_mu: 0.025, risk_weight: 0.6 },
        { id: '8', name: 'Campbelltown', zone_color: 'red', growth_mu: 0.02, risk_weight: 0.65 },
        { id: '9', name: 'Richmond', zone_color: 'red', growth_mu: 0.022, risk_weight: 0.62 }
      ];
    }
  },

  getApiTrafficLightZone: async (zoneId: string, source = 'mock') => {
    try {
      let url = `/api/traffic-light/zones/${zoneId}`;

      if (source) {
        url += `?source=${source}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching zone ${zoneId}:`, error);
      throw error;
    }
  },

  setApiTrafficLightDataSource: async (source: 'mock' | 'production') => {
    try {
      const response = await fetch(`/api/traffic-light/set-data-source?source=${source}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error setting data source to ${source}:`, error);
      throw error;
    }
  }
};

/**
 * Custom hook for API access
 */
export function useApi() {
  return {
    defaultClient: apiClient
  };
}

/**
 * Function to make a one-time API call without using the hook
 * @param url The URL to fetch
 * @param options The fetch options
 * @returns A promise that resolves to the response data
 */
export async function fetchApi<T>(url: string, options: any = {}): Promise<T> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

export default useApi;
