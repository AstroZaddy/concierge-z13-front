import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

/**
 * VibesCard - Displays daily vibes or cosmic season data
 * @param {Object} props
 * @param {Object} props.vibesData - Vibes data (vibes_of_the_day or cosmic_season)
 * @param {string} props.title - Card title
 * @param {Object} props.interpretations - Preloaded interpretations object
 * @param {Function} props.onFetchInterpretation - Function to fetch interpretation if not cached
 */
export function VibesCard({ vibesData, title, interpretations, onFetchInterpretation }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedAnchor, setSelectedAnchor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInterpretation, setModalInterpretation] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const cardRef = useRef(null);
  const buttonRef = useRef(null);

  if (!vibesData) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-gray-100 mb-4">{title}</h3>
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  // Get top 3 themes
  const topThemes = vibesData.themes
    ?.slice(0, 3)
    .map((theme) => theme.name) || [];

  // Energy profile - calculate percentages and round to whole numbers, ensuring they add to 100%
  const energy = vibesData.energy_profile || {};
  const supportive = energy.supportive || 0;
  const challenging = energy.challenging || 0;
  const neutral = energy.neutral || 0;
  const total = supportive + challenging + neutral;
  
  // Calculate percentages and round to whole numbers
  let supportivePercent = total > 0 ? Math.round((supportive / total) * 100) : 0;
  let challengingPercent = total > 0 ? Math.round((challenging / total) * 100) : 0;
  let neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;
  
  // Ensure percentages add up to 100% (adjust the largest one if needed)
  const sum = supportivePercent + challengingPercent + neutralPercent;
  if (sum !== 100 && total > 0) {
    const diff = 100 - sum;
    // Adjust the largest percentage
    if (supportivePercent >= challengingPercent && supportivePercent >= neutralPercent) {
      supportivePercent += diff;
    } else if (challengingPercent >= neutralPercent) {
      challengingPercent += diff;
    } else {
      neutralPercent += diff;
    }
  }
  
  // Calculate actual percentages for bar width (not rounded)
  const supportivePercentActual = total > 0 ? (supportive / total) * 100 : 0;
  const challengingPercentActual = total > 0 ? (challenging / total) * 100 : 0;
  const neutralPercentActual = total > 0 ? (neutral / total) * 100 : 0;

  // Find interpretation for an anchor
  const findInterpretation = (anchor) => {
    if (interpretations?.results) {
      const found = interpretations.results.find(
        (result) =>
          result.key?.transiting_body === anchor.transiting_body &&
          result.key?.aspect === anchor.aspect &&
          result.key?.natal_body === anchor.natal_body
      );
      return found;
    }
    return null;
  };

  // Handle "Tell me more" button click
  const handleTellMeMore = async (anchor) => {
    setSelectedAnchor(anchor);
    setModalLoading(true);
    setModalOpen(true);

    // Try to find in cache first
    const cached = findInterpretation(anchor);
    if (cached && (cached.micro || cached.macro)) {
      setModalInterpretation(cached);
      setModalLoading(false);
      return;
    }

    // Fetch on-demand if not in cache
    if (onFetchInterpretation) {
      try {
        const fetched = await onFetchInterpretation(anchor);
        setModalInterpretation(fetched);
      } catch (error) {
        console.error("Error fetching interpretation:", error);
        setModalInterpretation(null);
      }
    } else {
      // Fallback: fetch directly if no callback provided
      try {
        const response = await fetch("/api/interpretations/transiting_to_natal", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: [{
              transiting_body: anchor.transiting_body,
              aspect: anchor.aspect,
              natal_body: anchor.natal_body,
            }],
            layer: "both",
            max_items: 1,
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const result = data.results?.[0];
        if (result) {
          setModalInterpretation(result);
        } else {
          setModalInterpretation(null);
        }
      } catch (error) {
        console.error("Error fetching interpretation:", error);
        setModalInterpretation(null);
      }
    }
    setModalLoading(false);
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setModalInterpretation(null);
    setSelectedAnchor(null);
    // Return focus to button
    if (buttonRef.current) {
      setTimeout(() => buttonRef.current?.focus(), 0);
    }
  };

  // Handle Escape key
  useEffect(() => {
    if (!modalOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [modalOpen]);

  return (
    <>
      <div
        ref={cardRef}
        className={`p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm hover:shadow-neon transition-all duration-300 cursor-pointer ${
          expanded ? "shadow-[0_0_15px_rgba(139,92,246,0.3)]" : ""
        }`}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <h3 className="text-xl font-bold text-gray-100 mb-4">{title}</h3>

        {/* Collapsed State */}
        {!expanded && (
          <>
            <p className="text-white text-lg font-medium mb-4">{vibesData.headline}</p>

            {/* Keywords as chips */}
            {vibesData.keywords && vibesData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {vibesData.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-700/50 text-gray-200 text-sm rounded-full border border-gray-600"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* Energy Profile Bar */}
            <div>
              <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden flex mb-2">
                {supportivePercentActual > 0 && (
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${supportivePercentActual}%`, minWidth: supportivePercentActual > 0 ? "6px" : "0" }}
                  />
                )}
                {challengingPercentActual > 0 && (
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${challengingPercentActual}%`, minWidth: challengingPercentActual > 0 ? "6px" : "0" }}
                  />
                )}
                {neutralPercentActual > 0 && (
                  <div
                    className="bg-gray-500 h-full transition-all"
                    style={{ width: `${neutralPercentActual}%`, minWidth: neutralPercentActual > 0 ? "6px" : "0" }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Supportive: {supportivePercent}%</span>
                <span>Challenging: {challengingPercent}%</span>
                <span>Neutral: {neutralPercent}%</span>
              </div>
            </div>
          </>
        )}

        {/* Expanded State */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-700/40 animate-in slide-in-from-top duration-300 space-y-4">
            <p className="text-white text-lg font-medium">{vibesData.headline}</p>

            {/* Keywords */}
            {vibesData.keywords && vibesData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {vibesData.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-700/50 text-gray-200 text-sm rounded-full border border-gray-600"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {/* Energy Profile Bar with percentages */}
            <div>
              <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden flex mb-2">
                {supportivePercentActual > 0 && (
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${supportivePercentActual}%`, minWidth: supportivePercentActual > 0 ? "6px" : "0" }}
                  />
                )}
                {challengingPercentActual > 0 && (
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${challengingPercentActual}%`, minWidth: challengingPercentActual > 0 ? "6px" : "0" }}
                  />
                )}
                {neutralPercentActual > 0 && (
                  <div
                    className="bg-gray-500 h-full transition-all"
                    style={{ width: `${neutralPercentActual}%`, minWidth: neutralPercentActual > 0 ? "6px" : "0" }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Supportive: {supportivePercent}%</span>
                <span>Challenging: {challengingPercent}%</span>
                <span>Neutral: {neutralPercent}%</span>
              </div>
            </div>

            {/* Summary */}
            <p className="text-gray-300">{vibesData.summary}</p>

            {/* Themes */}
            {topThemes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {topThemes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-900/30 text-purple-200 text-sm rounded-full border border-purple-700/50"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Anchors */}
            {vibesData.anchors && vibesData.anchors.length > 0 && (
              <div>
                <h4 className="text-base font-semibold text-gray-400 mb-3">Key Aspects</h4>
                <div className="space-y-4">
                  {vibesData.anchors.map((anchor, idx) => {
                    const interpretation = findInterpretation(anchor);
                    const anchorKeywords = interpretation?.micro?.keywords?.slice(0, 3) || [];
                    const anchorThemes = interpretation?.themes?.slice(0, 3) || [];

                    return (
                      <div
                        key={idx}
                        className="bg-gray-900/50 p-4 rounded-lg border border-gray-700"
                      >
                        <p className="text-white font-semibold text-base mb-2">
                          {anchor.transiting_body} {anchor.aspect} natal {anchor.natal_body}
                        </p>

                        {/* Keywords and Themes for this anchor */}
                        {(anchorKeywords.length > 0 || anchorThemes.length > 0) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {anchorKeywords.slice(0, 3).map((kw, kwIdx) => (
                              <span
                                key={kwIdx}
                                className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded border border-gray-600"
                              >
                                {kw}
                              </span>
                            ))}
                            {anchorThemes.filter(t => !anchorKeywords.includes(t)).slice(0, 3).map((theme, themeIdx) => (
                              <span
                                key={themeIdx}
                                className="px-2 py-1 bg-purple-900/30 text-purple-200 text-xs rounded border border-purple-700/50"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="group flex flex-col items-center">
                          <button
                            ref={idx === 0 ? buttonRef : null}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTellMeMore(anchor);
                            }}
                            className="px-4 py-2 text-sm rounded-lg font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300"
                          >
                            Tell me more...
                          </button>
                          <p className="text-gray-500 group-hover:text-gray-300 text-xs mt-1 transition-colors">
                            Why this matters today.
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Modal Content */}
            <div
              className="bg-gray-800 rounded-xl border border-gray-700 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  {selectedAnchor && (
                    <>
                      {selectedAnchor.transiting_body} {selectedAnchor.aspect} natal {selectedAnchor.natal_body}
                    </>
                  )}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {modalLoading ? (
                  <p className="text-gray-400">Loading interpretation...</p>
                ) : modalInterpretation ? (
                  <div className="space-y-4">
                    {/* Micro Meaning */}
                    {modalInterpretation.micro?.meaning && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Meaning</h4>
                        <p className="text-gray-200">{modalInterpretation.micro.meaning}</p>
                      </div>
                    )}

                    {/* Macro Overview */}
                    {modalInterpretation.macro?.overview && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Overview</h4>
                        <p className="text-gray-200">{modalInterpretation.macro.overview}</p>
                      </div>
                    )}

                    {/* Timeframe */}
                    {(modalInterpretation.micro?.timeframe || modalInterpretation.macro?.timeframe) && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Timeframe</h4>
                        <p className="text-gray-200">
                          {modalInterpretation.macro?.timeframe || modalInterpretation.micro?.timeframe}
                        </p>
                      </div>
                    )}

                    {/* Keywords */}
                    {modalInterpretation.micro?.keywords && modalInterpretation.micro.keywords.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {modalInterpretation.micro.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gray-700/50 text-gray-200 text-sm rounded-full border border-gray-600"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Themes */}
                    {modalInterpretation.themes && modalInterpretation.themes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">Themes</h4>
                        <div className="flex flex-wrap gap-2">
                          {modalInterpretation.themes.map((theme, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-purple-900/30 text-purple-200 text-sm rounded-full border border-purple-700/50"
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">No interpretation available</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

