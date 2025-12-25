/**
 * Global QueryClient access for React islands
 * 
 * React islands (components with client:load) cannot access React Context,
 * but they can access a globally stored QueryClient instance to read cached data.
 */

import { QueryClient } from "@tanstack/react-query";

// Global QueryClient instance (set by SessionBootstrapProvider)
let globalQueryClient = null;

/**
 * Set the global QueryClient instance
 * Called by SessionBootstrapProvider when it initializes
 */
export function setGlobalQueryClient(queryClient) {
  globalQueryClient = queryClient;
  // Also store on window for debugging
  if (typeof window !== "undefined") {
    window.__z13QueryClient = queryClient;
  }
}

/**
 * Get the global QueryClient instance
 * Returns null if not yet initialized
 */
export function getGlobalQueryClient() {
  return globalQueryClient;
}

/**
 * Get cached query data by key
 * @param {Array} queryKey - The query key array
 * @returns {any|null} - The cached data or null if not found
 */
export function getCachedQueryData(queryKey) {
  if (!globalQueryClient) {
    return null;
  }
  return globalQueryClient.getQueryData(queryKey);
}

/**
 * Get cached query state (includes isLoading, error, etc.)
 * @param {Array} queryKey - The query key array
 * @returns {object|null} - The query state or null if not found
 */
export function getCachedQueryState(queryKey) {
  if (!globalQueryClient) {
    return null;
  }
  const query = globalQueryClient.getQueryState(queryKey);
  return query ? {
    data: query.data,
    isLoading: query.status === "pending",
    isError: query.status === "error",
    error: query.error,
    isSuccess: query.status === "success",
    isFetching: query.isFetching,
  } : null;
}

/**
 * Check if a query is currently loading
 * @param {Array} queryKey - The query key array
 * @returns {boolean}
 */
export function isQueryLoading(queryKey) {
  if (!globalQueryClient) {
    return false;
  }
  const state = globalQueryClient.getQueryState(queryKey);
  return state?.status === "pending" || state?.isFetching === true;
}

/**
 * Subscribe to query data changes
 * @param {Array} queryKey - The query key array
 * @param {Function} callback - Callback function called when data changes
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToQueryData(queryKey, callback) {
  if (!globalQueryClient) {
    return () => {};
  }
  
  // Get initial data
  const initialData = globalQueryClient.getQueryData(queryKey);
  if (initialData !== undefined) {
    callback(initialData);
  }
  
  // Subscribe to changes
  return globalQueryClient.getQueryCache().subscribe((event) => {
    if (event?.query?.queryKey && JSON.stringify(event.query.queryKey) === JSON.stringify(queryKey)) {
      if (event.type === "updated" || event.type === "added") {
        callback(event.query.state.data);
      }
    }
  });
}

