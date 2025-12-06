import { useState, useEffect, useRef, useMemo } from "react";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8000";
const STORAGE_KEY = "z13-zodiac-mode";

export function LunarEventsPage() {
  // Since we're in a separate React island, we need to read mode directly from localStorage
  // and listen for storage events to sync with the toggle
  const [mode, setModeState] = useState("z13");
  const [isHydrated, setIsHydrated] = useState(false);
  const [eventsZ13, setEventsZ13] = useState([]);
  const [eventsTropical, setEventsTropical] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const prevModeRef = useRef(mode);

  // Initialize mode from localStorage and listen for changes
  useEffect(() => {
    // Initial load
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "z13" || stored === "tropical") {
      setModeState(stored);
    }
    setIsHydrated(true);
    setMounted(true);

    // Listen for storage events (triggered when other components update localStorage)
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === "z13" || e.newValue === "tropical") {
          console.log("📡 Storage event: mode changed to", e.newValue);
          setModeState(e.newValue);
        }
      }
    };

    // Listen for custom events (for same-tab communication)
    const handleModeChange = (e) => {
      if (e.detail && (e.detail === "z13" || e.detail === "tropical")) {
        console.log("📡 Custom event: mode changed to", e.detail);
        setModeState(e.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("zodiacModeChange", handleModeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("zodiacModeChange", handleModeChange);
    };
  }, []); // Only run once on mount

  // Direct logging to see mode changes
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      console.log("🔥 MODE CHANGE DETECTED:", {
        from: prevModeRef.current,
        to: mode,
        timestamp: new Date().toISOString()
      });
      prevModeRef.current = mode;
    }
  }, [mode]);

  // Fetch lunar events
  useEffect(() => {
    console.log("LunarEventsPage useEffect triggered", { 
      mounted, 
      isHydrated, 
      mode, 
      hasFetched: hasFetchedRef.current,
      apiUrl: API_BASE_URL 
    });
    
    // Don't fetch until we're mounted (in browser)
    if (!mounted) {
      console.log("Not mounted yet, waiting...");
      return;
    }

    // Don't fetch if we've already fetched
    if (hasFetchedRef.current) {
      console.log("Already fetched, skipping...");
      return;
    }

    const url = `${API_BASE_URL}/lunar_events?mode=both`;
    console.log("Making API request to:", url);
    setLoading(true);
    setError(null);
    hasFetchedRef.current = true;

    fetch(url)
      .then((res) => {
        console.log("API response status:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("API response data:", data);
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
  }, [mounted]); // Removed mode from dependencies to prevent re-fetching

  // Select events based on current mode - useMemo to ensure updates when mode changes
  const currentEvents = useMemo(() => {
    const selected = mode === "z13" ? eventsZ13 : eventsTropical;
    console.log("currentEvents updated", { mode, count: selected.length });
    return selected;
  }, [mode, eventsZ13, eventsTropical]);

  const modeLabel = mode === "z13" ? "Z13 (true-sky)" : "Tropical";

  // Format datetime for display
  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const options = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-US", options);
  };

  // Format phase name for display
  const formatPhase = (phase) => {
    if (!phase) return "";
    return phase
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!mounted || loading) {
    return (
      <section className="min-h-screen px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            <span className="gradient-text">Lunar Currents</span>
          </h1>
          <div className="flex items-center justify-center mt-8">
            <div className="animate-pulse text-gray-400">Loading lunar events...</div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            <span className="gradient-text">Lunar Currents</span>
          </h1>
          <div className="mt-8 p-6 rounded-xl bg-red-900/20 border border-red-500/40 text-red-300 max-w-md mx-auto">
            <p className="font-semibold mb-2">Error loading lunar events</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </section>
    );
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
          {startDate && endDate && (
            <p className="text-gray-500 text-xs mt-2">
              Showing events from {formatDateTime(startDate)} to {formatDateTime(endDate)}
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

