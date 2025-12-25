import { useMemo } from "react";
import { AspectCard } from "./AspectCard";

/**
 * AspectList - Displays a list of aspects with filtering and sorting
 * @param {Object} props
 * @param {Array} props.aspects - Array of aspect objects
 * @param {Object} props.interpretations - Interpretations object with results array
 * @param {Function} props.aspectFilter - Function to filter aspects (aspect) => boolean
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Optional subtitle
 * @param {Function} props.onFetchInterpretation - Optional function to fetch interpretation if not cached
 * @param {boolean} props.dimmed - If true, uses dimmer styling for Cosmic Influences
 */
export function AspectList({ 
  aspects, 
  interpretations, 
  aspectFilter, 
  title, 
  subtitle, 
  onFetchInterpretation,
  dimmed = false 
}) {
  // Find interpretation for an aspect
  const findInterpretation = (aspect) => {
    if (interpretations?.results) {
      const found = interpretations.results.find(
        (result) =>
          result.key?.transiting_body === aspect.transiting_body &&
          result.key?.aspect === aspect.aspect &&
          result.key?.natal_body === aspect.natal_body
      );
      return found || null;
    }
    return null;
  };

  // Filter and sort aspects
  const filteredAndSortedAspects = useMemo(() => {
    if (!aspects || aspects.length === 0) return [];

    // Filter aspects
    let filtered = aspects.filter(aspectFilter);

    // Sort by tightest orb first (delta_from_exact_deg, ascending)
    filtered = [...filtered].sort((a, b) => {
      const orbA = a.delta_from_exact_deg !== undefined ? a.delta_from_exact_deg : Infinity;
      const orbB = b.delta_from_exact_deg !== undefined ? b.delta_from_exact_deg : Infinity;
      return orbA - orbB;
    });

    return filtered;
  }, [aspects, aspectFilter]);

  if (filteredAndSortedAspects.length === 0) {
    return null;
  }

  const titleColor = dimmed ? "text-gray-300" : "text-gray-100";
  const subtitleColor = dimmed ? "text-gray-500" : "text-gray-400";

  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${titleColor}`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-sm ${subtitleColor}`}>{subtitle}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedAspects.map((aspect, idx) => {
          const interpretation = findInterpretation(aspect);
          return (
            <AspectCard
              key={`${aspect.transiting_body}-${aspect.aspect}-${aspect.natal_body}-${idx}`}
              aspect={aspect}
              interpretation={interpretation}
              onFetchInterpretation={onFetchInterpretation}
              dimmed={dimmed}
            />
          );
        })}
      </div>
    </div>
  );
}

