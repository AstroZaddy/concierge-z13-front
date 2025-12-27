import { useState, useEffect, useRef } from "react";
import { getCachedQueryData, getCachedQueryState, subscribeToQueryData } from "../utils/queryClient";
import { useMounted } from "./useMounted";

/**
 * Hook to subscribe to cached query data and optionally fetch if not cached
 * @param {Array} queryKey - The query key array
 * @param {Function|null} fetchFn - Optional function to fetch data if not in cache
 * @param {Object} options - Options object
 * @param {boolean} options.enabled - Whether to enable the query (default: true)
 * @returns {{data: any, loading: boolean, error: any}} Query state
 */
export function useCachedQuery(queryKey, fetchFn = null, options = {}) {
  const { enabled = true } = options;
  const mounted = useMounted();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);
  
  const cachedData = getCachedQueryData(queryKey);
  const cachedState = getCachedQueryState(queryKey);
  
  useEffect(() => {
    if (!mounted || !enabled) return;
    
    // Subscribe to cache updates
    const unsubscribe = subscribeToQueryData(queryKey, (newData) => {
      if (newData !== undefined && newData !== null) {
        setData(newData);
        setLoading(false);
        setError(null);
      }
    });
    
    // If we have cached data, use it immediately
    if (cachedData !== undefined && cachedData !== null) {
      setData(cachedData);
      setLoading(cachedState?.isLoading || false);
      setError(cachedState?.error || null);
    } else if (!hasFetchedRef.current && fetchFn) {
      // Only fetch if not in cache and we haven't fetched yet
      hasFetchedRef.current = true;
      setLoading(true);
      setError(null);
      
      fetchFn()
        .then((result) => {
          setData(result);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch data");
          setLoading(false);
          hasFetchedRef.current = false; // Allow retry
        });
    } else if (!fetchFn) {
      // No fetch function and no cached data - not loading
      setLoading(false);
    }
    
    return unsubscribe;
  }, [mounted, queryKey, cachedData, cachedState, enabled, fetchFn]);
  
  return { data, loading, error };
}

