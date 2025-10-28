// API Configuration utility
export const getApiBaseUrl = () => {
  // Use environment variable if available, otherwise fallback to localhost
  return import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5001`;
};

// Helper function to create API URLs
export const createApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Helper function to create headers with auth token
export const createAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});
