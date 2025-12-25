import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { setGlobalQueryClient } from "../utils/queryClient";

const API_BASE_URL = "/api";

/**
 * Session state enum
 * @typedef {"anonymous" | "authenticated_no_chart" | "authenticated_has_chart"} SessionState
 */

// Create QueryClient factory function (returns a new QueryClient instance)
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute default stale time
        gcTime: 1000 * 60 * 5, // 5 minutes garbage collection (formerly cacheTime)
        retry: (failureCount, error) => {
          // Don't retry on 401 (unauthorized)
          if (error?.status === 401) return false;
          // Retry up to 2 times for other errors
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

// Query keys factory (exported for use in mutations/invalidations)
export const bootstrapQueryKeys = {
  auth: {
    me: ["auth", "me"],
  },
  positions: {
    now: (mode = "both") => ["positions", "now", mode],
  },
  lunar: {
    events: (days = 14, mode = "z13") => ["lunar", "events", days, mode],
  },
  charts: {
    all: (includeArchived = false) => ["charts", "list", includeArchived],
    default: () => ["charts", "default"],
    detail: (chartId) => ["charts", "detail", chartId],
  },
  transits: {
    vibesNow: (chartId, dateStr) => ["transits", "vibes", "now", chartId, dateStr],
  },
  interpretations: {
    categories: () => ["interpretations", "categories"],
    categoryItems: (category) => ["interpretations", "category", category],
    item: (category, item, format) => ["interpretations", "item", category, item, format],
    transitingToNatal: (keys) => {
      // Create stable key from sorted keys (for cache consistency)
      const sortedKeys = [...keys].sort((a, b) => {
        const aStr = `${a.transiting_body}-${a.aspect}-${a.natal_body}`;
        const bStr = `${b.transiting_body}-${b.aspect}-${b.natal_body}`;
        return aStr.localeCompare(bStr);
      });
      const keysHash = sortedKeys.map(k => `${k.transiting_body}-${k.aspect}-${k.natal_body}`).join('|');
      return ["interpretations", "transiting_to_natal", keys.length, keysHash];
    },
  },
};

/**
 * Session Bootstrap Context Provider Component
 * Handles auth state, preloading, and caching
 */
function SessionBootstrapProviderInner({ children }) {
  const [sessionState, setSessionState] = useState("anonymous");
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [firstPaintComplete, setFirstPaintComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Track if we've attempted to set a default chart to prevent duplicate calls
  const hasAttemptedSetDefaultRef = useRef(false);
  
  // Get query client from React Query context
  const queryClient = useQueryClient();

  // We're guaranteed to be on the client at this point (ClientSessionBootstrapInner ensures this)
  useEffect(() => {
    setIsMounted(true);
    // Mark first paint as complete after mount
    requestAnimationFrame(() => {
      setTimeout(() => setFirstPaintComplete(true), 0);
    });
  }, []);


  // ============================================================================
  // A) Public Preload (runs immediately, no auth required)
  // ============================================================================

  const positionsQuery = useQuery({
    queryKey: bootstrapQueryKeys.positions.now("both"),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/positions?mode=both`, {
        credentials: "include",
      });
      if (!response.ok) throw { status: response.status, message: await response.text() };
      return response.json();
    },
    enabled: isMounted, // Only run after mount
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 2, // 2 minutes
  });

  const lunarEventsQuery = useQuery({
    queryKey: bootstrapQueryKeys.lunar.events(5, "z13"),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/lunar_events?days=5&mode=z13`, {
        credentials: "include",
      });
      if (!response.ok) throw { status: response.status, message: await response.text() };
      return response.json();
    },
    enabled: isMounted, // Only run after mount
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  // ============================================================================
  // B) Auth Check (gates private preload)
  // ============================================================================

  const authQuery = useQuery({
    queryKey: bootstrapQueryKeys.auth.me,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        credentials: "include",
      });
      if (response.status === 401) {
        // Clear any cached private data - queryClient is available from useQueryClient hook
        queryClient.removeQueries({ predicate: (query) => {
          const key = query.queryKey[0];
          return key !== "positions" && key !== "lunar";
        }});
        throw { status: 401, message: "Unauthorized" };
      }
      if (!response.ok) throw { status: response.status, message: await response.text() };
      return response.json();
    },
    enabled: isMounted, // Only run after mount
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5,
    retry: false, // Don't retry 401s
  });

  // Helper function to clear private cache
  const clearPrivateCache = useCallback(() => {
    queryClient.removeQueries({ 
      predicate: (query) => {
        const key = query.queryKey[0];
        return key !== "positions" && key !== "lunar";
      }
    });
  }, []);

  // Update session state based on auth query
  useEffect(() => {
    if (authQuery.isPending) {
      setHasCheckedAuth(false);
      return;
    }

    setHasCheckedAuth(true);

    if (authQuery.isError && authQuery.error?.status === 401) {
      // 401: Not authenticated
      setSessionState("anonymous");
      clearPrivateCache();
      // Don't redirect on initial auth check - let user browse public pages
      // Redirect will happen if they try to access protected routes
    } else if (authQuery.isSuccess) {
      // Authenticated - check if we have a default chart
      const user = authQuery.data;
      if (user?.default_natal_data_id) {
        setSessionState("authenticated_has_chart");
      } else {
        setSessionState("authenticated_no_chart");
      }
    }
  }, [authQuery.isPending, authQuery.isSuccess, authQuery.isError, authQuery.data, authQuery.error, clearPrivateCache]);

  // ============================================================================
  // C) Private Preload (only when authenticated and has default chart)
  // ============================================================================

  const user = authQuery.data;
  const hasDefaultChartId = user?.default_natal_data_id;

  // Debug logging for default chart query enabled state
  useEffect(() => {
    if (isMounted) {
      console.log('[SessionBootstrap] Default chart query state:', {
        isMounted,
        sessionState,
        hasDefaultChartId,
        enabled: isMounted && sessionState === "authenticated_has_chart" && !!hasDefaultChartId
      });
    }
  }, [isMounted, sessionState, hasDefaultChartId]);

  // Get default chart
  const defaultChartQuery = useQuery({
    queryKey: bootstrapQueryKeys.charts.default(),
    queryFn: async () => {
      console.log('[SessionBootstrap] Fetching default chart...');
      const response = await fetch(`${API_BASE_URL}/charts/default`, {
        credentials: "include",
      });
      
      console.log('[SessionBootstrap] Default chart response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.status === 401) {
        throw { status: 401, message: "Unauthorized" };
      }
      if (!response.ok) {
        const errorText = await response.text();
        let errorDetail;
        try {
          errorDetail = JSON.parse(errorText);
        } catch {
          errorDetail = { detail: errorText };
        }
        const errorMessage = errorDetail.detail || errorDetail.error || errorDetail.message || errorText;
        console.error('[SessionBootstrap] Default chart fetch error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          errorDetail: errorDetail,
          errorMessage: errorMessage
        });
        throw { 
          status: response.status, 
          message: errorMessage,
          detail: errorDetail
        };
      }
      const data = await response.json();
      console.log('[SessionBootstrap] Default chart fetched successfully');
      return data;
    },
    enabled: isMounted && sessionState === "authenticated_has_chart" && !!hasDefaultChartId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: false, // Don't retry on errors (especially 422 validation errors)
  });

  // Get vibes for default chart
  const defaultChart = defaultChartQuery.data?.chart;
  const defaultChartId = defaultChart?.meta?.id;
  const natalLongitudes = defaultChart?.computed?.positions?.reduce((acc, pos) => {
    if ((pos.kind === "body" || pos.kind === "point") && pos.lon_deg !== undefined && pos.lon_deg !== null) {
      acc[pos.key] = pos.lon_deg;
    }
    return acc;
  }, {});
  
  const hasNatalLongitudes = natalLongitudes && Object.keys(natalLongitudes).length > 0;

  const vibesQuery = useQuery({
    queryKey: bootstrapQueryKeys.transits.vibesNow(
      defaultChartId || null, 
      new Date().toISOString().split('T')[0] // Use date as stable identifier (vibes change daily)
    ),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/transits/vibes/now`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          natal_longitudes: natalLongitudes,
          orb_deg: 2.0,
          max_hits: 100,
        }),
      });
      if (response.status === 401) {
        throw { status: 401, message: "Unauthorized" };
      }
      if (!response.ok) throw { status: response.status, message: await response.text() };
      return response.json();
    },
    enabled: isMounted && sessionState === "authenticated_has_chart" && !!defaultChartId && hasNatalLongitudes && defaultChartQuery.isSuccess,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Preload interpretations for top N aspect keys (12-20, using 15 as default)
  const vibesData = vibesQuery.data;
  const TOP_ASPECTS_COUNT = 15;
  const topAspectKeys = vibesData?.aspects_found?.slice(0, TOP_ASPECTS_COUNT)?.map((aspect) => ({
    transiting_body: aspect.transiting_body,
    aspect: aspect.aspect,
    natal_body: aspect.natal_body,
  })) || [];

  const interpretationsQuery = useQuery({
    queryKey: bootstrapQueryKeys.interpretations.transitingToNatal(topAspectKeys),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/interpretations/transiting_to_natal`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: topAspectKeys,
          layer: "both",
          max_items: TOP_ASPECTS_COUNT,
        }),
      });
      if (!response.ok) throw { status: response.status, message: await response.text() };
      return response.json();
    },
    enabled: isMounted && sessionState === "authenticated_has_chart" && topAspectKeys.length > 0 && vibesQuery.isSuccess,
    staleTime: Infinity, // Cache for whole session
    gcTime: Infinity,
  });

  // ============================================================================
  // D) Deferred Chart List (after first paint, if authenticated)
  // ============================================================================

  const chartsListQuery = useQuery({
    queryKey: bootstrapQueryKeys.charts.all(false),
    queryFn: async () => {
              const response = await fetch(`${API_BASE_URL}/charts/list?include_archived=false`, {
        credentials: "include",
      });
      if (response.status === 401) {
        throw { status: 401, message: "Unauthorized" };
      }
      if (!response.ok) throw { status: response.status, message: await response.text() };
      return response.json();
    },
    enabled: isMounted && firstPaintComplete && (sessionState === "authenticated_has_chart" || sessionState === "authenticated_no_chart"),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Auto-set default chart if user has charts but no default_natal_data_id
  useEffect(() => {
    // Only run if:
    // - We're authenticated
    // - User has no default_natal_data_id
    // - Charts list has loaded successfully
    // - Charts list has at least one chart
    // - We haven't already attempted to set a default
    if (
      !isMounted ||
      sessionState !== "authenticated_no_chart" ||
      !chartsListQuery.isSuccess ||
      !chartsListQuery.data?.charts ||
      chartsListQuery.data.charts.length === 0 ||
      hasAttemptedSetDefaultRef.current ||
      user?.default_natal_data_id // Double-check user still has no default
    ) {
      return;
    }

    // Find the most recently updated chart (sort by updated_at descending)
    const charts = chartsListQuery.data.charts;
    const sortedCharts = [...charts].sort((a, b) => {
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return dateB - dateA; // Descending order (most recent first)
    });

    const mostRecentChart = sortedCharts[0];
    if (!mostRecentChart?.id) {
      console.warn("SessionBootstrap: No valid chart found to set as default");
      return;
    }

    // Mark that we're attempting to set a default
    hasAttemptedSetDefaultRef.current = true;

    // Call PATCH /charts/{chart_id} with set_as_default=true to set the default chart
    fetch(`${API_BASE_URL}/charts/${mostRecentChart.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        set_as_default: true,
      }),
    })
      .then(async (response) => {
        if (response.status === 401) {
          throw { status: 401, message: "Unauthorized" };
        }
        if (!response.ok) {
          const errorText = await response.text();
          throw { status: response.status, message: errorText };
        }
        return response.json();
      })
      .then((updatedChart) => {
        console.log("SessionBootstrap: Successfully set default chart:", mostRecentChart.id);
        // Invalidate auth query to refetch user data (which will now have default_natal_data_id set)
        queryClient.invalidateQueries({ queryKey: bootstrapQueryKeys.auth.me });
        // Also invalidate charts list and default chart queries
        queryClient.invalidateQueries({ queryKey: bootstrapQueryKeys.charts.all(false) });
        queryClient.invalidateQueries({ queryKey: bootstrapQueryKeys.charts.default() });
      })
      .catch((error) => {
        console.error("SessionBootstrap: Error setting default chart:", error);
        // Reset the ref so we can try again if needed
        hasAttemptedSetDefaultRef.current = false;
      });
  }, [
    isMounted,
    sessionState,
    chartsListQuery.isSuccess,
    chartsListQuery.data,
    user?.default_natal_data_id,
    queryClient,
  ]);

  // Helper to check if current route is private (requires authentication)
  const isPrivateRoute = useCallback(() => {
    if (typeof window === "undefined") return false;
    const pathname = window.location.pathname;
    
    // Public routes (no redirect on 401)
    const publicRoutes = [
      "/",
      "/auth/",
      "/positions",
      "/lunar",
      "/about-z13",
      "/the-z13-story",
    ];
    
    // Check if pathname matches any public route
    const isPublic = publicRoutes.some(route => {
      if (route.endsWith("/")) {
        return pathname.startsWith(route);
      }
      return pathname === route || pathname.startsWith(route + "/");
    });
    
    return !isPublic;
  }, []);

  // Handle 401 errors from private queries (only redirect if on protected route)
  useEffect(() => {
    const handle401Error = (queryError) => {
      if (queryError?.status === 401) {
        clearPrivateCache();
        setSessionState("anonymous");
        // Only redirect if on a private route to prevent redirect loops
        if (isPrivateRoute()) {
          console.log("SessionBootstrap: 401 on private route, redirecting to login");
          window.location.href = "/auth/login";
        } else {
          console.log("SessionBootstrap: 401 on public route, not redirecting");
        }
      }
    };

    if (defaultChartQuery.isError) {
      handle401Error(defaultChartQuery.error);
    }
    if (vibesQuery.isError) {
      handle401Error(vibesQuery.error);
    }
    if (chartsListQuery.isError) {
      handle401Error(chartsListQuery.error);
    }
  }, [
    defaultChartQuery.isError, 
    defaultChartQuery.error, 
    vibesQuery.isError, 
    vibesQuery.error, 
    chartsListQuery.isError, 
    chartsListQuery.error,
    clearPrivateCache,
    isPrivateRoute
  ]);

  // Provide context value
  const value = {
    // Session state
    sessionState,
    hasCheckedAuth,
    user: authQuery.data || null,

    // Public data
    positions: positionsQuery.data || null,
    positionsLoading: positionsQuery.isLoading,
    positionsError: positionsQuery.error,

    lunarEvents: lunarEventsQuery.data || null,
    lunarEventsLoading: lunarEventsQuery.isLoading,
    lunarEventsError: lunarEventsQuery.error,

    // Private data (only available when authenticated)
    defaultChart: defaultChartQuery.data?.chart || null,
    defaultChartLoading: defaultChartQuery.isLoading,
    defaultChartError: defaultChartQuery.error,

    vibesNow: vibesQuery.data || null,
    vibesNowLoading: vibesQuery.isLoading,
    vibesNowError: vibesQuery.error,

    interpretations: interpretationsQuery.data || null,
    interpretationsLoading: interpretationsQuery.isLoading,

    chartsList: chartsListQuery.data?.charts || null,
    chartsListLoading: chartsListQuery.isLoading,
    chartsListError: chartsListQuery.error,

    // Query client for mutations/invalidations
    queryClient,

    // Refetch functions
    refetchPositions: positionsQuery.refetch,
    refetchLunarEvents: lunarEventsQuery.refetch,
    refetchAuth: authQuery.refetch,
    refetchDefaultChart: defaultChartQuery.refetch,
    refetchVibes: vibesQuery.refetch,
    refetchChartsList: chartsListQuery.refetch,
  };

  return (
    <SessionBootstrapContext.Provider value={value}>
      {children}
    </SessionBootstrapContext.Provider>
  );
}

// Create context
export const SessionBootstrapContext = createContext(null);



/**
 * Session Bootstrap Provider (wraps QueryClientProvider)
 * Uses useState lazy initializer to create QueryClient only on client
 */
export function SessionBootstrapProvider({ children }) {
  // Use lazy initializer - only runs on client, only once
  const [queryClient] = useState(() => {
    // Only create QueryClient on client
    if (typeof window === "undefined") {
      return null;
    }
    return makeQueryClient();
  });

  // During SSR or if queryClient is null, provide default context
  if (!queryClient) {
    return (
      <SessionBootstrapContext.Provider value={{
        sessionState: "anonymous",
        hasCheckedAuth: false,
        user: null,
        positions: null,
        positionsLoading: false,
        positionsError: null,
        lunarEvents: null,
        lunarEventsLoading: false,
        lunarEventsError: null,
        defaultChart: null,
        defaultChartLoading: false,
        defaultChartError: null,
        vibesNow: null,
        vibesNowLoading: false,
        vibesNowError: null,
        interpretations: null,
        interpretationsLoading: false,
        chartsList: null,
        chartsListLoading: false,
        chartsListError: null,
        queryClient: null,
        refetchPositions: () => Promise.resolve({}),
        refetchLunarEvents: () => Promise.resolve({}),
        refetchAuth: () => Promise.resolve({}),
        refetchDefaultChart: () => Promise.resolve({}),
        refetchVibes: () => Promise.resolve({}),
        refetchChartsList: () => Promise.resolve({}),
      }}>
        {children}
      </SessionBootstrapContext.Provider>
    );
  }
  
  // Set global QueryClient for access by React islands
  useEffect(() => {
    if (queryClient) {
      setGlobalQueryClient(queryClient);
    }
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrapProviderInner>{children}</SessionBootstrapProviderInner>
    </QueryClientProvider>
  );
}

/**
 * Hook to access session bootstrap context
 */
export function useSessionBootstrap() {
  const context = useContext(SessionBootstrapContext);
  if (!context) {
    throw new Error("useSessionBootstrap must be used within SessionBootstrapProvider");
  }
  return context;
}

/**
 * Hook to access query client directly
 */
export function useBootstrapQueryClient() {
  return useQueryClient();
}

