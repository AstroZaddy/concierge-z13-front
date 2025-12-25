import { useEffect, useState } from "react";
import { getCachedQueryData, getCachedQueryState, subscribeToQueryData } from "../../utils/queryClient";
import { bootstrapQueryKeys } from "../../contexts/SessionBootstrapContext";

export function DiagnosticsPageContent() {
  const [mounted, setMounted] = useState(false);
  
  // Get data from cached queries (since this is a React island, we can't use context)
  const authQueryKey = bootstrapQueryKeys.auth.me;
  const positionsQueryKey = bootstrapQueryKeys.positions.now("both");
  const lunarEventsQueryKey = bootstrapQueryKeys.lunar.events(5, "z13");
  const defaultChartQueryKey = bootstrapQueryKeys.charts.default();
  const chartsListQueryKey = bootstrapQueryKeys.charts.all(false);
  
  // State for cached data
  const [authData, setAuthData] = useState(getCachedQueryData(authQueryKey));
  const [positionsData, setPositionsData] = useState(getCachedQueryData(positionsQueryKey));
  const [lunarEventsData, setLunarEventsData] = useState(getCachedQueryData(lunarEventsQueryKey));
  const [defaultChartData, setDefaultChartData] = useState(getCachedQueryData(defaultChartQueryKey));
  const [chartsListData, setChartsListData] = useState(getCachedQueryData(chartsListQueryKey));
  
  // Get query states (these are computed, not state)
  const authState = getCachedQueryState(authQueryKey);
  const positionsState = getCachedQueryState(positionsQueryKey);
  const lunarEventsState = getCachedQueryState(lunarEventsQueryKey);
  const defaultChartState = getCachedQueryState(defaultChartQueryKey);
  const chartsListState = getCachedQueryState(chartsListQueryKey);
  
  // Determine session state from auth data
  const sessionState = authData ? (authData.default_natal_data_id ? "authenticated_has_chart" : "authenticated_no_chart") : "anonymous";
  const hasCheckedAuth = authState !== null; // If we have state, auth has been checked
  
  // Get vibes data - need to construct query key with chartId and date
  const chartId = authData?.default_natal_data_id || null;
  const vibesQueryKey = chartId ? bootstrapQueryKeys.transits.vibesNow(chartId, new Date().toISOString().split('T')[0]) : null;
  const [vibesData, setVibesData] = useState(() => vibesQueryKey ? getCachedQueryData(vibesQueryKey) : null);
  
  // Get interpretations - need top aspect keys from vibes
  const topAspectKeys = vibesData?.aspects_found?.slice(0, 15)?.map((aspect) => ({
    transiting_body: aspect.transiting_body,
    aspect: aspect.aspect,
    natal_body: aspect.natal_body,
  })) || [];
  const interpretationsQueryKey = topAspectKeys.length > 0 ? bootstrapQueryKeys.interpretations.transitingToNatal(topAspectKeys) : null;
  const [interpretationsData, setInterpretationsData] = useState(() => interpretationsQueryKey ? getCachedQueryData(interpretationsQueryKey) : null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Subscribe to query data updates
  useEffect(() => {
    if (!mounted) return;

    const unsubscribeAuth = subscribeToQueryData(authQueryKey, (data) => {
      setAuthData(data);
    });
    const unsubscribePositions = subscribeToQueryData(positionsQueryKey, (data) => {
      setPositionsData(data);
    });
    const unsubscribeLunarEvents = subscribeToQueryData(lunarEventsQueryKey, (data) => {
      setLunarEventsData(data);
    });
    const unsubscribeDefaultChart = subscribeToQueryData(defaultChartQueryKey, (data) => {
      setDefaultChartData(data);
    });
    const unsubscribeChartsList = subscribeToQueryData(chartsListQueryKey, (data) => {
      setChartsListData(data);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePositions();
      unsubscribeLunarEvents();
      unsubscribeDefaultChart();
      unsubscribeChartsList();
    };
  }, [mounted, authQueryKey, positionsQueryKey, lunarEventsQueryKey, defaultChartQueryKey, chartsListQueryKey]);

  // Subscribe to vibes data updates (re-subscribe when query key changes)
  useEffect(() => {
    if (!mounted || !vibesQueryKey) {
      setVibesData(null);
      return;
    }
    // Update immediately from cache
    const cached = getCachedQueryData(vibesQueryKey);
    if (cached !== undefined) {
      setVibesData(cached);
    }
    // Subscribe to updates
    const unsubscribe = subscribeToQueryData(vibesQueryKey, (data) => {
      if (data !== undefined) {
        setVibesData(data);
      }
    });
    return unsubscribe;
  }, [mounted, vibesQueryKey]);

  // Subscribe to interpretations data updates (re-subscribe when query key changes)
  useEffect(() => {
    if (!mounted || !interpretationsQueryKey) {
      setInterpretationsData(null);
      return;
    }
    // Update immediately from cache
    const cached = getCachedQueryData(interpretationsQueryKey);
    if (cached !== undefined) {
      setInterpretationsData(cached);
    }
    // Subscribe to updates
    const unsubscribe = subscribeToQueryData(interpretationsQueryKey, (data) => {
      if (data !== undefined) {
        setInterpretationsData(data);
      }
    });
    return unsubscribe;
  }, [mounted, interpretationsQueryKey]);
  
  // Get query states (these are computed on each render)
  const vibesState = vibesQueryKey ? getCachedQueryState(vibesQueryKey) : null;
  const interpretationsState = interpretationsQueryKey ? getCachedQueryState(interpretationsQueryKey) : null;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] text-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Session Bootstrap Debug Info</h1>
          <p className="text-gray-400 text-sm">Technical diagnostics for development</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Session State */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-3">Session State</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <span className="font-medium">State:</span>{" "}
                <span className={`font-mono ${
                  sessionState === "anonymous" ? "text-red-400" :
                  sessionState === "authenticated_has_chart" ? "text-green-400" :
                  "text-yellow-400"
                }`}>
                  {sessionState}
                </span>
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Auth Checked:</span>{" "}
                <span className={hasCheckedAuth ? "text-green-400" : "text-yellow-400"}>
                  {hasCheckedAuth ? "Yes" : "No"}
                </span>
              </p>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-3">
              User Information
              {authState?.isLoading && <span className="ml-2 text-yellow-400 text-sm">Loading...</span>}
            </h2>
            {authData ? (
              <pre className="text-gray-300 text-xs overflow-auto bg-gray-900 p-3 rounded max-h-48">
                {JSON.stringify(authData, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">No user data (anonymous)</p>
            )}
          </div>

          {/* Positions Data */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-3">
              Positions (Sky Now)
              {positionsState?.isLoading && <span className="ml-2 text-yellow-400 text-sm">Loading...</span>}
              {positionsState?.isError && <span className="ml-2 text-red-400 text-sm">Error</span>}
            </h2>
            {positionsState?.isError ? (
              <div className="text-red-400 text-sm">
                <p className="font-semibold mb-2">Error loading positions:</p>
                <pre className="text-xs bg-red-900/20 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(positionsState.error, null, 2)}
                </pre>
              </div>
            ) : positionsData ? (
              <pre className="text-gray-300 text-xs overflow-auto bg-gray-900 p-3 rounded max-h-48">
                {JSON.stringify(positionsData, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">No positions data</p>
            )}
          </div>

          {/* Lunar Events */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-3">
              Lunar Events
              {lunarEventsState?.isLoading && <span className="ml-2 text-yellow-400 text-sm">Loading...</span>}
              {lunarEventsState?.isError && <span className="ml-2 text-red-400 text-sm">Error</span>}
            </h2>
            {lunarEventsState?.isError ? (
              <div className="text-red-400 text-sm">
                <p className="font-semibold mb-2">Error loading lunar events:</p>
                <pre className="text-xs bg-red-900/20 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(lunarEventsState.error, null, 2)}
                </pre>
              </div>
            ) : lunarEventsData ? (
              <pre className="text-gray-300 text-xs overflow-auto bg-gray-900 p-3 rounded max-h-48">
                {JSON.stringify(lunarEventsData, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">No lunar events data</p>
            )}
          </div>

          {/* Default Chart */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-3">
              Default Chart
              {defaultChartState?.isLoading && <span className="ml-2 text-yellow-400 text-sm">Loading...</span>}
              {defaultChartState?.isError && <span className="ml-2 text-red-400 text-sm">Error</span>}
            </h2>
            {defaultChartState?.isError ? (
              <div className="text-red-400 text-sm">
                <p className="font-semibold mb-2">Error loading default chart:</p>
                <pre className="text-xs bg-red-900/20 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify({
                    error: defaultChartState.error
                  }, null, 2)}
                </pre>
              </div>
            ) : defaultChartData?.chart ? (
              <pre className="text-gray-300 text-xs overflow-auto bg-gray-900 p-3 rounded max-h-64">
                {JSON.stringify(defaultChartData.chart, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">
                {sessionState === "authenticated_no_chart" 
                  ? "User authenticated but no default chart" 
                  : "No default chart data"}
              </p>
            )}
          </div>

          {/* Vibes Now (Transits) */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-3">
              Vibes Now (Current Transits)
              {vibesState?.isLoading && <span className="ml-2 text-yellow-400 text-sm">Loading...</span>}
              {vibesState?.isError && <span className="ml-2 text-red-400 text-sm">Error</span>}
            </h2>
            {vibesState?.isError ? (
              <div className="text-red-400 text-sm">
                <p className="font-semibold mb-2">Error loading vibes:</p>
                <pre className="text-xs bg-red-900/20 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify({
                    error: vibesState.error
                  }, null, 2)}
                </pre>
              </div>
            ) : vibesData ? (
              <pre className="text-gray-300 text-xs overflow-auto bg-gray-900 p-3 rounded max-h-64">
                {JSON.stringify(vibesData, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">No vibes data</p>
            )}
          </div>

          {/* Interpretations */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-3">
              Interpretations (Preloaded)
              {interpretationsState?.isLoading && <span className="ml-2 text-yellow-400 text-sm">Loading...</span>}
            </h2>
            {interpretationsData ? (
              <pre className="text-gray-300 text-xs overflow-auto bg-gray-900 p-3 rounded max-h-64">
                {JSON.stringify(interpretationsData, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">No interpretations data</p>
            )}
          </div>

          {/* Charts List */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-3">
              Charts List
              {chartsListState?.isLoading && <span className="ml-2 text-yellow-400 text-sm">Loading...</span>}
              {chartsListState?.isError && <span className="ml-2 text-red-400 text-sm">Error</span>}
            </h2>
            {chartsListData?.charts ? (
              <div>
                <p className="text-gray-300 text-sm mb-2">
                  <span className="font-medium">Count:</span> {chartsListData.charts.length}
                </p>
                <pre className="text-gray-300 text-xs overflow-auto bg-gray-900 p-3 rounded max-h-64">
                  {JSON.stringify(chartsListData.charts, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No charts list data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

