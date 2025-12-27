import { useState, useEffect, useRef, useMemo } from "react";
import { getCachedQueryData, getCachedQueryState, subscribeToQueryData } from "../../utils/queryClient";
import { bootstrapQueryKeys } from "../../contexts/SessionBootstrapContext";
import { API_BASE_URL } from "../../utils/constants";
import { useMounted } from "../../hooks/useMounted";
import { useZodiacMode } from "../../hooks/useZodiacMode";
import { formatDateTime } from "../../utils/dateFormatters";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";

export function LunarEventsPage() {
  // Check authentication status - since this is a React island with client:load,
  // we can't reliably access SessionBootstrap context, so we check via API
  // Default to unauthenticated (3 days) until we know otherwise
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Always fetch 7 days, but display limit based on authentication
  const displayDays = isAuthenticated ? 7 : 3;
  const fetchDays = 7; // Always fetch 7 days
  
  // Check authentication status on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/me`, {
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
        setAuthChecked(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setAuthChecked(true);
      });
  }, []);
  
  // Use zodiac mode hook
  const { mode, isHydrated } = useZodiacMode();
  const mounted = useMounted();
  
  // Always use 7 days for query key and fetching
  const lunarEventsQueryKey = bootstrapQueryKeys.lunar.events(fetchDays, "z13");
  const cachedLunarEvents = getCachedQueryData(lunarEventsQueryKey);
  const cachedState = getCachedQueryState(lunarEventsQueryKey);
  
  const [eventsZ13, setEventsZ13] = useState([]);
  const [eventsTropical, setEventsTropical] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(!cachedLunarEvents);
  const [error, setError] = useState(cachedState?.error || null);
  const hasFetchedRef = useRef(false);

  // Subscribe to lunar events cache updates and use cached data if available
  useEffect(() => {
    if (!mounted) return;
    
    // Subscribe to cache updates
    const unsubscribe = subscribeToQueryData(lunarEventsQueryKey, (data) => {
      if (data) {
        // Handle both single-mode and both-mode responses
        if (data.events_z13 && data.events_tropical) {
          // Both mode response
          setEventsZ13(data.events_z13 || []);
          setEventsTropical(data.events_tropical || []);
        } else if (data.events) {
          // Single mode response - need to fetch both modes
          // For now, use the cached data for the mode it represents
          if (data.mode === "z13") {
            setEventsZ13(data.events || []);
          } else {
            setEventsTropical(data.events || []);
          }
        }
        setStartDate(data.start || null);
        setEndDate(data.end || null);
        setLoading(false);
        setError(null);
      }
    });
    
    // If we have cached data, use it immediately
    if (cachedLunarEvents) {
      if (cachedLunarEvents.events_z13 && cachedLunarEvents.events_tropical) {
        setEventsZ13(cachedLunarEvents.events_z13 || []);
        setEventsTropical(cachedLunarEvents.events_tropical || []);
      } else if (cachedLunarEvents.events) {
        if (cachedLunarEvents.mode === "z13") {
          setEventsZ13(cachedLunarEvents.events || []);
        } else {
          setEventsTropical(cachedLunarEvents.events || []);
        }
      }
      setStartDate(cachedLunarEvents.start || null);
      setEndDate(cachedLunarEvents.end || null);
      setLoading(cachedState?.isLoading || false);
      setError(cachedState?.error || null);
    } else if (!hasFetchedRef.current) {
      // Only fetch if not in cache and we haven't fetched yet
      hasFetchedRef.current = true;
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}/lunar_events?days=${fetchDays}&mode=both`;
      fetch(url)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setEventsZ13(data.events_z13 || []);
          setEventsTropical(data.events_tropical || []);
          setStartDate(data.start || null);
          setEndDate(data.end || null);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching lunar events:", err);
          setError(err.message || "Failed to load lunar events");
          setLoading(false);
          hasFetchedRef.current = false; // Allow retry
        });
    }
    
    return unsubscribe;
  }, [mounted, lunarEventsQueryKey, cachedLunarEvents, cachedState, fetchDays]);

  // Select events based on current mode and filter by displayDays
  const currentEvents = useMemo(() => {
    const selected = mode === "z13" ? eventsZ13 : eventsTropical;
    
    // Filter to only show events within displayDays
    if (displayDays < 7 && selected.length > 0) {
      const now = new Date();
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() + displayDays);
      
      return selected.filter(event => {
        const eventDate = new Date(event.datetime);
        return eventDate <= cutoffDate;
      });
    }
    
    return selected;
  }, [mode, eventsZ13, eventsTropical, displayDays]);

  // Calculate display end date based on displayDays
  const displayEndDate = useMemo(() => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + displayDays - 1);
    return end.toISOString();
  }, [startDate, displayDays]);

  const modeLabel = mode === "z13" ? "Z13 (true-sky)" : "Tropical";

  // Format phase name for display
  const formatPhase = (phase) => {
    if (!phase) return "";
    return phase
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!mounted || loading) {
    return <LoadingState message="Loading lunar events..." />;
  }

  if (error) {
    return <ErrorState error={error || "Error loading lunar events"} />;
  }

  return (
    <section className="min-h-screen px-4 py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Lunar Currents</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Mode: <span className="text-neon-cyan font-semibold">{modeLabel}</span>
          </p>
          {startDate && displayEndDate && (
            <p className="text-gray-500 text-xs mt-2">
              Showing events from {formatDateTime(startDate)} to {formatDateTime(displayEndDate)}
            </p>
          )}
        </div>

        {/* Events List */}
        {currentEvents.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No lunar events available for this period.
          </div>
        ) : (
          <div className="space-y-6">
            {currentEvents.map((event, index) => (
              <div
                key={`${event.datetime}-${event.event_type}-${mode}-${index}`}
                className="p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm hover:shadow-neon transition-all duration-300"
              >
                {/* Event Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          event.event_type === "phase"
                            ? "bg-purple-900/30 text-purple-300 border border-purple-500/40"
                            : "bg-cyan-900/30 text-cyan-300 border border-cyan-500/40"
                        }`}
                      >
                        {event.event_type === "phase" ? "Phase" : "Ingress"}
                      </span>
                      {event.phase && (
                        <span className="text-sm text-gray-300 font-medium">
                          {formatPhase(event.phase)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-100 mb-1">
                      {event.sign}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {formatDateTime(event.datetime)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <div className="mb-4">
                    <p className="text-gray-300 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {event.notes && (
                  <div className="mb-4 p-4 rounded-lg bg-white/5 border border-gray-700/30">
                    <p className="text-sm text-gray-400 italic leading-relaxed">
                      {event.notes}
                    </p>
                  </div>
                )}

                {/* Keywords */}
                {event.keywords && event.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.keywords.map((keyword, kwIndex) => (
                      <span
                        key={`${event.datetime}-keyword-${kwIndex}`}
                        className="text-xs px-2 py-1 rounded bg-gray-700/40 text-gray-300 border border-gray-600/40"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

