import { OpenAPI } from './generated';

// Configure the generated API client globally
// Default to port 5005 for the backend API
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5005';
// Make sure we're using the correct base URL
console.info('Using API base URL:', API_BASE);
OpenAPI.BASE = API_BASE;

// Optional: Provide auth token automatically
OpenAPI.TOKEN = localStorage.getItem('auth_token') || undefined;

// Request / response hooks for logging or additional headers
OpenAPI.WITH_CREDENTIALS = false;

// Add request interceptor for logging and debugging
OpenAPI.HEADERS = async () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
  };
};

// Add response interceptor for error handling
OpenAPI.MIDDLEWARE = async (response) => {
  // Log all API calls in development
  if (process.env.NODE_ENV !== 'production') {
    console.debug(`API ${response.status} ${response.url}`);
  }

  // Handle specific error cases
  if (!response.ok) {
    // Log detailed error information
    console.error(`API Error ${response.status}: ${response.url}`);

    // Handle specific status codes
    if (response.status === 404) {
      console.error('API endpoint not found. Check if the backend server is running on the correct port.');
    } else if (response.status === 0 || response.status === 502 || response.status === 503 || response.status === 504) {
      console.error('Backend server is not responding. Check if it is running on port 5005.');
    }

    // Try to parse error response
    try {
      const errorData = await response.json();
      console.error('Error details:', errorData);
    } catch (e) {
      // If we can't parse JSON, just log the text
      try {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      } catch (e2) {
        console.error('Could not read error response');
      }
    }
  }

  return response;
};

// Check if the API is available
const checkApiAvailability = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (response.ok) {
      console.info('Backend API is available');
      return true;
    } else {
      console.warn(`Backend API returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Backend API is not available:', error);
    return false;
  }
};

// Check API availability on startup
checkApiAvailability().then(isAvailable => {
  if (!isAvailable && process.env.NODE_ENV !== 'production') {
    console.warn(`
      ⚠️ Backend API is not available at ${API_BASE}
      Make sure the backend server is running on port 5005.
      The application will use mock data for development.
    `);
  }
});