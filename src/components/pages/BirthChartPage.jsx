import { useState, useEffect, useRef, useMemo } from "react";
import { NeonButton } from "../ui/NeonButton";

// Use relative /api path for client-side calls (works through Caddy proxy)
const API_BASE_URL = "/api";
const STORAGE_KEY = "z13-zodiac-mode";

export function BirthChartPage() {
  // Zodiac mode state - sync with global toggle
  const [mode, setModeState] = useState("z13");
  const [mounted, setMounted] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Chart data state
  const [natalZ13, setNatalZ13] = useState(null);
  const [natalTropical, setNatalTropical] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Interpretations state
  const [interpretations, setInterpretations] = useState({});
  const [loadingInterpretations, setLoadingInterpretations] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());

  // Debounce timer for location search
  const locationSearchTimeoutRef = useRef(null);

  // Initialize mode from localStorage and listen for changes
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

  // Location search with debouncing
  useEffect(() => {
    if (locationInput.length < 2 || selectedLocation) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (locationSearchTimeoutRef.current) {
      clearTimeout(locationSearchTimeoutRef.current);
    }

    locationSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const url = `${API_BASE_URL}/location/search?q=${encodeURIComponent(locationInput)}&limit=10`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setLocationSuggestions(data.results || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Error searching locations:", err);
      }
    }, 300);

    return () => {
      if (locationSearchTimeoutRef.current) {
        clearTimeout(locationSearchTimeoutRef.current);
      }
    };
  }, [locationInput, selectedLocation]);

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

  // Get remaining placements (excluding Big Three and other chart angles)
  const remainingPlacements = useMemo(() => {
    if (!currentNatal) return [];
    const bigThreeBodies = new Set(["Sun", "Moon"]);
    const excludedAngles = new Set(["ASC", "DSC", "MC", "IC"]);
    const positions = currentNatal.positions?.filter((p) => !bigThreeBodies.has(p.body)) || [];
    const angles = currentNatal.angles?.filter((a) => !excludedAngles.has(a.angle)) || [];
    return [...positions, ...angles];
  }, [currentNatal]);

  // Build natal longitudes for transits API
  const natalLongitudes = useMemo(() => {
    if (!currentNatal?.positions) return null;
    
    const validBodies = [
      "Sun", "Moon", "Mercury", "Venus", "Mars",
      "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
      "Chiron", "Lilith"
    ];
    
    const longitudes = {};
    currentNatal.positions.forEach(position => {
      if (validBodies.includes(position.body) && position.longitude !== undefined) {
        longitudes[position.body] = position.longitude;
      }
    });
    
    return Object.keys(longitudes).length > 0 ? longitudes : null;
  }, [currentNatal]);

  // Fetch interpretations for Big Three and remaining placements
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
      
      // Extract sign from placement (inline version of getSign)
      const sign = placementData?.sign || placementData?.label?.split(" ")[0] || "";
      if (!sign) return;

      const signSlug = sign.toLowerCase().replace(/\s+/g, "_");
      const bodySlug = label.toLowerCase().replace(/\s+/g, "_");
      
      // Check if it's a node (North Node or South Node)
      const isNode = placement.body && (
        label.toLowerCase().includes("north node") || 
        label.toLowerCase().includes("south node") ||
        label === "NN" || 
        label === "SN" ||
        label === "North Node" ||
        label === "South Node"
      );
      
      let category, slug;
      
      if (isNode) {
        // Nodes use node_in_sign category
        category = "node_in_sign";
        // Determine if it's North Node (nn) or South Node (sn)
        const isNorthNode = label.toLowerCase().includes("north") || label === "NN" || label === "North Node";
        const nodePrefix = isNorthNode ? "nn" : "sn";
        slug = `${nodePrefix}_in_${signSlug}`;
      } else {
        // Determine if it's a planet or angle
        const isPlanet = !!placement.body;
        category = isPlanet ? "planet_in_sign" : "angle_in_sign";
        
        // Build slug - for angles, use "asc_in_" pattern, for planets use "{planet}_in_{sign}"
        slug = isPlanet 
          ? `${bodySlug}_in_${signSlug}`
          : `asc_in_${signSlug}`; // Note: API might need different pattern for other angles
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
        // Fetch full interpretation (not micro or macro only)
        fetch(`${API_BASE_URL}/interpretations/${category}/${slug}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              console.log(`Fetched interpretation for ${key}:`, data); // Debug log
            }
            return { key, data };
          })
          .catch((err) => {
            console.error(`Error fetching ${key}:`, err);
            return { key, data: null };
          })
      )
    ).then((results) => {
      const newInterpretations = { ...interpretations };
      results.forEach(({ key, data }) => {
        if (data) {
          console.log(`Interpretation loaded for ${key}:`, data); // Debug log
          newInterpretations[key] = data;
        }
      });
      setInterpretations(newInterpretations);
      setLoadingInterpretations(false);
    });
  }, [currentNatal, bigThree, remainingPlacements, interpretations]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setNatalZ13(null);
    setNatalTropical(null);
    setInterpretations({});
    setExpandedCards(new Set());

    if (!selectedLocation && !locationInput) {
      setError("Please select a birth location");
      setLoading(false);
      return;
    }

    try {
      // Build datetime string - ensure proper ISO-8601 format
      let datetimeStr = birthDate;
      if (birthTime && !timeUnknown) {
        // Time input gives HH:MM format (e.g., "14:30")
        // Ensure it has seconds for proper ISO-8601: "HH:mm:ss"
        let timePart = birthTime.trim();
        if (timePart.match(/^\d{2}:\d{2}$/)) {
          // Format: HH:MM, add seconds
          timePart = `${timePart}:00`;
        } else if (!timePart.match(/^\d{2}:\d{2}:\d{2}$/)) {
          // Invalid format, default to noon
          timePart = "12:00:00";
        }
        datetimeStr += `T${timePart}`;
      } else {
        datetimeStr += "T12:00:00"; // Default to noon if time unknown (with seconds)
      }
      
      // The API expects ISO-8601 format (YYYY-MM-DDTHH:mm:ss)
      // When location.timezone is provided, the API interprets the datetime as local time
      // in that timezone and converts to UTC internally
      
      console.log("Submitting datetime:", datetimeStr); // Debug log

      // Prepare request body
      // Use mode="z13" with return_both_systems to get both systems
      // The /natal endpoint doesn't support mode="both", only mode="z13" or "tropical"
      const requestBody = {
        datetime: datetimeStr,
        mode: "z13",
        return_both_systems: true,
      };

      // Add location
      if (selectedLocation) {
        requestBody.location = {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          timezone: selectedLocation.timezone,
        };
      } else {
        // Try using city name
        requestBody.city = locationInput;
      }

      console.log("Request body:", JSON.stringify(requestBody, null, 2)); // Debug log

      const response = await fetch(`${API_BASE_URL}/natal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // If mode="both" fails, try with mode="z13" and return_both_systems
        // FastAPI validation errors come as 422, so check both 400 and 422
        if (requestBody.mode === "both" && (response.status === 400 || response.status === 422)) {
          const errorData = await response.json().catch(() => ({}));
          
          // Check if error is about mode
          let isModeError = false;
          if (Array.isArray(errorData.detail)) {
            isModeError = errorData.detail.some(err => {
              const msg = typeof err === "string" ? err : err.msg || "";
              const loc = Array.isArray(err.loc) ? err.loc.join(".") : "";
              return msg.toLowerCase().includes("mode") || 
                     msg.toLowerCase().includes("both") ||
                     loc.toLowerCase().includes("mode");
            });
          } else {
            const errorMsg = typeof errorData.detail === "string" 
              ? errorData.detail 
              : errorData.detail?.error || JSON.stringify(errorData.detail);
            isModeError = errorMsg.toLowerCase().includes("mode") || 
                         errorMsg.toLowerCase().includes("both");
          }
          
          if (isModeError) {
            // Fallback to documented approach
            requestBody.mode = "z13";
            const retryResponse = await fetch(`${API_BASE_URL}/natal`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json().catch(() => ({}));
              throw new Error(retryErrorData.detail?.error || retryErrorData.detail || `HTTP error! status: ${retryResponse.status}`);
            }
            
            const retryData = await retryResponse.json();
            
            // Split data into Z13 and Tropical when return_both_systems is true
            if (retryData.positions?.[0]?.placement_alt || retryData.angles?.[0]?.placement_alt) {
              const z13Data = {
                ...retryData,
                positions: retryData.positions?.map((p) => ({
                  ...p,
                  placement: p.placement,
                  placement_alt: null,
                })),
                angles: retryData.angles?.map((a) => ({
                  ...a,
                  placement: a.placement,
                  placement_alt: null,
                })),
                metadata: { ...retryData.metadata, mode: "z13" },
              };

              const tropicalData = {
                ...retryData,
                positions: retryData.positions?.map((p) => ({
                  ...p,
                  placement: p.placement_alt || p.placement,
                  placement_alt: null,
                })),
                angles: retryData.angles?.map((a) => ({
                  ...a,
                  placement: a.placement_alt || a.placement,
                  placement_alt: null,
                })),
                metadata: { ...retryData.metadata, mode: "tropical" },
              };

              setNatalZ13(z13Data);
              setNatalTropical(tropicalData);
            } else {
              if (retryData.metadata?.mode === "tropical") {
                setNatalTropical(retryData);
              } else {
                setNatalZ13(retryData);
              }
            }
            
            setLoading(false);
            return;
          }
        }
        
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData); // Debug log
        
        // Handle FastAPI validation errors (array format)
        let errorMessage;
        if (Array.isArray(errorData.detail)) {
          // Format validation errors nicely
          errorMessage = errorData.detail
            .map((err) => {
              if (typeof err === "string") return err;
              if (err.msg) return `${err.loc?.join(".") || "field"}: ${err.msg}`;
              return JSON.stringify(err);
            })
            .join("; ");
        } else if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (errorData.detail?.error) {
          errorMessage = errorData.detail.error;
        } else if (errorData.detail) {
          errorMessage = JSON.stringify(errorData.detail);
        } else {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Handle case where API returns separate arrays (like positions_z13/positions_tropical)
      if (data.positions_z13 && data.positions_tropical) {
        const z13Data = {
          ...data,
          positions: data.positions_z13,
          angles: data.angles_z13 || data.angles,
          metadata: { ...data.metadata, mode: "z13" },
        };
        const tropicalData = {
          ...data,
          positions: data.positions_tropical,
          angles: data.angles_tropical || data.angles,
          metadata: { ...data.metadata, mode: "tropical" },
        };
        setNatalZ13(z13Data);
        setNatalTropical(tropicalData);
        setLoading(false);
        return;
      }
      
      // Split data into Z13 and Tropical when return_both_systems is true
      // When mode="z13" and return_both_systems=true, placement is Z13 and placement_alt is Tropical
      if (data.positions?.[0]?.placement_alt || data.angles?.[0]?.placement_alt) {
        // Both systems returned - split them
        const z13Data = {
          ...data,
          positions: data.positions?.map((p) => ({
            ...p,
            placement: p.placement,
            placement_alt: null,
          })),
          angles: data.angles?.map((a) => ({
            ...a,
            placement: a.placement,
            placement_alt: null,
          })),
          metadata: { ...data.metadata, mode: "z13" },
        };

        const tropicalData = {
          ...data,
          positions: data.positions?.map((p) => ({
            ...p,
            placement: p.placement_alt || p.placement,
            placement_alt: null,
          })),
          angles: data.angles?.map((a) => ({
            ...a,
            placement: a.placement_alt || a.placement,
            placement_alt: null,
          })),
          metadata: { ...data.metadata, mode: "tropical" },
        };

        setNatalZ13(z13Data);
        setNatalTropical(tropicalData);
      } else {
        // Single system response - assign based on metadata.mode
        if (data.metadata?.mode === "tropical") {
          setNatalTropical(data);
        } else {
          setNatalZ13(data);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching natal chart:", err);
      setError(err.message || "Failed to load birth chart");
      setLoading(false);
    }
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

  // Get interpretation for a placement
  const getInterpretation = (type, bodyOrAngle, sign) => {
    if (!sign) return null;
    const slug = sign.toLowerCase().replace(/\s+/g, "_");
    const bodySlug = bodyOrAngle.toLowerCase().replace(/\s+/g, "_");
    
    // Check if it's a node (either by type parameter or by name detection)
    const isNode = type === "node" || (bodyOrAngle && (
      bodyOrAngle.toLowerCase().includes("north node") || 
      bodyOrAngle.toLowerCase().includes("south node") ||
      bodyOrAngle === "NN" || 
      bodyOrAngle === "SN" ||
      bodyOrAngle === "North Node" ||
      bodyOrAngle === "South Node"
    ));
    
    let category, interpretationSlug;
    
    if (isNode) {
      category = "node_in_sign";
      const isNorthNode = bodyOrAngle.toLowerCase().includes("north") || bodyOrAngle === "NN" || bodyOrAngle === "North Node";
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

  // Extract sign from placement
  const getSign = (placement) => {
    return placement?.sign || placement?.label?.split(" ")[0] || "";
  };

  // Extract degree from placement
  const getDegree = (placement) => {
    if (placement?.sign_degree !== undefined) {
      return placement.sign_degree.toFixed(2);
    }
    const match = placement?.label?.match(/\(([\d.]+)°\)/);
    return match ? parseFloat(match[1]).toFixed(2) : null;
  };

  // Render Big Three card
  const renderBigThreeCard = (label, placement, type, bodyName) => {
    const sign = getSign(placement);
    const degree = getDegree(placement);
    const interpretation = getInterpretation(type, bodyName, sign);
    const cardKey = `${bodyName.toLowerCase()}_card`;
    const isExpanded = expandedCards.has(cardKey);
    const hasInterpretation = !!interpretation;
    
    // Debug: log interpretation data when expanded
    if (isExpanded && interpretation) {
      console.log(`${bodyName} interpretation data:`, interpretation);
      console.log(`${bodyName} macro:`, interpretation.macro);
      console.log(`${bodyName} macro keys:`, interpretation.macro ? Object.keys(interpretation.macro) : 'no macro');
      console.log(`${bodyName} macro.description:`, interpretation.macro?.description);
      console.log(`${bodyName} macro.themes:`, interpretation.macro?.themes);
      // Log the full macro object structure
      if (interpretation.macro) {
        console.log(`${bodyName} full macro object:`, JSON.stringify(interpretation.macro, null, 2));
      }
    }

    if (!placement && bodyName === "Ascendant") {
      // Special handling for missing Ascendant
      return (
        <div
          className="p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm opacity-75"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-300">Ascendant</h3>
            <span className="text-xs px-2 py-1 rounded bg-amber-900/30 text-amber-300 border border-amber-500/40">
              Incomplete
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            More precise birth time helps reveal how you meet the world. With an accurate time, we can calculate your Ascendant and deepen your self-understanding.
          </p>
        </div>
      );
    }

    if (!placement) return null;

    return (
      <div
        className={`p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm transition-all duration-300 ${
          hasInterpretation ? "cursor-pointer shadow-neon" : ""
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
            {/* Macro Interpretation - always show first if available */}
            {interpretation.macro && (
              <div className="space-y-3">
                {/* Macro interpretation text */}
                {interpretation.macro.interpretation && (
                  <div>
                    <p className="text-gray-300 leading-relaxed text-base">
                      {interpretation.macro.interpretation}
                    </p>
                  </div>
                )}
                {/* Macro keywords as themes */}
                {interpretation.macro.keywords && Array.isArray(interpretation.macro.keywords) && interpretation.macro.keywords.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Themes:</p>
                    <div className="flex flex-wrap gap-2">
                      {interpretation.macro.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
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
            {/* Micro Keywords */}
            {/* {interpretation.micro?.keywords && interpretation.micro.keywords.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {interpretation.micro.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-300 border border-purple-500/40"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        )}
      </div>
    );
  };

  // Render placement card for remaining placements
  const renderPlacementCard = (placement, idx) => {
    const label = placement.body || placement.angle;
    const sign = getSign(placement.placement);
    const degree = getDegree(placement.placement);
    
    // Check if it's a node
    const isNode = placement.body && (
      label.toLowerCase().includes("north node") || 
      label.toLowerCase().includes("south node") ||
      label === "NN" || 
      label === "SN" ||
      label === "North Node" ||
      label === "South Node"
    );
    
    // Determine if it's a planet, angle, or node
    const isPlanet = !!placement.body && !isNode;
    const type = isNode ? "node" : (isPlanet ? "planet" : "angle");
    
    const interpretation = getInterpretation(type, label, sign);
    const cardKey = `placement_${label.toLowerCase()}_${idx}`;
    const isExpanded = expandedCards.has(cardKey);
    const hasInterpretation = !!interpretation;

    return (
      <div
        key={`${label}-${idx}`}
        className={`p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm transition-all duration-300 ${
          hasInterpretation ? "cursor-pointer shadow-neon" : ""
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
            {/* Macro Interpretation - always show first if available */}
            {interpretation.macro && (
              <div className="space-y-3">
                {/* Macro interpretation text */}
                {interpretation.macro.interpretation && (
                  <div>
                    <p className="text-gray-300 leading-relaxed text-base">
                      {interpretation.macro.interpretation}
                    </p>
                  </div>
                )}
                {/* Macro keywords as themes */}
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

  if (!mounted) {
    return null; // SSR safety
  }

  const modeLabel = mode === "z13" ? "Z13 (true-sky)" : "Tropical";
  const allInterpretationsLoaded =
    bigThree.sun && getInterpretation("planet", "Sun", getSign(bigThree.sun.placement)) &&
    bigThree.moon && getInterpretation("planet", "Moon", getSign(bigThree.moon.placement)) &&
    bigThree.ascendant && getInterpretation("angle", "Ascendant", getSign(bigThree.ascendant.placement));

  return (
    <section className="min-h-screen px-4 py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Birth Chart</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Mode: <span className="text-neon-cyan font-semibold">{modeLabel}</span>
          </p>
        </div>

        {/* Birth Data Form */}
        <form onSubmit={handleSubmit} className="mb-12 p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
                placeholder="Your name"
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Birth Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
              />
            </div>

            {/* Birth Time */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Birth Time
              </label>
              <div className="flex gap-3">
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Ensure we store a valid time value (HH:MM format)
                    if (!value || /^\d{2}:\d{2}$/.test(value)) {
                      setBirthTime(value);
                    }
                  }}
                  disabled={timeUnknown}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timeUnknown}
                    onChange={(e) => {
                      setTimeUnknown(e.target.checked);
                      if (e.target.checked) setBirthTime("");
                    }}
                    className="rounded"
                  />
                  Time unknown
                </label>
              </div>
            </div>

            {/* Birth Location */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Birth Location <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={selectedLocation ? `${selectedLocation.city}${selectedLocation.region ? `, ${selectedLocation.region}` : ""}${selectedLocation.country ? `, ${selectedLocation.country}` : ""}` : locationInput}
                onChange={(e) => {
                  setLocationInput(e.target.value);
                  setSelectedLocation(null);
                }}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowSuggestions(true);
                }}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
                placeholder="City, Country"
              />
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#0a0a12] border border-gray-700/40 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {locationSuggestions.map((loc, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(loc);
                        setLocationInput("");
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 text-gray-200 transition"
                    >
                      <div className="font-medium">{loc.city}</div>
                      {loc.region && loc.country && (
                        <div className="text-sm text-gray-400">
                          {loc.region}, {loc.country}
                        </div>
                      )}
                      {!loc.region && loc.country && (
                        <div className="text-sm text-gray-400">{loc.country}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-full font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Calculating..." : "Generate Chart"}
            </button>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 rounded-xl bg-red-900/20 border border-red-500/40 text-red-300">
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Big Three Section */}
        {currentNatal && (bigThree.sun || bigThree.moon || bigThree.ascendant) && (
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
              {allInterpretationsLoaded && (
                <p className="text-center text-sm text-gray-400 mt-4" style={{ textShadow: "0 0 10px rgba(168, 85, 247, 0.5)" }}>
                  Tap cards for more details
                </p>
              )}
            </div>
          </div>
        )}

        {/* Personalized cosmic vibes button */}
        {currentNatal && (bigThree.sun || bigThree.moon || bigThree.ascendant) && natalLongitudes && (
          <div className="mb-12 flex justify-center">
            <NeonButton 
              href={`/natal/transits?natal_longitudes=${encodeURIComponent(JSON.stringify(natalLongitudes))}`}
              className="text-lg px-8 py-4"
            >
              Personalized cosmic vibes
            </NeonButton>
          </div>
        )}

        {/* Remaining Placements */}
        {currentNatal && remainingPlacements.length > 0 && (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="gradient-text">Other Placements</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingPlacements.map((placement, idx) => renderPlacementCard(placement, idx))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentNatal && !loading && !error && (
          <div className="text-center text-gray-400 py-12">
            <p>Enter your birth information above to generate your natal chart.</p>
          </div>
        )}
      </div>
    </section>
  );
}
