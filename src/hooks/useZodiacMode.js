import { useState, useEffect, useRef } from "react";
import { STORAGE_KEY } from "../utils/constants";

/**
 * Hook to manage zodiac mode state with localStorage synchronization
 * Listens to both storage events (cross-tab) and custom events (same-tab)
 * @returns {{mode: string, isHydrated: boolean}} Current mode and hydration status
 */
export function useZodiacMode() {
  const [mode, setModeState] = useState("z13");
  const [isHydrated, setIsHydrated] = useState(false);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    // Initial load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "z13" || stored === "tropical") {
      setModeState(stored);
    }
    setIsHydrated(true);

    // Listen for storage events (triggered when other tabs/components update localStorage)
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

  // Log mode changes for debugging
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

  return { mode, isHydrated };
}

