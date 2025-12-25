import { useState, useEffect, useMemo } from "react";
import { useSessionBootstrap } from "../../contexts/SessionBootstrapContext";

// Use relative /api path for client-side calls
const API_BASE_URL = "/api";
const STORAGE_KEY = "z13-zodiac-mode";

export function DefaultChartViewPage() {
  const [mounted, setMounted] = useState(false);
  const [mode, setModeState] = useState("z13");
  const [natalZ13, setNatalZ13] = useState(null);
  const [natalTropical, setNatalTropical] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interpretations state
  const [interpretations, setInterpretations] = useState({});
  const [loadingInterpretations, setLoadingInterpretations] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());

  const { defaultChart, sessionState, hasCheckedAuth } = useSessionBootstrap();
  const isAuthenticated = sessionState === "authenticated_has_chart" || sessionState === "authenticated_no_chart";
  const hasDefaultChart = sessionState === "authenticated_has_chart";

  // Initialize mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "z13" || stored === "tropical") {
      setModeState(stored);
    }
    setMounted(true);

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === "z13" || e.newValue === "tropical") {
          setModeState(e.newValue);
        }
      }
    };

    const handleModeChange = (e) => {
      if (e.detail && (e.detail === "z13" || e.detail === "tropical")) {
        setModeState(e.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("zodiacModeChange", handleModeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("zodiacModeChange", handleModeChange);
    };
  }, []);

  // Redirect if no default chart
  useEffect(() => {
    if (!mounted || !hasCheckedAuth) return;
    
    if (!hasDefaultChart) {
      // Redirect to create page if no default chart
      window.location.href = "/natal/create";
    }
  }, [mounted, hasCheckedAuth, hasDefaultChart]);

  // Load default chart from context
  useEffect(() => {
    if (!mounted || !hasCheckedAuth) {
      return;
    }

    if (!hasDefaultChart || !defaultChart) {
      setLoading(false);
      return;
    }

    loadChart();
  }, [mounted, hasCheckedAuth, hasDefaultChart, defaultChart]);

  const loadChart = () => {
    try {
      setLoading(true);
      setError(null);

      const chart = defaultChart;
      if (!chart) {
        setError("No chart data available");
        setLoading(false);
        return;
      }

      // Convert chart to display format (same logic as BirthChartPage)
      const convertChartToDisplayFormat = (chartData, zodiacMode) => {
        const computed = chartData.computed;
        const positions = (computed.positions || [])
          .filter(pos => pos.kind === "body" || pos.kind === "point")
          .map((pos) => {
            let placement = null;
            if (pos.placement) {
              if (pos.placement.z13 && pos.placement.tropical) {
                const selectedPlacement = zodiacMode === "z13" ? pos.placement.z13 : pos.placement.tropical;
                placement = {
                  sign: selectedPlacement.sign,
                  sign_degree: selectedPlacement.deg_in_sign,
                  label: `${selectedPlacement.sign} ${selectedPlacement.deg_in_sign.toFixed(2)}°`,
                };
              } else {
                placement = {
                  sign: pos.placement.sign,
                  sign_degree: pos.placement.deg_in_sign,
                  label: `${pos.placement.sign} ${pos.placement.deg_in_sign.toFixed(2)}°`,
                };
              }
            }

            return {
              body: pos.key,
              longitude: pos.lon_deg,
              latitude: pos.lat_deg || 0,
              placement,
            };
          });

        const angles = (computed.positions || [])
          .filter(pos => pos.kind === "angle")
          .map((pos) => {
            let placement = null;
            if (pos.placement) {
              if (pos.placement.z13 && pos.placement.tropical) {
                const selectedPlacement = zodiacMode === "z13" ? pos.placement.z13 : pos.placement.tropical;
                placement = {
                  sign: selectedPlacement.sign,
                  sign_degree: selectedPlacement.deg_in_sign,
                  label: `${selectedPlacement.sign} ${selectedPlacement.deg_in_sign.toFixed(2)}°`,
                };
              } else {
                placement = {
                  sign: pos.placement.sign,
                  sign_degree: pos.placement.deg_in_sign,
                  label: `${pos.placement.sign} ${pos.placement.deg_in_sign.toFixed(2)}°`,
                };
              }
            }

            return {
              angle: pos.key,
              longitude: pos.lon_deg,
              placement,
            };
          });

        return {
          positions,
          angles,
          metadata: {
            mode: zodiacMode,
            datetime_local: chartData.input.datetime_utc,
            datetime_utc: chartData.input.datetime_utc,
            location: {
              latitude: chartData.input.lat,
              longitude: chartData.input.lon,
              timezone: chartData.input.timezone,
              name: chartData.input.place_name || "",
            },
          },
        };
      };

      const computedMode = chart.computed.mode;
      if (computedMode === "both") {
        const z13Chart = convertChartToDisplayFormat(chart, "z13");
        const tropicalChart = convertChartToDisplayFormat(chart, "tropical");
        setNatalZ13(z13Chart);
        setNatalTropical(tropicalChart);
      } else {
        const chartData = convertChartToDisplayFormat(chart, computedMode);
        if (computedMode === "z13") {
          setNatalZ13(chartData);
          setNatalTropical({ ...chartData, metadata: { ...chartData.metadata, mode: "tropical" } });
        } else {
          setNatalTropical(chartData);
          setNatalZ13({ ...chartData, metadata: { ...chartData.metadata, mode: "z13" } });
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error processing default chart:", err);
      setError(err.message || "Failed to process chart");
      setLoading(false);
    }
  };

  // Get current natal data based on mode
  const currentNatal = useMemo(() => {
    return mode === "z13" ? natalZ13 : natalTropical;
  }, [mode, natalZ13, natalTropical]);

  // Extract Big Three from current natal data
  const bigThree = useMemo(() => {
    if (!currentNatal) return { sun: null, moon: null, ascendant: null };
    const sun = currentNatal.positions?.find((p) => p.body === "Sun");
    const moon = currentNatal.positions?.find((p) => p.body === "Moon");
    const ascendant = currentNatal.angles?.find((a) => a.angle === "ASC");
    return { sun, moon, ascendant };
  }, [currentNatal]);

  // Get remaining placements in specified order
  const remainingPlacements = useMemo(() => {
    if (!currentNatal) return [];
    const bigThreeBodies = new Set(["Sun", "Moon"]);
    const excludedAngles = new Set(["ASC", "DSC", "MC", "IC"]);
    const positions = currentNatal.positions?.filter((p) => !bigThreeBodies.has(p.body)) || [];
    const angles = currentNatal.angles?.filter((a) => !excludedAngles.has(a.angle)) || [];
    const allPlacements = [...positions, ...angles];
    
    // Define order for placements
    const placementOrder = [
      "Mercury", "Venus", "Mars", "Jupiter", "Saturn", 
      "Chiron", "Uranus", "Neptune", "Pluto", "Lilith",
      "North Node", "NorthNode", "NN",
      "South Node", "SouthNode", "SN"
    ];
    
    // Helper function to get sort order for a placement
    const getSortOrder = (placement) => {
      const label = placement.body || placement.angle || "";
      const normalizedLabel = label.trim();
      
      // Check exact matches first
      for (let i = 0; i < placementOrder.length; i++) {
        if (normalizedLabel === placementOrder[i]) {
          // North Node variants map to same position (index 10)
          if (normalizedLabel === "North Node" || normalizedLabel === "NorthNode" || normalizedLabel === "NN") {
            return 10;
          }
          // South Node variants map to same position (index 11)
          if (normalizedLabel === "South Node" || normalizedLabel === "SouthNode" || normalizedLabel === "SN") {
            return 11;
          }
          return i;
        }
      }
      
      // Check case-insensitive and with spaces
      const lowerLabel = normalizedLabel.toLowerCase();
      for (let i = 0; i < placementOrder.length; i++) {
        const orderLabel = placementOrder[i].toLowerCase();
        if (lowerLabel === orderLabel || lowerLabel === orderLabel.replace(/\s+/g, "")) {
          // North Node variants
          if (i >= 10 && i <= 12) return 10;
          // South Node variants
          if (i >= 13) return 11;
          return i;
        }
      }
      
      // Check if it contains "north node" or "south node"
      if (lowerLabel.includes("north") && lowerLabel.includes("node")) return 10;
      if (lowerLabel.includes("south") && lowerLabel.includes("node")) return 11;
      
      // Default: put at end
      return 999;
    };
    
    // Sort placements by order
    return allPlacements.sort((a, b) => {
      const orderA = getSortOrder(a);
      const orderB = getSortOrder(b);
      return orderA - orderB;
    });
  }, [currentNatal]);

  // Fetch interpretations for placements
  useEffect(() => {
    if (!currentNatal || loadingInterpretations) return;

    const { sun, moon, ascendant } = bigThree;
    const toFetch = [];

    // Fetch Big Three interpretations
    if (sun?.placement?.sign) {
      const signSlug = sun.placement.sign.toLowerCase().replace(/\s+/g, "_");
      const slug = `sun_in_${signSlug}`;
      const key = `planet_in_sign_${slug}`;
      if (!interpretations[key]) {
        toFetch.push({ category: "planet_in_sign", slug, key });
      }
    }

    if (moon?.placement?.sign) {
      const signSlug = moon.placement.sign.toLowerCase().replace(/\s+/g, "_");
      const slug = `moon_in_${signSlug}`;
      const key = `planet_in_sign_${slug}`;
      if (!interpretations[key]) {
        toFetch.push({ category: "planet_in_sign", slug, key });
      }
    }

    if (ascendant?.placement?.sign) {
      const signSlug = ascendant.placement.sign.toLowerCase().replace(/\s+/g, "_");
      const slug = `asc_in_${signSlug}`;
      const key = `angle_in_sign_${slug}`;
      if (!interpretations[key]) {
        toFetch.push({ category: "angle_in_sign", slug, key });
      }
    }

    // Fetch interpretations for remaining placements
    remainingPlacements.forEach((placement) => {
      const label = placement.body || placement.angle;
      const placementData = placement.placement;
      if (!placementData) return;
      
      const sign = placementData?.sign || placementData?.label?.split(" ")[0] || "";
      if (!sign) return;

      const signSlug = sign.toLowerCase().replace(/\s+/g, "_");
      const bodySlug = label.toLowerCase().replace(/\s+/g, "_");
      
      const isNode = placement.body && (
        (label.toLowerCase().includes("north") && label.toLowerCase().includes("node")) ||
        (label.toLowerCase().includes("south") && label.toLowerCase().includes("node")) ||
        label === "NN" || 
        label === "SN" ||
        label === "North Node" ||
        label === "South Node" ||
        label === "NorthNode" ||
        label === "SouthNode"
      );
      
      let category, slug;
      
      if (isNode) {
        category = "node_in_sign";
        const isNorthNode = label.toLowerCase().includes("north") || label === "NN" || label === "North Node" || label === "NorthNode";
        const nodePrefix = isNorthNode ? "nn" : "sn";
        slug = `${nodePrefix}_in_${signSlug}`;
      } else {
        const isPlanet = !!placement.body;
        category = isPlanet ? "planet_in_sign" : "angle_in_sign";
        slug = isPlanet 
          ? `${bodySlug}_in_${signSlug}`
          : `asc_in_${signSlug}`;
      }
      
      const key = `${category}_${slug}`;
      
      if (!interpretations[key]) {
        toFetch.push({ category, slug, key });
      }
    });

    if (toFetch.length === 0) return;

    setLoadingInterpretations(true);
    Promise.all(
      toFetch.map(({ category, slug, key }) =>
        fetch(`${API_BASE_URL}/interpretations/${category}/${slug}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => ({ key, data }))
          .catch((err) => {
            console.error(`Error fetching ${key}:`, err);
            return { key, data: null };
          })
      )
    ).then((results) => {
      const newInterpretations = { ...interpretations };
      results.forEach(({ key, data }) => {
        if (data) {
          newInterpretations[key] = data;
        }
      });
      setInterpretations(newInterpretations);
      setLoadingInterpretations(false);
    });
  }, [currentNatal, bigThree, remainingPlacements, interpretations]);

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

  // Get interpretation for a placement
  const getInterpretation = (type, bodyOrAngle, sign) => {
    if (!sign) return null;
    const slug = sign.toLowerCase().replace(/\s+/g, "_");
    const bodySlug = bodyOrAngle.toLowerCase().replace(/\s+/g, "_");
    
    const isNode = type === "node" || (bodyOrAngle && (
      (bodyOrAngle.toLowerCase().includes("north") && bodyOrAngle.toLowerCase().includes("node")) ||
      (bodyOrAngle.toLowerCase().includes("south") && bodyOrAngle.toLowerCase().includes("node")) ||
      bodyOrAngle === "NN" || 
      bodyOrAngle === "SN" ||
      bodyOrAngle === "North Node" ||
      bodyOrAngle === "South Node" ||
      bodyOrAngle === "NorthNode" ||
      bodyOrAngle === "SouthNode"
    ));
    
    let category, interpretationSlug;
    
    if (isNode) {
      category = "node_in_sign";
      const isNorthNode = bodyOrAngle.toLowerCase().includes("north") || bodyOrAngle === "NN" || bodyOrAngle === "North Node" || bodyOrAngle === "NorthNode";
      const nodePrefix = isNorthNode ? "nn" : "sn";
      interpretationSlug = `${nodePrefix}_in_${slug}`;
    } else {
      category = type === "planet" ? "planet_in_sign" : "angle_in_sign";
      interpretationSlug = type === "planet" 
        ? `${bodySlug}_in_${slug}` 
        : `asc_in_${slug}`;
    }
    
    const key = `${category}_${interpretationSlug}`;
    return interpretations[key] || null;
  };

  // Extract sign and degree from placement
  const getSign = (placement) => {
    return placement?.sign || placement?.label?.split(" ")[0] || "";
  };

  const getDegree = (placement) => {
    if (placement?.sign_degree !== undefined) {
      return placement.sign_degree.toFixed(2);
    }
    const match = placement?.label?.match(/\(([\d.]+)°\)/);
    return match ? parseFloat(match[1]).toFixed(2) : null;
  };

  if (!mounted) {
    return null;
  }

  if (!hasCheckedAuth) {
    return (
      <section className="min-h-screen px-4 pt-28 pb-20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="min-h-screen px-4 pt-28 pb-20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">Loading your chart...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen px-4 pt-28 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 p-6 rounded-xl bg-red-900/20 border border-red-500/40 text-red-300">
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  const modeLabel = mode === "z13" ? "Z13 (true-sky)" : "Tropical";

  // Format birth information
  const formatBirthInfo = () => {
    if (!currentNatal || !defaultChart) return null;
    const info = [];
    if (defaultChart.meta?.name) {
      info.push({ label: "Name", value: defaultChart.meta.name });
    }
    if (defaultChart.input?.datetime_utc) {
      const birthDate = new Date(defaultChart.input.datetime_utc);
      const dateStr = birthDate.toLocaleDateString("en-US", { 
        year: "numeric", month: "long", day: "numeric" 
      });
      info.push({ label: "Date of Birth", value: dateStr });
      if (defaultChart.input.birth_time_provided) {
        const timeStr = birthDate.toLocaleTimeString("en-US", { 
          hour: "2-digit", minute: "2-digit" 
        });
        info.push({ label: "Time", value: timeStr });
      }
    }
    if (defaultChart.input?.place_name) {
      info.push({ label: "Location", value: defaultChart.input.place_name });
    }
    return info;
  };

  const birthInfo = formatBirthInfo();

  // Render placement card with expandable interpretation
  const renderPlacementCard = (placement, idx) => {
    const label = placement.body || placement.angle;
    const sign = getSign(placement.placement);
    const degree = getDegree(placement.placement);
    
    const isNode = placement.body && (
      (label.toLowerCase().includes("north") && label.toLowerCase().includes("node")) ||
      (label.toLowerCase().includes("south") && label.toLowerCase().includes("node")) ||
      label === "NN" || 
      label === "SN" ||
      label === "North Node" ||
      label === "South Node" ||
      label === "NorthNode" ||
      label === "SouthNode"
    );
    
    const isPlanet = !!placement.body && !isNode;
    const type = isNode ? "node" : (isPlanet ? "planet" : "angle");
    
    const interpretation = getInterpretation(type, label, sign);
    const cardKey = `placement_${label.toLowerCase()}_${idx}`;
    const isExpanded = expandedCards.has(cardKey);
    const hasInterpretation = !!interpretation;

    return (
      <div
        key={`${label}-${idx}`}
        className={`p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm hover:shadow-neon transition-all duration-300 ${
          hasInterpretation ? "cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)]" : ""
        }`}
        onClick={() => hasInterpretation && toggleCard(cardKey)}
        role={hasInterpretation ? "button" : undefined}
        tabIndex={hasInterpretation ? 0 : undefined}
        onKeyDown={(e) => {
          if (hasInterpretation && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            toggleCard(cardKey);
          }
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-100">{label}</h3>
        </div>

        <div className="space-y-2">
          {sign && (
            <div>
              <span className="text-sm text-gray-400">Sign: </span>
              <span className="text-neon-purple font-semibold">{sign}</span>
            </div>
          )}
          {degree && (
            <div>
              <span className="text-sm text-gray-400">Degree: </span>
              <span className="text-neon-cyan font-semibold">{degree}°</span>
            </div>
          )}
        </div>

        {isExpanded && interpretation && (
          <div className="mt-4 pt-4 border-t border-gray-700/40 animate-in slide-in-from-top duration-300 space-y-4">
            {interpretation.macro && (
              <div className="space-y-3">
                {interpretation.macro.interpretation && (
                  <div>
                    <p className="text-gray-300 leading-relaxed text-base">
                      {interpretation.macro.interpretation}
                    </p>
                  </div>
                )}
                {interpretation.macro.keywords && Array.isArray(interpretation.macro.keywords) && interpretation.macro.keywords.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Themes:</p>
                    <div className="flex flex-wrap gap-2">
                      {interpretation.macro.keywords.map((keyword, keywordIdx) => (
                        <span
                          key={keywordIdx}
                          className="text-xs px-2 py-1 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-500/40"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render Big Three card
  const renderBigThreeCard = (label, placement, type, bodyName) => {
    if (!placement) return null;
    const sign = getSign(placement);
    const degree = getDegree(placement);
    const interpretation = getInterpretation(type, bodyName, sign);
    const cardKey = `${bodyName.toLowerCase()}_card`;
    const isExpanded = expandedCards.has(cardKey);
    const hasInterpretation = !!interpretation;

    return (
      <div
        className={`p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm hover:shadow-neon transition-all duration-300 ${
          hasInterpretation ? "cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)]" : ""
        }`}
        onClick={() => hasInterpretation && toggleCard(cardKey)}
        role={hasInterpretation ? "button" : undefined}
        tabIndex={hasInterpretation ? 0 : undefined}
        onKeyDown={(e) => {
          if (hasInterpretation && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            toggleCard(cardKey);
          }
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-100">{bodyName}</h3>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-sm text-gray-400">Sign: </span>
            <span className="text-neon-purple font-semibold">{sign}</span>
          </div>
          {degree && (
            <div>
              <span className="text-sm text-gray-400">Degree: </span>
              <span className="text-neon-cyan font-semibold">{degree}°</span>
            </div>
          )}
        </div>

        {isExpanded && interpretation && (
          <div className="mt-4 pt-4 border-t border-gray-700/40 animate-in slide-in-from-top duration-300 space-y-4">
            {interpretation.macro && (
              <div className="space-y-3">
                {interpretation.macro.interpretation && (
                  <div>
                    <p className="text-gray-300 leading-relaxed text-base">
                      {interpretation.macro.interpretation}
                    </p>
                  </div>
                )}
                {interpretation.macro.keywords && Array.isArray(interpretation.macro.keywords) && interpretation.macro.keywords.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Themes:</p>
                    <div className="flex flex-wrap gap-2">
                      {interpretation.macro.keywords.map((keyword, keywordIdx) => (
                        <span
                          key={keywordIdx}
                          className="text-xs px-2 py-1 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-500/40"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!currentNatal) {
    return null;
  }

  return (
    <section className="min-h-screen px-4 pt-28 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Birth Chart</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Mode: <span className="text-neon-cyan font-semibold">{modeLabel}</span>
          </p>
        </div>

        {birthInfo && birthInfo.length > 0 && (
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Birth Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {birthInfo.map((item, idx) => (
                <div key={idx}>
                  <div className="text-sm text-gray-400 mb-1">{item.label}</div>
                  <div className="text-base text-gray-200 font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Big Three Section */}
        {bigThree.sun || bigThree.moon || bigThree.ascendant ? (
          <div className="mb-12 p-8 rounded-xl bg-white/5 border border-purple-500/30 backdrop-blur-sm relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-cyan-500/5 pointer-events-none"></div>
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                <span className="gradient-text">Big Three</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {renderBigThreeCard("Sun", bigThree.sun?.placement, "planet", "Sun")}
                {renderBigThreeCard("Moon", bigThree.moon?.placement, "planet", "Moon")}
                {renderBigThreeCard("Ascendant", bigThree.ascendant?.placement, "angle", "Ascendant")}
              </div>
            </div>
          </div>
        ) : null}

        {/* Remaining Placements */}
        {remainingPlacements.length > 0 && (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="gradient-text">Other Placements</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingPlacements.map((placement, idx) => renderPlacementCard(placement, idx))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

