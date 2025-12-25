import { useState, useEffect, useRef, useMemo } from "react";
import { getCachedQueryData, getCachedQueryState, subscribeToQueryData } from "../../utils/queryClient";
import { bootstrapQueryKeys } from "../../contexts/SessionBootstrapContext";

const STORAGE_KEY = "z13-zodiac-mode";

export function PositionsPage() {
  // This component is rendered as a separate React island (client:load), so it doesn't have
  // access to SessionBootstrapProvider context. However, we can access the global QueryClient
  // to read preloaded positions data from the cache.
  
  // Try to get preloaded positions from cache first
  const positionsQueryKey = bootstrapQueryKeys.positions.now("both");
  const cachedPositions = getCachedQueryData(positionsQueryKey);
  const cachedState = getCachedQueryState(positionsQueryKey);
  
  const [positions, setPositions] = useState(cachedPositions || null);
  const [positionsLoading, setPositionsLoading] = useState(cachedState?.isLoading || false);
  const [positionsError, setPositionsError] = useState(cachedState?.error || null);
  const hasFetchedRef = useRef(false);
  
  // Interpretations state - key format: `${mode}_${body}_${sign}` (e.g., "z13_sun_aries")
  const [interpretations, setInterpretations] = useState({});
  const [interpretationsLoading, setInterpretationsLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  
  // Since we're in a separate React island, we need to read mode directly from localStorage
  // and listen for storage events to sync with the toggle
  const [mode, setModeState] = useState("z13");
  const [isHydrated, setIsHydrated] = useState(false);
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

  // Subscribe to positions cache updates from SessionBootstrapContext
  useEffect(() => {
    if (!mounted) return;
    
    // Subscribe to cache updates
    const unsubscribe = subscribeToQueryData(positionsQueryKey, (data) => {
      if (data) {
        setPositions(data);
        setPositionsLoading(false);
        setPositionsError(null);
      }
    });
    
    // If we have cached data, use it immediately
    if (cachedPositions) {
      setPositions(cachedPositions);
      setPositionsLoading(cachedState?.isLoading || false);
      setPositionsError(cachedState?.error || null);
    } else if (!hasFetchedRef.current) {
      // Only fetch if not in cache and we haven't fetched yet
      hasFetchedRef.current = true;
      setPositionsLoading(true);
      setPositionsError(null);

      fetch("/api/positions?mode=both", {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setPositions(data);
          setPositionsLoading(false);
        })
        .catch((err) => {
          console.error("PositionsPage: Error fetching positions:", err);
          setPositionsError(err);
          setPositionsLoading(false);
          hasFetchedRef.current = false; // Allow retry
        });
    }
    
    return unsubscribe;
  }, [mounted, positionsQueryKey, cachedPositions, cachedState]);

  // Transform API Position format to display format
  const transformPositions = useMemo(() => {
    if (!positions) return { z13: [], tropical: [] };

    // The API returns PositionsResponse with mode=both: { as_of_utc, mode: "both", positions: Position[] }
    // Each Position has placement: PlacementBoth { z13: PlacementCore, tropical: PlacementCore }
    const posArray = positions.positions;
    if (!Array.isArray(posArray)) {
      console.warn("PositionsPage: positions.positions is not an array", positions);
      return { z13: [], tropical: [] };
    }

    // Transform a single position array to both modes
    const transformPositionArray = (targetMode) => {
      return posArray
        .filter(pos => {
          // Only include bodies/points, exclude angles and nodes
          if (pos.kind !== "body" && pos.kind !== "point") return false;
          const key = pos.key?.toLowerCase() || "";
          // Exclude North Node and South Node (handle both "North Node" and "NorthNode" formats)
          if (key === "north node" || key === "south node" || key === "northnode" || key === "southnode") return false;
          return true;
        })
        .map((pos) => {
          // Extract placement info - handle PlacementCore or PlacementBoth
          let placementInfo = null;
          if (pos.placement) {
            if (pos.placement.z13 && pos.placement.tropical) {
              // PlacementBoth - select based on targetMode
              const selected = targetMode === "z13" ? pos.placement.z13 : pos.placement.tropical;
              placementInfo = {
                sign: selected.sign,
                sign_degree: selected.deg_in_sign,
              };
            } else if (pos.placement.sign !== undefined) {
              // PlacementCore (single mode)
              placementInfo = {
                sign: pos.placement.sign,
                sign_degree: pos.placement.deg_in_sign,
              };
            }
          }

          return {
            body: pos.key,
            signName: placementInfo?.sign || null,
            sign: placementInfo ? `${placementInfo.sign} (${placementInfo.sign_degree.toFixed(2)}°)` : null,
            longitude: pos.lon_deg,
            retrograde: pos.retrograde ?? null,
            speed: pos.speed_lon_deg_per_day ?? null,
            mode: targetMode,
          };
        });
    };

    // Extract both modes from the same array
    return {
      z13: transformPositionArray("z13"),
      tropical: transformPositionArray("tropical"),
    };
  }, [positions]);

  // Track which interpretations have been requested to avoid duplicate fetches
  const interpretationsRequestedRef = useRef(new Set());

  // Fetch interpretations for all positions in both modes
  useEffect(() => {
    if (!positions || !transformPositions.z13.length || interpretationsLoading) return;

    const toFetch = [];
    
    // Build list of interpretations to fetch for both modes
    ["z13", "tropical"].forEach((targetMode) => {
      const positionsForMode = targetMode === "z13" ? transformPositions.z13 : transformPositions.tropical;
      positionsForMode.forEach((pos) => {
        if (!pos.signName || !pos.body) return;
        
        const key = `${targetMode}_${pos.body}_${pos.signName}`;
        // Only check requested set to avoid re-fetches
        if (interpretationsRequestedRef.current.has(key)) return;
        
        interpretationsRequestedRef.current.add(key);
        const bodySlug = pos.body.toLowerCase().replace(/\s+/g, "_");
        const signSlug = pos.signName.toLowerCase().replace(/\s+/g, "_");
        const slug = `${bodySlug}_in_${signSlug}`;
        
        toFetch.push({ category: "planet_in_sign", slug, key });
      });
    });

    if (toFetch.length === 0) return;

    setInterpretationsLoading(true);
    Promise.all(
      toFetch.map(({ category, slug, key }) =>
        fetch(`/api/interpretations/${category}/${slug}`, {
          credentials: "include",
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch((err) => {
            console.error(`Error fetching interpretation for ${key}:`, err);
            return null;
          })
          .then((data) => ({ key, data }))
      )
    ).then((results) => {
      setInterpretations((prev) => {
        const newInterpretations = { ...prev };
        results.forEach(({ key, data }) => {
          if (data) {
            newInterpretations[key] = data;
          }
        });
        return newInterpretations;
      });
      setInterpretationsLoading(false);
    });
  }, [positions, transformPositions, interpretationsLoading]);

  // Select positions based on current mode
  const currentPositions = useMemo(() => {
    const selected = mode === "z13" ? transformPositions.z13 : transformPositions.tropical;
    return selected;
  }, [mode, transformPositions]);
  
  // Use loading and error states
  // Only show loading if we're actually loading and don't have data yet
  const loading = mounted && positionsLoading && !positions;
  const error = positionsError ? (positionsError.message || String(positionsError)) : null;

  const modeLabel = mode === "z13" ? "Z13 (true-sky)" : "Tropical";

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

  // Toggle card expansion
  const toggleCard = (cardKey) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardKey)) {
      newExpanded.delete(cardKey);
    } else {
      newExpanded.add(cardKey);
    }
    setExpandedCards(newExpanded);
  };

  // Get interpretation for a position
  const getInterpretation = (body, signName, mode) => {
    if (!body || !signName) return null;
    const key = `${mode}_${body}_${signName}`;
    return interpretations[key] || null;
  };

  if (!mounted || loading) {
    return (
      <section className="min-h-screen px-4 pt-28 pb-20">
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
      <section className="min-h-screen px-4 pt-28 pb-20">
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
              .map((position) => {
              const sign = extractSign(position.sign);
              const degree = extractDegree(position.sign, position.longitude, position.mode);
              const cardKey = `${position.body}-${mode}`;
              const isExpanded = expandedCards.has(cardKey);
              const interpretation = getInterpretation(position.body, position.signName, mode);
              const hasInterpretation = !!interpretation;

              return (
                <div
                  key={cardKey}
                  onClick={() => toggleCard(cardKey)}
                  className={`p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm hover:shadow-neon transition-all duration-300 cursor-pointer ${
                    hasInterpretation ? "shadow-[0_0_15px_rgba(139,92,246,0.3)]" : ""
                  }`}
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

                  {/* Expanded interpretation view */}
                  {isExpanded && interpretation && (
                    <div className="mt-4 pt-4 border-t border-gray-700/40">
                      {interpretation.micro?.meaning && (
                        <div className="mb-4">
                          <p className="text-gray-200 text-sm leading-relaxed">
                            {interpretation.micro.meaning}
                          </p>
                        </div>
                      )}
                      {interpretation.micro?.keywords && interpretation.micro.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {interpretation.micro.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 text-xs rounded-full bg-purple-900/30 text-purple-300 border border-purple-500/40"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

