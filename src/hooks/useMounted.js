import { useState, useEffect } from "react";

/**
 * Hook to track if component has mounted (useful for SSR/hydration)
 * @returns {boolean} true if component has mounted
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted;
}

