import { useState } from "react";
import { X } from "lucide-react";

/**
 * AspectCard - Displays an aspect with expandable interpretation
 * @param {Object} props
 * @param {Object} props.aspect - Aspect object with transiting_body, aspect, natal_body, delta_from_exact_deg
 * @param {Object} props.interpretation - Interpretation object with micro and macro
 * @param {Function} props.onFetchInterpretation - Optional function to fetch interpretation if not provided
 * @param {boolean} props.dimmed - If true, uses dimmer styling for Cosmic Influences
 */
export function AspectCard({ aspect, interpretation, onFetchInterpretation, dimmed = false }) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInterpretation, setModalInterpretation] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Format aspect identifier (e.g., "Moon square natal Mercury")
  const aspectName = aspect.aspect.toLowerCase();
  const capitalizedAspect = aspectName.charAt(0).toUpperCase() + aspectName.slice(1);
  const aspectIdentifier = `${aspect.transiting_body} ${capitalizedAspect} natal ${aspect.natal_body}`;

  // Get headline/micro-meaning
  const headline = interpretation?.micro?.meaning || null;

  // Handle "Tell me more" button click
  const handleTellMeMore = async (e) => {
    e.stopPropagation(); // Prevent card toggle
    
    // If we already have the interpretation, use it
    if (interpretation) {
      setModalInterpretation(interpretation);
      setModalOpen(true);
      return;
    }

    // Otherwise fetch it
    if (onFetchInterpretation) {
      setModalLoading(true);
      setModalOpen(true);
      try {
        const fetched = await onFetchInterpretation(aspect);
        setModalInterpretation(fetched);
      } catch (error) {
        console.error("Error fetching interpretation:", error);
        setModalInterpretation(null);
      }
      setModalLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setModalInterpretation(null);
  };

  // Determine if card should be clickable (has interpretation data)
  const hasInterpretation = !!interpretation;
  const baseGlow = dimmed ? "shadow-[0_0_10px_rgba(139,92,246,0.2)]" : "shadow-[0_0_15px_rgba(139,92,246,0.3)]";
  const hoverGlow = dimmed ? "hover:shadow-[0_0_12px_rgba(139,92,246,0.25)]" : "hover:shadow-neon";
  const textColor = dimmed ? "text-gray-300" : "text-gray-100";
  const textColorSecondary = dimmed ? "text-gray-500" : "text-gray-400";

  return (
    <>
      <div
        className={`p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm transition-all duration-300 ${hoverGlow} ${
          hasInterpretation ? `cursor-pointer ${baseGlow}` : ""
        }`}
        onClick={() => hasInterpretation && setExpanded(!expanded)}
        role={hasInterpretation ? "button" : undefined}
        tabIndex={hasInterpretation ? 0 : undefined}
        onKeyDown={(e) => {
          if (hasInterpretation && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        {/* Original Content (always visible) */}
        <div className="flex items-start justify-between mb-3">
          <h3 className={`text-xl font-bold ${textColor}`}>{aspectIdentifier}</h3>
          {aspect.delta_from_exact_deg !== undefined && (
            <span className={`text-xs ${textColorSecondary}`}>
              {aspect.delta_from_exact_deg.toFixed(2)}° orb
            </span>
          )}
        </div>
        {headline && (
          <p className={`text-sm ${textColorSecondary} leading-relaxed`}>{headline}</p>
        )}

        {/* Expanded Content (below original, with divider) */}
        {expanded && interpretation && (
          <div className="mt-4 pt-4 border-t border-gray-700/40 animate-slideDownExpand space-y-4">

            {/* Keywords */}
            {interpretation.micro?.keywords && interpretation.micro.keywords.length > 0 && (
              <div>
                <h4 className={`text-sm font-semibold ${textColorSecondary} mb-2`}>Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {interpretation.micro.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded border border-gray-600"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Themes */}
            {interpretation.themes && interpretation.themes.length > 0 && (
              <div>
                <h4 className={`text-sm font-semibold ${textColorSecondary} mb-2`}>Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {interpretation.themes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-purple-900/30 text-purple-200 text-xs rounded border border-purple-700/50"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary (from macro if available) */}
            {interpretation.macro?.summary && (
              <div>
                <p className={`text-sm ${textColorSecondary} leading-relaxed`}>
                  {interpretation.macro.summary}
                </p>
              </div>
            )}

            {/* Tell me more button */}
            {(interpretation.micro || interpretation.macro) && (
              <div className="group flex flex-col items-center pt-2">
                <button
                  onClick={handleTellMeMore}
                  className="px-4 py-2 text-sm rounded-lg font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300"
                >
                  Tell me more...
                </button>
                <p className="text-gray-500 group-hover:text-gray-300 text-xs mt-1 transition-colors">
                  Why this matters today.
                </p>
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
              className={`rounded-xl border ${dimmed ? "bg-gray-900/95 border-gray-800/50" : "bg-gray-800 border-gray-700"} max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`sticky top-0 ${dimmed ? "bg-gray-900/95 border-gray-800/50" : "bg-gray-800 border-gray-700"} border-b px-6 py-4 flex justify-between items-center`}>
                <h3 className={`text-xl font-semibold ${textColor}`}>{aspectIdentifier}</h3>
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
                  <p className={textColorSecondary}>Loading interpretation...</p>
                ) : modalInterpretation ? (
                  <div className="space-y-4">
                    {/* Micro Meaning */}
                    {modalInterpretation.micro?.meaning && (
                      <div>
                        <h4 className={`text-sm font-semibold ${textColorSecondary} mb-2`}>Meaning</h4>
                        <p className={`${textColor}`}>{modalInterpretation.micro.meaning}</p>
                      </div>
                    )}

                    {/* Macro Overview */}
                    {modalInterpretation.macro?.overview && (
                      <div>
                        <h4 className={`text-sm font-semibold ${textColorSecondary} mb-2`}>Overview</h4>
                        <p className={textColor}>{modalInterpretation.macro.overview}</p>
                      </div>
                    )}

                    {/* Timeframe */}
                    {(modalInterpretation.micro?.timeframe || modalInterpretation.macro?.timeframe) && (
                      <div>
                        <h4 className={`text-sm font-semibold ${textColorSecondary} mb-2`}>Timeframe</h4>
                        <p className={textColor}>
                          {modalInterpretation.macro?.timeframe || modalInterpretation.micro?.timeframe}
                        </p>
                      </div>
                    )}

                    {/* Keywords */}
                    {modalInterpretation.micro?.keywords && modalInterpretation.micro.keywords.length > 0 && (
                      <div>
                        <h4 className={`text-sm font-semibold ${textColorSecondary} mb-2`}>Keywords</h4>
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
                        <h4 className={`text-sm font-semibold ${textColorSecondary} mb-2`}>Themes</h4>
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
                  <p className={textColorSecondary}>No interpretation available</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

