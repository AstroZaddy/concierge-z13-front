import { useSessionBootstrap } from "../contexts/SessionBootstrapContext";

/**
 * Hook to get authentication state in a standardized way
 * @returns {{isAuthenticated: boolean, hasCheckedAuth: boolean, sessionState: string, user: object|null}}
 */
export function useAuth() {
  const sessionBootstrap = useSessionBootstrap();
  const sessionState = sessionBootstrap?.sessionState || "anonymous";
  const hasCheckedAuth = sessionBootstrap?.hasCheckedAuth || false;
  const isAuthenticated = sessionState === "authenticated_has_chart" || sessionState === "authenticated_no_chart";
  
  return {
    isAuthenticated,
    hasCheckedAuth,
    sessionState,
    user: sessionBootstrap?.user || null,
    chartsList: sessionBootstrap?.chartsList || null,
    defaultChart: sessionBootstrap?.defaultChart || null,
  };
}

