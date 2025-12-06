import { useState, useEffect, useRef, useMemo } from "react";

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8000";
const STORAGE_KEY = "z13-zodiac-mode";

export function PositionsPage() {
  // Since we're in a separate React island, we need to read mode directly from localStorage
  // and listen for storage events to sync with the toggle
  const [mode, setModeState] = useState("z13");
  const [isHydrated, setIsHydrated] = useState(false);
  const [positionsZ13, setPositionsZ13] = useState([]);
  const [positionsTropical, setPositionsTropical] = useState([]);
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

  // Ensure we're in the browser
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("PositionsPage useEffect triggered", { 
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

    const url = `${API_BASE_URL}/positions/now?mode=both`;
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
        setPositionsZ13(data.positions_z13 || []);
        setPositionsTropical(data.positions_tropical || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching positions:", err);
        setError(err.message || "Failed to load positions");
        setLoading(false);
        hasFetchedRef.current = false; // Allow retry
      });
  }, [mounted, mode]);

  // Select positions based on current mode - useMemo to ensure updates when mode changes
  const currentPositions = useMemo(() => {
    const selected = mode === "z13" ? positionsZ13 : positionsTropical;
    console.log("currentPositions updated", { mode, count: selected.length });
    return selected;
  }, [mode, positionsZ13, positionsTropical]);

  const modeLabel = mode === "z13" ? "Z13 (true-sky)" : "Tropical";

  // Debug: Log when mode changes
  useEffect(() => {
    console.log("Mode changed to:", mode, "Positions available:", {
      z13: positionsZ13.length,
      tropical: positionsTropical.length
    });
  }, [mode, positionsZ13.length, positionsTropical.length]);

  // Calculate degree within sign from longitude
  // For tropical: 12 signs × 30° each
  // For Z13: 13 signs × (360/13)° each
  const calculateSignDegree = (longitude, mode) => {
    const signSize = mode === "z13" ? 360 / 13 : 30;
    return (longitude % signSize).toFixed(2);
  };

  // Extract degree from sign label (e.g., "Sagittarius (10.13°)" -> 10.13)
  // If not found, calculate from longitude
  const extractDegree = (label, longitude, mode) => {
    const match = label?.match(/\(([\d.]+)°\)/);
    if (match) {
      return parseFloat(match[1]);
    }
    // Fallback: calculate from longitude if available
    if (longitude !== null && longitude !== undefined) {
      return parseFloat(calculateSignDegree(longitude, mode));
    }
    return null;
  };

  // Extract sign name from label (e.g., "Sagittarius (10.13°)" -> "Sagittarius")
  const extractSign = (label) => {
    return label?.split(" (")[0] || label;
  };

  if (!mounted || loading) {
    return (
      <section className="min-h-screen px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            <span className="gradient-text">Current Celestials Vibes</span>
          </h1>
          <div className="flex items-center justify-center mt-8">
            <div className="animate-pulse text-gray-400">Loading cosmic data...</div>
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
            <span className="gradient-text">Current Celestials Vibes</span>
          </h1>
          <div className="mt-8 p-6 rounded-xl bg-red-900/20 border border-red-500/40 text-red-300 max-w-md mx-auto">
            <p className="font-semibold mb-2">Error loading positions</p>
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
            <span className="gradient-text">Current Celestials Vibes</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Mode: <span className="text-neon-cyan font-semibold">{modeLabel}</span>
          </p>
        </div>

        {/* Positions Grid */}
        {currentPositions.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            No position data available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPositions
              .filter((position) => position.body !== "North Node" && position.body !== "South Node")
              .map((position) => {
              const sign = extractSign(position.sign);
              const degree = extractDegree(position.sign, position.longitude, position.mode);

              return (
                <div
                  key={`${position.body}-${mode}`}
                  className="p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm hover:shadow-neon transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-100">
                      {position.body}
                    </h3>
                    {position.retrograde !== null && position.retrograde && (
                      <span className="text-xs px-2 py-1 rounded bg-amber-900/30 text-amber-300 border border-amber-500/40">
                        Rx
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-400">Sign: </span>
                      <span className="text-neon-purple font-semibold">
                        {sign}
                      </span>
                    </div>
                    {degree !== null && (
                      <div>
                        <span className="text-sm text-gray-400">Degree: </span>
                        <span className="text-neon-cyan font-semibold">
                          {degree.toFixed(2)}°
                        </span>
                      </div>
                    )}
                    {position.speed !== null && (
                      <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700/40">
                        Speed: {position.speed.toFixed(2)}°/day
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

