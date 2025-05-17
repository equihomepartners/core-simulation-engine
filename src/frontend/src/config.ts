/**
 * Global configuration for the application
 */

// API Configuration
// Use empty string to leverage Vite's proxy configuration
export const API_BASE_URL = '';
export const API_TIMEOUT = 30000; // 30 seconds

// Feature Flags
export const FEATURES = {
  MONTE_CARLO_ENABLED: true,
  CUSTOM_GRAPHS_ENABLED: true,
  EXPORT_ENABLED: true,
  WEBSOCKET_ENABLED: false, // Temporarily disabled for debugging
};

// Default Simulation Settings
export const DEFAULT_SIMULATION = {
  TERM_YEARS: 10,
  DEFAULT_HURDLE_RATE: 0.08,
  DEFAULT_CARRY: 0.20,
  DEFAULT_MGMT_FEE: 0.02,
  DEFAULT_GP_COMMIT: 0.0,
};

// Cache Settings
export const CACHE_SETTINGS = {
  ENABLED: true,
  TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
  MAX_ITEMS: 50,
};