import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const UserDataContext = createContext({
  isAuthenticated: false,
  authChecked: false,
  user: null,
  natalDataList: [],
  defaultNatal: null,
  loading: true,
  refreshNatalData: () => {},
});

const API_BASE_URL = "/api";

export function UserDataProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [natalDataList, setNatalDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Check authentication and load user data
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // IMPORTANT: During parallel run with SessionBootstrapContext,
    // UserDataProvider should NOT fetch any data to avoid duplicate API calls.
    // SessionBootstrapContext handles all data fetching (auth, charts, positions, etc).
    // 
    // UserDataProvider remains active for backwards compatibility with existing components,
    // but provides empty/default state. Components should migrate to useSessionBootstrap().
    //
    // To re-enable UserDataProvider fetching (if SessionBootstrapProvider is removed),
    // uncomment the code below and remove this early return.

    console.log("UserDataContext: Data fetching disabled - SessionBootstrapContext handles all API calls");
    setAuthChecked(true);
    setIsAuthenticated(false);
    setUser(null);
    setNatalDataList([]);
    setLoading(false);
    return;

    /* 
    // Original fetch code - DISABLED during parallel run to avoid duplicate API calls
    const checkAuthAndLoadData = async () => {
      try {
        setLoading(true);
        console.log("UserDataContext: Starting auth check...");
        
        // Check authentication with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn("UserDataContext: Auth check timeout, aborting...");
          controller.abort();
        }, 5000); // 5 second timeout
        
        let authResponse;
        try {
          authResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            console.warn("UserDataContext: Auth check timed out");
            // Treat timeout as unauthenticated, not an error
            setIsAuthenticated(false);
            setAuthChecked(true);
            setUser(null);
            setNatalDataList([]);
            setLoading(false);
            return;
          }
          throw fetchErr;
        }

        const isAuth = authResponse.status === 200;
        console.log("UserDataContext: Auth check complete, isAuth:", isAuth, "status:", authResponse.status);
        
        // Set state updates together
        setIsAuthenticated(isAuth);
        setAuthChecked(true); // Always set authChecked, even if not authenticated
        console.log("UserDataContext: State updated - isAuthenticated:", isAuth, "authChecked: true");

        if (isAuth) {
          // Get user info
          const userData = await authResponse.json();
          setUser(userData);
          console.log("UserDataContext: User data set:", userData);

          // Fetch all natal data (with timeout)
          const natalController = new AbortController();
          const natalTimeoutId = setTimeout(() => natalController.abort(), 10000);
          
          try {
            const natalResponse = await fetch(`${API_BASE_URL}/natal-data`, {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              signal: natalController.signal,
            });
            clearTimeout(natalTimeoutId);

            if (natalResponse.ok) {
              const natalData = await natalResponse.json();
              setNatalDataList(natalData || []);
            } else {
              setNatalDataList([]);
            }
          } catch (natalErr) {
            clearTimeout(natalTimeoutId);
            console.warn("Error fetching natal data:", natalErr);
            setNatalDataList([]);
          }
        } else {
          setUser(null);
          setNatalDataList([]);
          console.log("UserDataContext: User not authenticated, cleared user data");
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setIsAuthenticated(false);
        setAuthChecked(true); // Set authChecked even on error so UI can render
        setUser(null);
        setNatalDataList([]);
      } finally {
        console.log("UserDataContext: Auth check finished, setting loading to false");
        setLoading(false);
        // Force a state update to ensure re-render
        console.log("UserDataContext: Loading set to false, components should re-render");
      }
    };

    checkAuthAndLoadData();
    */
  }, [mounted]);

  // Function to refresh natal data (useful after creating/updating charts)
  const refreshNatalData = useCallback(async () => {
    if (!isAuthenticated) return;

    // During parallel run, components should use SessionBootstrapContext's refetchChartsList instead
    console.warn("UserDataContext.refreshNatalData: Disabled during parallel run. Use SessionBootstrapContext.refetchChartsList() instead");
    
    // Original implementation disabled to avoid duplicate API calls
    /*
    try {
      const response = await fetch(`${API_BASE_URL}/natal-data`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const natalData = await response.json();
        setNatalDataList(natalData || []);
      }
    } catch (err) {
      console.error("Error refreshing natal data:", err);
    }
    */
  }, [isAuthenticated]);

  // Compute default natal data
  const defaultNatal = useMemo(() => {
    return natalDataList.find((n) => n.is_default) || natalDataList[0] || null;
  }, [natalDataList]);

  const value = useMemo(() => {
    const contextValue = {
      isAuthenticated,
      authChecked,
      user,
      natalDataList,
      defaultNatal,
      loading,
      refreshNatalData,
    };
    console.log("UserDataContext: Providing value:", contextValue);
    return contextValue;
  }, [isAuthenticated, authChecked, user, natalDataList, defaultNatal, loading, refreshNatalData]);

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error("useUserData must be used within UserDataProvider");
  }
  return context;
}
