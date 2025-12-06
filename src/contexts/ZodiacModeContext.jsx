import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const ZodiacModeContext = createContext({
  mode: "z13",
  setMode: () => {},
});

const STORAGE_KEY = "z13-zodiac-mode";

export function ZodiacModeProvider({ children }) {
  // Initialize with default, will be hydrated from localStorage on client
  const [mode, setModeState] = useState("z13");
  const [isHydrated, setIsHydrated] = useState(false);

  // SSR-safe: Only access localStorage after hydration
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "z13" || stored === "tropical") {
      setModeState(stored);
    }
    setIsHydrated(true);
  }, []);

  // Update localStorage when mode changes
  const setMode = useCallback((newMode) => {
    if (newMode === "z13" || newMode === "tropical") {
      setModeState(newMode);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, newMode);
        // Dispatch custom event for same-tab communication (storage events only work across tabs)
        window.dispatchEvent(new CustomEvent("zodiacModeChange", { detail: newMode }));
      }
    }
  }, []);

  const value = useMemo(() => ({
    mode,
    setMode,
    isHydrated
  }), [mode, setMode, isHydrated]);

  return (
    <ZodiacModeContext.Provider value={value}>
      {children}
    </ZodiacModeContext.Provider>
  );
}

export function useZodiacMode() {
  const context = useContext(ZodiacModeContext);
  if (!context) {
    throw new Error("useZodiacMode must be used within ZodiacModeProvider");
  }
  return context;
}

