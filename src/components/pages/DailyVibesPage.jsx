import { useState, useEffect, useMemo } from "react";
import { useUserData } from "../../contexts/UserDataContext";
import { getCachedQueryData, getCachedQueryState, subscribeToQueryData } from "../../utils/queryClient";
import { bootstrapQueryKeys } from "../../contexts/SessionBootstrapContext";
import { API_BASE_URL } from "../../utils/constants";
import { useMounted } from "../../hooks/useMounted";
import { formatCalculatedOn, formatBirthInfo } from "../../utils/dateFormatters";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";

// Order of transiting bodies as specified
const TRANSITING_BODIES = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Chiron", "Uranus", "Neptune", "Pluto", "Lilith"
];

export function DailyVibesPage() {
  const mounted = useMounted();
  const [vibesData, setVibesData] = useState(null);
  const [aspectsData, setAspectsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interpretations, setInterpretations] = useState({});
  const [modalVibes, setModalVibes] = useState(null);

  // Use user data from context
  const { isAuthenticated, defaultNatal: natalData } = useUserData();
  
  // Try to get preloaded default chart and vibes from cache
  const defaultChartQueryKey = bootstrapQueryKeys.charts.default();
  const cachedDefaultChart = getCachedQueryData(defaultChartQueryKey);
  const cachedDefaultChartState = getCachedQueryState(defaultChartQueryKey);
  
  // Get vibes cache key (need chartId and date)
  const [vibesChartId, setVibesChartId] = useState(null);
  const vibesQueryKey = vibesChartId ? bootstrapQueryKeys.transits.vibesNow(vibesChartId, new Date().toISOString().split('T')[0]) : null;
  const cachedVibes = vibesQueryKey ? getCachedQueryData(vibesQueryKey) : null;
  const cachedVibesState = vibesQueryKey ? getCachedQueryState(vibesQueryKey) : null;

  // Subscribe to default chart cache updates
  useEffect(() => {
    if (!mounted) return;
    
    const unsubscribe = subscribeToQueryData(defaultChartQueryKey, (data) => {
      if (data?.chart?.meta?.id) {
        setVibesChartId(data.chart.meta.id);
      }
    });
    
    // If we have cached chart, extract chart ID
    if (cachedDefaultChart?.chart?.meta?.id) {
      setVibesChartId(cachedDefaultChart.chart.meta.id);
    }
    
    return unsubscribe;
  }, [mounted, defaultChartQueryKey, cachedDefaultChart]);

  // Subscribe to vibes cache updates
  useEffect(() => {
    if (!mounted || !vibesQueryKey) return;
    
    const unsubscribe = subscribeToQueryData(vibesQueryKey, (data) => {
      if (data) {
        setVibesData(data);
        setLoading(false);
        setError(null);
      }
    });
    
    // If we have cached vibes, use it immediately
    if (cachedVibes) {
      setVibesData(cachedVibes);
      setLoading(cachedVibesState?.isLoading || false);
      setError(cachedVibesState?.error || null);
    }
    
    return unsubscribe;
  }, [mounted, vibesQueryKey, cachedVibes, cachedVibesState]);

  // Fetch chart data when natal data is available (only if not in cache)
  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated) {
      setError("Please log in to view your daily vibes");
      setLoading(false);
      return;
    }

    if (!natalData) {
      setError("No birth chart found. Please create a birth chart first.");
      setLoading(false);
      return;
    }

    // If we have cached chart, use it
    if (cachedDefaultChart?.chart) {
      const chart = cachedDefaultChart.chart;
        
        if (!chart || !chart.computed || !chart.computed.positions) {
          throw new Error("Invalid chart data received");
        }
        
        // Extract natal longitudes from chart computed positions
        const natalLongitudes = {};
        chart.computed.positions.forEach((pos) => {
          // Only extract bodies and points (not angles for longitudes dict)
          if ((pos.kind === "body" || pos.kind === "point") && pos.key && pos.lon_deg !== undefined) {
            natalLongitudes[pos.key] = pos.lon_deg;
            }
          });
        
        // Add angles if needed
        chart.computed.positions.forEach((pos) => {
          if (pos.kind === "angle" && pos.key && pos.lon_deg !== undefined) {
              // Map angle names to body names if needed
              const angleMap = {
                ASC: "ASC",
                DSC: "DSC",
                MC: "MC",
                IC: "IC",
              };
            if (angleMap[pos.key]) {
              natalLongitudes[angleMap[pos.key]] = pos.lon_deg;
              }
            }
          });

        if (Object.keys(natalLongitudes).length === 0) {
          throw new Error("No natal longitudes found in chart");
        }

        // Fetch vibes data
        const vibesResponse = await fetch(`${API_BASE_URL}/transits/vibes/now`, {
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
        });

        if (!vibesResponse.ok) {
          throw new Error("Failed to fetch vibes data");
        }

        const vibes = await vibesResponse.json();
        setVibesData(vibes);

        // Fetch aspects data
        const aspectsResponse = await fetch(`${API_BASE_URL}/transits/aspects/now`, {
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

        if (!aspectsResponse.ok) {
          throw new Error("Failed to fetch aspects data");
        }

        const aspects = await aspectsResponse.json();
        setAspectsData(aspects);

        // Fetch interpretations for top 3 aspects first
        if (aspects.aspects && aspects.aspects.length > 0) {
          const topThree = [...aspects.aspects]
            .sort((a, b) => a.delta_from_exact_deg - b.delta_from_exact_deg)
            .slice(0, 3);

          const interpretationRequests = topThree.map((aspect) =>
            fetch(`${API_BASE_URL}/interpretations/transiting_to_natal`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                transiting_body: aspect.transiting_body,
                aspect: aspect.aspect,
                natal_body: aspect.natal_body,
                layers: ["micro"],
              }),
            })
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => ({
                key: `${aspect.transiting_body}-${aspect.aspect}-${aspect.natal_body}`,
                data,
              }))
              .catch(() => ({
                key: `${aspect.transiting_body}-${aspect.aspect}-${aspect.natal_body}`,
                data: null,
              }))
          );

          Promise.all(interpretationRequests).then((results) => {
            setInterpretations((prev) => {
              const newInterpretations = { ...prev };
              results.forEach(({ key, data }) => {
                if (data?.micro) {
                  newInterpretations[key] = {
                    ...newInterpretations[key],
                    micro: data.micro,
                  };
                }
              });
              return newInterpretations;
            });
          });
        }
      } catch (err) {
        console.error("Error fetching daily vibes:", err);
        setError(err.message || "Failed to load daily vibes");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted]);

  // Fetch all interpretations after aspects are loaded
  useEffect(() => {
    if (!aspectsData?.aspects || aspectsData.aspects.length === 0) return;

    const allAspects = aspectsData.aspects;
    const interpretationRequests = allAspects.map((aspect) =>
      fetch(`${API_BASE_URL}/interpretations/transiting_to_natal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transiting_body: aspect.transiting_body,
          aspect: aspect.aspect,
          natal_body: aspect.natal_body,
          layers: ["micro", "macro"],
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => ({
          key: `${aspect.transiting_body}-${aspect.aspect}-${aspect.natal_body}`,
          data,
        }))
        .catch(() => ({
          key: `${aspect.transiting_body}-${aspect.aspect}-${aspect.natal_body}`,
          data: null,
        }))
    );

    Promise.all(interpretationRequests).then((results) => {
      setInterpretations((prev) => {
        const newInterpretations = { ...prev };
        results.forEach(({ key, data }) => {
          if (data) {
            newInterpretations[key] = {
              micro: data.micro || newInterpretations[key]?.micro || null,
              macro: data.macro || null,
            };
          }
        });
        return newInterpretations;
      });
    });
  }, [aspectsData]);

  // Get top 3 aspects
  const topThreeAspects = useMemo(() => {
    if (!aspectsData?.aspects) return [];
    return [...aspectsData.aspects]
      .sort((a, b) => a.delta_from_exact_deg - b.delta_from_exact_deg)
      .slice(0, 3);
  }, [aspectsData]);

  // Get interpretation for an aspect
  const getInterpretation = (aspect) => {
    const key = `${aspect.transiting_body}-${aspect.aspect}-${aspect.natal_body}`;
    return interpretations[key] || null;
  };


  // Open modal for vibes
  const openVibesModal = (type) => {
    setModalVibes(type);
  };

  // Close modal
  const closeModal = () => {
    setModalVibes(null);
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && modalVibes) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [modalVibes]);

  if (!mounted) {
    return null; // SSR safety
  }

  if (loading) {
    return <LoadingState message="Loading your daily vibes..." />;
  }

  if (error) {
    return (
      <ErrorState 
        error={error} 
        actionLabel={error.includes("No birth chart") ? "Create Birth Chart" : null}
        actionHref={error.includes("No birth chart") ? "/natal/create" : null}
      />
    );
  }

  const calculatedOn = vibesData?.timestamp_utc
    ? formatCalculatedOn(vibesData.timestamp_utc, natalData?.birth_timezone)
    : "";

  const birthInfo = formatBirthInfo(natalData);

  return (
    <section className="min-h-screen px-4 pt-28 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">
              Daily vibes for {natalData?.name || "Sentient Stardust"}
            </span>
          </h1>
          {calculatedOn && (
            <p className="text-gray-400 text-sm md:text-base">
              calculated on <span className="text-neon-cyan font-semibold">{calculatedOn}</span>
            </p>
          )}
        </div>

        {/* Birth Information */}
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

        {/* Celestial Weather and Cosmic Climate */}
        {vibesData && (
          <div className="mb-12 p-8 rounded-xl bg-white/5 border border-purple-500/30 backdrop-blur-sm relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-cyan-500/5 pointer-events-none"></div>
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                <span className="gradient-text">Celestial Weather and Cosmic Climate</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Today's Cosmic Weather */}
                {vibesData.vibes_of_the_day && (
                  <div className="p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-gray-100 mb-3">Today's Celestial Weather</h3>
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

                {/* Cosmic Climate Conditions */}
                {vibesData.cosmic_season && (
                  <div className="p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-gray-100 mb-3">Cosmic Climate Conditions</h3>
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
        {topThreeAspects.length > 0 && (
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

        {/* Vibes Modal */}
        {modalVibes && vibesData && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <div
              className="max-w-2xl w-full p-8 rounded-xl bg-gray-900 border border-purple-500/40 backdrop-blur-sm relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {modalVibes === "day" && vibesData.vibes_of_the_day && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-4">Today's Celestial Weather</h3>
                  <div className="space-y-4">
                    {vibesData.vibes_of_the_day.anchors && vibesData.vibes_of_the_day.anchors.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-400 mb-2">Anchors (Aspects):</p>
                        <div className="space-y-2">
                          {vibesData.vibes_of_the_day.anchors.map((anchor, idx) => (
                            <div key={idx} className="text-sm text-gray-300">
                              {anchor.transiting_body} {anchor.aspect} {anchor.natal_body}
                              {anchor.delta_from_exact_deg !== undefined && (
                                <span className="text-gray-500 ml-2">
                                  (Δ {anchor.delta_from_exact_deg.toFixed(2)}°)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-400 mb-2">Summary:</p>
                      <p className="text-gray-300">{vibesData.vibes_of_the_day.summary}</p>
                    </div>
                    {vibesData.vibes_of_the_day.energy_profile && (
                      <div>
                        <p className="text-sm font-semibold text-gray-400 mb-2">Energy Balance:</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Supportive:</span>
                            <span className="text-green-400">
                              {(vibesData.vibes_of_the_day.energy_profile.supportive * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Challenging:</span>
                            <span className="text-red-400">
                              {(vibesData.vibes_of_the_day.energy_profile.challenging * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Neutral:</span>
                            <span className="text-gray-400">
                              {(vibesData.vibes_of_the_day.energy_profile.neutral * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden bg-gray-800/50 flex mt-2">
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
                      </div>
                    )}
                    {vibesData.vibes_of_the_day.keywords && vibesData.vibes_of_the_day.keywords.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-400 mb-2">Keywords:</p>
                        <div className="flex flex-wrap gap-2">
                          {vibesData.vibes_of_the_day.keywords.map((keyword, idx) => (
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
                    {vibesData.vibes_of_the_day.themes && vibesData.vibes_of_the_day.themes.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-400 mb-2">Themes:</p>
                        <div className="flex flex-wrap gap-2">
                          {vibesData.vibes_of_the_day.themes.map((theme, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-300 border border-purple-500/40"
                            >
                              {theme.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {modalVibes === "season" && vibesData.cosmic_season && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-100 mb-4">Cosmic Climate Conditions</h3>
                  <div className="space-y-4">
                    {vibesData.cosmic_season.anchors && vibesData.cosmic_season.anchors.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-400 mb-2">Anchors (Aspects):</p>
                        <div className="space-y-2">
                          {vibesData.cosmic_season.anchors.map((anchor, idx) => (
                            <div key={idx} className="text-sm text-gray-300">
                              {anchor.transiting_body} {anchor.aspect} {anchor.natal_body}
                              {anchor.delta_from_exact_deg !== undefined && (
                                <span className="text-gray-500 ml-2">
                                  (Δ {anchor.delta_from_exact_deg.toFixed(2)}°)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-400 mb-2">Summary:</p>
                      <p className="text-gray-300">{vibesData.cosmic_season.summary}</p>
                    </div>
                    {vibesData.cosmic_season.energy_profile && (
                      <div>
                        <p className="text-sm font-semibold text-gray-400 mb-2">Energy Balance:</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Supportive:</span>
                            <span className="text-green-400">
                              {(vibesData.cosmic_season.energy_profile.supportive * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Challenging:</span>
                            <span className="text-red-400">
                              {(vibesData.cosmic_season.energy_profile.challenging * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Neutral:</span>
                            <span className="text-gray-400">
                              {(vibesData.cosmic_season.energy_profile.neutral * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden bg-gray-800/50 flex mt-2">
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
                      </div>
                    )}
                    {vibesData.cosmic_season.keywords && vibesData.cosmic_season.keywords.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-400 mb-2">Keywords:</p>
                        <div className="flex flex-wrap gap-2">
                          {vibesData.cosmic_season.keywords.map((keyword, idx) => (
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
                    {vibesData.cosmic_season.themes && vibesData.cosmic_season.themes.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-400 mb-2">Themes:</p>
                        <div className="flex flex-wrap gap-2">
                          {vibesData.cosmic_season.themes.map((theme, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 rounded bg-purple-900/30 text-purple-300 border border-purple-500/40"
                            >
                              {theme.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

