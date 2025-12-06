import { useZodiacMode } from "../contexts/ZodiacModeContext";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8000";

/**
 * Get the current zodiac mode from context (for use in React components)
 */
export function useApiMode() {
  const { mode } = useZodiacMode();
  return mode;
}

/**
 * Build a URL with the current zodiac mode parameter
 * @param {string} endpoint - API endpoint (e.g., "/positions")
 * @param {Object} params - Additional query parameters
 * @param {string} mode - Zodiac mode (z13 or tropical)
 * @returns {string} - Complete URL with mode parameter
 */
export function buildApiUrl(endpoint, params = {}, mode = "z13") {
  const url = new URL(endpoint, API_BASE_URL);
  
  // Add mode parameter
  url.searchParams.set("mode", mode);
  
  // Add additional parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        // Handle array parameters (e.g., bodies=Sun&bodies=Moon)
        value.forEach((item) => url.searchParams.append(key, item));
      } else {
        url.searchParams.set(key, value);
      }
    }
  });
  
  return url.toString();
}

/**
 * Make an API request with automatic mode parameter
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options (method, body, etc.)
 * @param {Object} queryParams - Query parameters (mode will be added automatically)
 * @param {string} mode - Zodiac mode (z13 or tropical)
 * @returns {Promise<Response>} - Fetch response
 */
export async function apiRequest(endpoint, options = {}, queryParams = {}, mode = "z13") {
  const url = buildApiUrl(endpoint, queryParams, mode);
  
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  return fetch(url, mergedOptions);
}

