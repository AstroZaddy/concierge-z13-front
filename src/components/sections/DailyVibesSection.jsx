import { useMemo } from "react";
import { VibesCard } from "../ui/VibesCard";
import { AspectList } from "../ui/AspectList";
import { useSessionBootstrap } from "../../contexts/SessionBootstrapContext";
import { useQueryClient } from "@tanstack/react-query";
import { bootstrapQueryKeys } from "../../contexts/SessionBootstrapContext";

const API_BASE_URL = "/api";

export function DailyVibesSection() {
  const { vibesNow, interpretations } = useSessionBootstrap();
  const queryClientRQ = useQueryClient();

  // Fetch interpretation on-demand if not cached
  const fetchInterpretation = async (anchor) => {
    const key = {
      transiting_body: anchor.transiting_body,
      aspect: anchor.aspect,
      natal_body: anchor.natal_body,
    };

    // Check if we can use React Query cache
    const queryKey = bootstrapQueryKeys.interpretations.transitingToNatal([key]);
    const cached = queryClientRQ?.getQueryData(queryKey);
    
    if (cached?.results) {
      const found = cached.results.find(
        (r) =>
          r.key?.transiting_body === key.transiting_body &&
          r.key?.aspect === key.aspect &&
          r.key?.natal_body === key.natal_body
      );
      if (found) return found;
    }

    // Fetch from API
    const response = await fetch(`${API_BASE_URL}/interpretations/transiting_to_natal`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [key],
        layer: "both",
        max_items: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data.results?.[0];
    
    // Cache the result using React Query
    if (queryClientRQ && result) {
      queryClientRQ.setQueryData(queryKey, (old) => {
        if (!old) return data;
        return {
          ...old,
          results: [...(old.results || []), result],
        };
      });
    }

    return result || null;
  };

  // Select today's action aspect using the selection algorithm
  const todaysActionAspect = useMemo(() => {
    if (!vibesNow?.aspects_found || !interpretations?.results) {
      return null;
    }

    // Helper function to find interpretation for an aspect
    const findInterpretation = (aspect) => {
      if (interpretations?.results) {
        const found = interpretations.results.find(
          (result) =>
            result.key?.transiting_body === aspect.transiting_body &&
            result.key?.aspect === aspect.aspect &&
            result.key?.natal_body === aspect.natal_body
        );
        return found;
      }
      return null;
    };

    // Step 1: Build candidate list of aspects that have matching interpretations
    const candidates = vibesNow.aspects_found.filter((aspect) => {
      return findInterpretation(aspect) !== null;
    });

    if (candidates.length === 0) {
      return null;
    }

    // Step 2: Prefer inner planet transits
    const innerPlanets = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars"]);
    const preferredCandidates = candidates.filter(
      (aspect) => innerPlanets.has(aspect.transiting_body)
    );

    // Step 3: Fallback to outer planets with major aspects
    const outerPlanets = new Set(["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]);
    const majorAspects = new Set(["conjunction", "square", "trine", "opposition"]);
    const fallbackCandidates = candidates.filter(
      (aspect) =>
        outerPlanets.has(aspect.transiting_body) &&
        majorAspects.has(aspect.aspect.toLowerCase())
    );

    // Step 4: Choose random from preferred list, or fallback, or any candidate
    let selectedList = preferredCandidates.length > 0 
      ? preferredCandidates 
      : fallbackCandidates.length > 0 
        ? fallbackCandidates 
        : candidates;

    if (selectedList.length === 0) {
      return null;
    }

    // Random selection
    const randomIndex = Math.floor(Math.random() * selectedList.length);
    return selectedList[randomIndex];
  }, [vibesNow, interpretations]);

  // Get action text from the selected aspect's interpretation
  const actionText = useMemo(() => {
    if (!todaysActionAspect || !interpretations?.results) return null;

    // Find interpretation for the selected aspect
    const interpretation = interpretations.results.find(
      (result) =>
        result.key?.transiting_body === todaysActionAspect.transiting_body &&
        result.key?.aspect === todaysActionAspect.aspect &&
        result.key?.natal_body === todaysActionAspect.natal_body
    );

    if (!interpretation) return null;

    // Prefer macro.suggestions[0], else fallback to micro.meaning
    if (interpretation.macro?.suggestions && interpretation.macro.suggestions.length > 0) {
      return interpretation.macro.suggestions[0];
    }
    if (interpretation.micro?.meaning) {
      return interpretation.micro.meaning;
    }

    return null;
  }, [todaysActionAspect, interpretations]);

  // Format aspect identifier (e.g., "Sun sextile natal Venus")
  const aspectIdentifier = useMemo(() => {
    if (!todaysActionAspect) return null;
    
    const aspectName = todaysActionAspect.aspect.toLowerCase();
    // Capitalize first letter
    const capitalizedAspect = aspectName.charAt(0).toUpperCase() + aspectName.slice(1);
    
    return `${todaysActionAspect.transiting_body} ${capitalizedAspect} natal ${todaysActionAspect.natal_body}`;
  }, [todaysActionAspect]);

  // Filter functions for aspect categories
  const innerPlanets = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars"]);
  const outerPlanets = new Set(["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"]);

  const filterInnerPlanets = (aspect) => {
    return innerPlanets.has(aspect.transiting_body);
  };

  const filterOuterPlanets = (aspect) => {
    return outerPlanets.has(aspect.transiting_body);
  };

  if (!vibesNow) {
    return null;
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Big Influences Section */}
        <div className="mb-12 p-8 rounded-xl bg-white/5 border border-purple-500/30 backdrop-blur-sm relative">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 to-cyan-500/5 pointer-events-none"></div>
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="gradient-text">Big Influences</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <VibesCard
                title="Current Conditions"
                vibesData={vibesNow.vibes_of_the_day}
                interpretations={interpretations}
                onFetchInterpretation={fetchInterpretation}
              />
              
              <VibesCard
                title="Cosmic Climate"
                vibesData={vibesNow.cosmic_season}
                interpretations={interpretations}
                onFetchInterpretation={fetchInterpretation}
              />
            </div>

            {/* Today's Action */}
            {actionText && aspectIdentifier && (
              <div className="mt-8 text-center">
                <p className="text-gray-400 mb-3">Today's action:</p>
                <p className="text-xl md:text-2xl font-medium text-yellow-400 mb-2">
                  {actionText}
                </p>
                <p className="text-sm text-gray-500">
                  {aspectIdentifier}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Personal Influences Section */}
        <AspectList
          aspects={vibesNow.aspects_found || []}
          interpretations={interpretations}
          aspectFilter={filterInnerPlanets}
          title="Personal Influences"
          subtitle="Inner planets shaping mood, choices, and interactions today."
          onFetchInterpretation={fetchInterpretation}
          dimmed={false}
        />

        {/* Cosmic Influences Section */}
        <AspectList
          aspects={vibesNow.aspects_found || []}
          interpretations={interpretations}
          aspectFilter={filterOuterPlanets}
          title="Cosmic Influences"
          subtitle="Slower-moving forces shaping context, pressure, and long-term growth."
          onFetchInterpretation={fetchInterpretation}
          dimmed={true}
        />
      </div>
    </section>
  );
}

