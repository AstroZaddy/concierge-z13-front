import { useState, useEffect, useMemo } from "react";

const API_BASE_URL = "/api";

// Order of transiting bodies as specified
const TRANSITING_BODIES = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Chiron", "Uranus", "Neptune", "Pluto", "Lilith"
];

export function TransitsPage() {
  const [mounted, setMounted] = useState(false);
  const [vibesData, setVibesData] = useState(null);
  const [aspectsData, setAspectsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [interpretations, setInterpretations] = useState({}); // Key: "transiting_body-aspect-natal_body"
  const [modalAspect, setModalAspect] = useState(null); // { transiting_body, aspect, natal_body }
  const [modalVibes, setModalVibes] = useState(null); // "day" or "season"

  // Get natal longitudes from URL params
  const natalLongitudes = useMemo(() => {
    if (typeof window === "undefined") return null;
    const searchParams = new URLSearchParams(window.location.search);
    const natalLongitudesParam = searchParams.get("natal_longitudes");
    if (!natalLongitudesParam) return null;
    try {
      return JSON.parse(decodeURIComponent(natalLongitudesParam));
    } catch (e) {
      console.error("Failed to parse natal longitudes:", e);
      return null;
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch vibes data first, then aspects
  useEffect(() => {
    if (!mounted) return;

    // Check if we have natal longitudes
    if (!natalLongitudes || Object.keys(natalLongitudes).length === 0) {
      setError("No birth chart data available");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // First fetch vibes
    fetch(`${API_BASE_URL}/transits/vibes/now`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        natal_longitudes: natalLongitudes,
        orb_deg: 2.0,
        max_hits: 100,
        include_debug: false,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.detail || err.error || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        setVibesData(data);
        // Then fetch aspects
        return fetch(`${API_BASE_URL}/transits/aspects/now`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            natal_longitudes: natalLongitudes,
            orb_deg: 2.0,
            max_hits: 100,
            include_delta: true,
          }),
        });
      })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.detail || err.error || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        setAspectsData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching transits:", err);
        setError(err.message || "Failed to load transits");
        setLoading(false);
      });
  }, [mounted, natalLongitudes]);

  // Get top 3 aspects (tightest orbs) - defined early for use in useEffects
  const topThreeAspects = useMemo(() => {
    if (!aspectsData?.aspects_found) return [];
    return aspectsData.aspects_found.slice(0, 3);
  }, [aspectsData]);

  // Group aspects by transiting body - defined early for use in useEffects
  const aspectsByBody = useMemo(() => {
    if (!aspectsData?.aspects_found) return {};
    const grouped = {};
    aspectsData.aspects_found.forEach((aspect) => {
      if (!grouped[aspect.transiting_body]) {
        grouped[aspect.transiting_body] = [];
      }
      grouped[aspect.transiting_body].push(aspect);
    });
    return grouped;
  }, [aspectsData]);

  // Fetch micro interpretations for top 3 aspects
  useEffect(() => {
    if (!aspectsData?.aspects_found || topThreeAspects.length === 0) return;

    const items = topThreeAspects.map((aspect) => ({
      transiting_body: aspect.transiting_body,
      aspect: aspect.aspect,
      natal_body: aspect.natal_body,
    }));

    fetch(`${API_BASE_URL}/interpretations/transiting_to_natal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        layer: "micro",
        items: items,
        max_items: 100,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          console.error("Error fetching micro interpretations for top 3");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.results) {
          setInterpretations((prev) => {
            const newInterpretations = { ...prev };
            data.results.forEach((result) => {
              if (result.found) {
                const key = `${result.key.transiting_body}-${result.key.aspect}-${result.key.natal_body}`;
                newInterpretations[key] = {
                  micro: result.micro,
                  macro: newInterpretations[key]?.macro || null,
                };
              }
            });
            return newInterpretations;
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching micro interpretations:", err);
      });
  }, [aspectsData, topThreeAspects]);

  // Fetch both layers for all aspects
  useEffect(() => {
    if (!aspectsData?.aspects_found || aspectsData.aspects_found.length === 0) return;

    const items = aspectsData.aspects_found.map((aspect) => ({
      transiting_body: aspect.transiting_body,
      aspect: aspect.aspect,
      natal_body: aspect.natal_body,
    }));

    fetch(`${API_BASE_URL}/interpretations/transiting_to_natal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        layer: "both",
        items: items,
        max_items: 100,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          console.error("Error fetching interpretations for all aspects");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.results) {
          setInterpretations((prev) => {
            const newInterpretations = { ...prev };
            data.results.forEach((result) => {
              if (result.found) {
                const key = `${result.key.transiting_body}-${result.key.aspect}-${result.key.natal_body}`;
                newInterpretations[key] = {
                  micro: result.micro || newInterpretations[key]?.micro || null,
                  macro: result.macro || null,
                };
              }
            });
            return newInterpretations;
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching interpretations:", err);
      });
  }, [aspectsData]);

  // Toggle card expansion
  const toggleCard = (bodyName) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(bodyName)) {
      newExpanded.delete(bodyName);
    } else {
      newExpanded.add(bodyName);
    }
    setExpandedCards(newExpanded);
  };

  // Sort aspects by natal body in the same order as TRANSITING_BODIES
  const sortAspectsByNatalBody = (aspects) => {
    if (!aspects || aspects.length === 0) return [];
    
    return [...aspects].sort((a, b) => {
      const indexA = TRANSITING_BODIES.indexOf(a.natal_body);
      const indexB = TRANSITING_BODIES.indexOf(b.natal_body);
      
      // If both are in the list, sort by index
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one is in the list, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither is in the list, maintain original order
      return 0;
    });
  };

  // Get interpretation for an aspect
  const getInterpretation = (aspect) => {
    const key = `${aspect.transiting_body}-${aspect.aspect}-${aspect.natal_body}`;
    return interpretations[key] || null;
  };

  // Open modal for macro interpretation
  const openModal = (aspect, e) => {
    e.stopPropagation(); // Prevent card toggle
    setModalAspect(aspect);
  };

  // Open modal for vibes
  const openVibesModal = (type) => {
    setModalVibes(type); // "day" or "season"
  };

  // Close modal
  const closeModal = () => {
    setModalAspect(null);
    setModalVibes(null);
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && (modalAspect || modalVibes)) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalAspect, modalVibes]);

  // Format date as "Dec 20, 2025"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  if (!mounted) {
    return null; // SSR safety
  }

  // No natal chart data - show message with link back
  if (!natalLongitudes || Object.keys(natalLongitudes).length === 0) {
    return (
      <section className="min-h-screen px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Current Cosmic Vibes</span>
            </h1>
          </div>
          <div className="p-8 rounded-xl bg-white/5 border border-amber-500/30 backdrop-blur-sm text-center">
            <p className="text-xl text-gray-200 mb-4">
              A birth chart is needed for the vibe check.
            </p>
            <a
              href="/natal/create"
              className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300"
            >
              Create Birth Chart
            </a>
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
            <span className="gradient-text">Current Cosmic Vibes</span>
          </h1>
          {aspectsData?.timestamp_utc && (
            <p className="text-gray-400 text-sm md:text-base">
              As of <span className="text-neon-cyan font-semibold">
                {new Date(aspectsData.timestamp_utc).toLocaleString()}
              </span>
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading cosmic vibes...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 rounded-xl bg-red-900/20 border border-red-500/40 text-red-300">
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Celestial Snapshot */}
        {!loading && !error && vibesData && (
          <div className="mb-12 p-8 rounded-xl bg-white/5 border border-purple-500/30 backdrop-blur-sm relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-cyan-500/5 pointer-events-none"></div>
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">
                <span className="gradient-text">Celestial snapshot</span>
              </h2>
              {vibesData.timestamp_utc && (
                <p className="text-center text-gray-400 text-sm mb-6">
                  {formatDate(vibesData.timestamp_utc)}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Day Block */}
                {vibesData.vibes_of_the_day && (
                  <div className="p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-gray-100 mb-3">Day Block</h3>
                    <h4 className="text-lg font-semibold text-neon-purple mb-2">
                      {vibesData.vibes_of_the_day.headline}
                    </h4>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      {vibesData.vibes_of_the_day.summary}
                    </p>
                    {vibesData.vibes_of_the_day.themes && vibesData.vibes_of_the_day.themes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2">Themes:</p>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {vibesData.vibes_of_the_day.themes.slice(0, 2).map((theme, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-300 border border-purple-500/40"
                            >
                              {theme.name}
                            </span>
                          ))}
                          {vibesData.vibes_of_the_day.themes.length > 2 && (
                            <span className="text-xs text-gray-500">+{vibesData.vibes_of_the_day.themes.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {vibesData.vibes_of_the_day.energy_profile && (
                      <div className="mb-4">
                        <div className="h-2 rounded-full overflow-hidden bg-gray-800/50 flex">
                          {vibesData.vibes_of_the_day.energy_profile.supportive > 0 && (
                            <div
                              className="bg-green-500/60"
                              style={{ width: `${vibesData.vibes_of_the_day.energy_profile.supportive * 100}%` }}
                            ></div>
                          )}
                          {vibesData.vibes_of_the_day.energy_profile.challenging > 0 && (
                            <div
                              className="bg-red-500/60"
                              style={{ width: `${vibesData.vibes_of_the_day.energy_profile.challenging * 100}%` }}
                            ></div>
                          )}
                          {vibesData.vibes_of_the_day.energy_profile.neutral > 0 && (
                            <div
                              className="bg-gray-500/60"
                              style={{ width: `${vibesData.vibes_of_the_day.energy_profile.neutral * 100}%` }}
                            ></div>
                          )}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => openVibesModal("day")}
                      className="w-full px-4 py-2 text-sm rounded-lg font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300"
                    >
                      Say more...
                    </button>
                  </div>
                )}

                {/* Season Block */}
                {vibesData.cosmic_season && (
                  <div className="p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-gray-100 mb-3">Season Block</h3>
                    <h4 className="text-lg font-semibold text-neon-cyan mb-2">
                      {vibesData.cosmic_season.headline}
                    </h4>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                      {vibesData.cosmic_season.summary}
                    </p>
                    {vibesData.cosmic_season.themes && vibesData.cosmic_season.themes.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2">Themes:</p>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {vibesData.cosmic_season.themes.slice(0, 2).map((theme, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-500/40"
                            >
                              {theme.name}
                            </span>
                          ))}
                          {vibesData.cosmic_season.themes.length > 2 && (
                            <span className="text-xs text-gray-500">+{vibesData.cosmic_season.themes.length - 2}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {vibesData.cosmic_season.energy_profile && (
                      <div className="mb-4">
                        <div className="h-2 rounded-full overflow-hidden bg-gray-800/50 flex">
                          {vibesData.cosmic_season.energy_profile.supportive > 0 && (
                            <div
                              className="bg-green-500/60"
                              style={{ width: `${vibesData.cosmic_season.energy_profile.supportive * 100}%` }}
                            ></div>
                          )}
                          {vibesData.cosmic_season.energy_profile.challenging > 0 && (
                            <div
                              className="bg-red-500/60"
                              style={{ width: `${vibesData.cosmic_season.energy_profile.challenging * 100}%` }}
                            ></div>
                          )}
                          {vibesData.cosmic_season.energy_profile.neutral > 0 && (
                            <div
                              className="bg-gray-500/60"
                              style={{ width: `${vibesData.cosmic_season.energy_profile.neutral * 100}%` }}
                            ></div>
                          )}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => openVibesModal("season")}
                      className="w-full px-4 py-2 text-sm rounded-lg font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300"
                    >
                      Say more...
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Three Biggest Active Energies */}
        {!loading && !error && topThreeAspects.length > 0 && (
          <div className="mb-12 p-8 rounded-xl bg-white/5 border border-purple-500/30 backdrop-blur-sm relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-cyan-500/5 pointer-events-none"></div>
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                <span className="gradient-text">Three Biggest Active Energies</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topThreeAspects.map((aspect, idx) => {
                  const interpretation = getInterpretation(aspect);
                  const micro = interpretation?.micro;

                  return (
                    <div
                      key={`${aspect.transiting_body}-${aspect.natal_body}-${idx}`}
                      className="p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-100">
                          {aspect.transiting_body} {aspect.aspect} {aspect.natal_body}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-400">Orb: </span>
                          <span className="text-neon-cyan font-semibold">
                            {aspect.delta_from_exact_deg.toFixed(2)}°
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Separation: </span>
                          <span className="text-neon-purple font-semibold">
                            {aspect.separation_deg.toFixed(2)}°
                          </span>
                        </div>
                        {micro && (
                          <div className="mt-3 pt-3 border-t border-gray-700/40 space-y-2">
                            {micro.keywords && micro.keywords.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1.5">Keywords:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {micro.keywords.slice(0, 3).map((keyword, kIdx) => (
                                    <span
                                      key={kIdx}
                                      className="text-xs px-2 py-1 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-500/40"
                                    >
                                      {keyword}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {micro.themes && micro.themes.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1.5">Themes:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {micro.themes.slice(0, 3).map((theme, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-300 border border-purple-500/40"
                                    >
                                      {theme}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Active Energies Section */}
        {!loading && !error && (
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="gradient-text">Active Energies</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TRANSITING_BODIES.map((bodyName) => {
                const bodyAspects = aspectsByBody[bodyName] || [];
                const hasAspects = bodyAspects.length > 0;
                const isExpanded = expandedCards.has(bodyName);

                return (
                  <div
                    key={bodyName}
                    className={`p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm transition-all duration-300 ${
                      hasAspects ? "cursor-pointer shadow-neon" : ""
                    }`}
                    onClick={() => hasAspects && toggleCard(bodyName)}
                    role={hasAspects ? "button" : undefined}
                    tabIndex={hasAspects ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (hasAspects && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        toggleCard(bodyName);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-100">{bodyName}</h3>
                    </div>

                    {!hasAspects ? (
                      <p className="text-sm text-gray-400">No current aspects</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-300 mb-2">
                          {bodyAspects.length} aspect{bodyAspects.length !== 1 ? "s" : ""} formed - tap/click for details
                        </p>
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-700/40 animate-in slide-in-from-top duration-300 space-y-3">
                            {sortAspectsByNatalBody(bodyAspects).map((aspect, idx) => {
                              const interpretation = getInterpretation(aspect);
                              const micro = interpretation?.micro;
                              const macro = interpretation?.macro;
                              const hasMacro = macro !== null && macro !== undefined;

                              return (
                                <div
                                  key={`${aspect.transiting_body}-${aspect.natal_body}-${idx}`}
                                  className="p-3 rounded-lg bg-white/5 border border-gray-700/30"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-neon-purple">
                                      {aspect.natal_body}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-500/40 capitalize">
                                      {aspect.aspect}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                                    <span>Orb: {aspect.delta_from_exact_deg.toFixed(2)}°</span>
                                    <span>Sep: {aspect.separation_deg.toFixed(2)}°</span>
                                  </div>
                                  {micro && (
                                    <div className="space-y-2">
                                      {micro.keywords && micro.keywords.length > 0 && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1.5">Keywords:</p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {micro.keywords.slice(0, 3).map((keyword, kIdx) => (
                                              <span
                                                key={kIdx}
                                                className="text-xs px-2 py-1 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-500/40"
                                              >
                                                {keyword}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {micro.themes && micro.themes.length > 0 && (
                                        <div>
                                          <p className="text-xs text-gray-400 mb-1.5">Themes:</p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {micro.themes.slice(0, 3).map((theme, tIdx) => (
                                              <span
                                                key={tIdx}
                                                className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-300 border border-purple-500/40"
                                              >
                                                {theme}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {micro.timeframe && (
                                        <p className="text-xs text-gray-500 italic">
                                          {micro.timeframe}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {hasMacro && (
                                    <button
                                      onClick={(e) => openModal(aspect, e)}
                                      className="mt-3 w-full px-4 py-2 text-sm rounded-lg font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300"
                                    >
                                      Say more...
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal for Macro Interpretations */}
      {modalAspect && (() => {
        const interpretation = getInterpretation(modalAspect);
        const macro = interpretation?.macro;
        const micro = interpretation?.micro;

        if (!macro) return null;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          >
            <div
              className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl bg-[#0a0a12] border border-purple-500/30 p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Modal Header */}
              <div className="mb-6 pr-8">
                <h3 className="text-2xl font-bold text-gray-100 mb-2">
                  <span className="text-neon-purple">{modalAspect.transiting_body}</span>{" "}
                  <span className="text-gray-400 capitalize">{modalAspect.aspect}</span>{" "}
                  <span className="text-neon-cyan">{modalAspect.natal_body}</span>
                </h3>
              </div>

              {/* Overview */}
              {macro.overview && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Overview</h4>
                  <p className="text-gray-300 leading-relaxed">{macro.overview}</p>
                </div>
              )}

              {/* Keywords and Themes */}
              {micro && (
                <div className="mb-6 space-y-4">
                  {micro.keywords && micro.keywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {micro.keywords.map((keyword, kIdx) => (
                          <span
                            key={kIdx}
                            className="text-sm px-3 py-1.5 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-500/40"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {micro.themes && micro.themes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Themes</h4>
                      <div className="flex flex-wrap gap-2">
                        {micro.themes.map((theme, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-sm px-3 py-1.5 rounded bg-purple-900/30 text-purple-300 border border-purple-500/40"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions */}
              {macro.suggestions && macro.suggestions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Suggestions</h4>
                  <ul className="space-y-2">
                    {macro.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-gray-300 leading-relaxed flex items-start">
                        <span className="text-neon-cyan mr-2">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Precautions */}
              {macro.precautions && macro.precautions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Precautions</h4>
                  <ul className="space-y-2">
                    {macro.precautions.map((precaution, idx) => (
                      <li key={idx} className="text-gray-300 leading-relaxed flex items-start">
                        <span className="text-amber-400 mr-2">⚠</span>
                        <span>{precaution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeframe */}
              {macro.timeframe && (
                <div className="pt-4 border-t border-gray-700/40">
                  <p className="text-sm text-gray-500 italic">{macro.timeframe}</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal for Vibes Details */}
      {modalVibes && vibesData && (() => {
        const vibesBlock = modalVibes === "day" ? vibesData.vibes_of_the_day : vibesData.cosmic_season;
        if (!vibesBlock) return null;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          >
            <div
              className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl bg-[#0a0a12] border border-purple-500/30 p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Modal Header */}
              <div className="mb-6 pr-8">
                <h3 className="text-2xl font-bold text-gray-100 mb-2">
                  {modalVibes === "day" ? "Day Block" : "Season Block"}
                </h3>
                <h4 className="text-xl font-semibold text-gray-200">
                  {vibesBlock.headline}
                </h4>
              </div>

              {/* Summary */}
              {vibesBlock.summary && (
                <div className="mb-6">
                  <p className="text-gray-300 leading-relaxed">{vibesBlock.summary}</p>
                </div>
              )}

              {/* Anchors */}
              {vibesBlock.anchors && vibesBlock.anchors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Anchors</h4>
                  <div className="space-y-2">
                    {vibesBlock.anchors.map((anchor, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white/5 border border-gray-700/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">
                            <span className="text-neon-purple font-semibold">{anchor.transiting_body}</span>{" "}
                            <span className="text-gray-400 capitalize">{anchor.aspect}</span>{" "}
                            <span className="text-neon-cyan font-semibold">{anchor.natal_body}</span>
                          </span>
                          <span className="text-xs text-gray-400">
                            Orb: {anchor.delta_from_exact_deg.toFixed(2)}°
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Energy Balance */}
              {vibesBlock.energy_profile && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Energy Balance</h4>
                  {/* Visual stacked bar */}
                  <div className="mb-3 h-6 rounded-full overflow-hidden bg-gray-800/50 flex">
                    {vibesBlock.energy_profile.supportive > 0 && (
                      <div
                        className="bg-green-500/60"
                        style={{ width: `${vibesBlock.energy_profile.supportive * 100}%` }}
                      ></div>
                    )}
                    {vibesBlock.energy_profile.challenging > 0 && (
                      <div
                        className="bg-red-500/60"
                        style={{ width: `${vibesBlock.energy_profile.challenging * 100}%` }}
                      ></div>
                    )}
                    {vibesBlock.energy_profile.neutral > 0 && (
                      <div
                        className="bg-gray-500/60"
                        style={{ width: `${vibesBlock.energy_profile.neutral * 100}%` }}
                      ></div>
                    )}
                  </div>
                  {/* Numbers */}
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Supportive: </span>
                      <span className="text-green-400 font-semibold">
                        {(vibesBlock.energy_profile.supportive * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Challenging: </span>
                      <span className="text-red-400 font-semibold">
                        {(vibesBlock.energy_profile.challenging * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Neutral: </span>
                      <span className="text-gray-400 font-semibold">
                        {(vibesBlock.energy_profile.neutral * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Keywords */}
              {vibesBlock.keywords && vibesBlock.keywords.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {vibesBlock.keywords.map((keyword, kIdx) => (
                      <span
                        key={kIdx}
                        className="text-sm px-3 py-1.5 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-500/40"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Themes */}
              {vibesBlock.themes && vibesBlock.themes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {vibesBlock.themes.map((theme, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-sm px-3 py-1.5 rounded bg-purple-900/30 text-purple-300 border border-purple-500/40"
                      >
                        {theme.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </section>
  );
}

