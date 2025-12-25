import { useEffect, useState } from "react";
import { Hero } from "../sections/Hero";
import { CtaRow } from "../sections/CtaRow";
import { ExplainerSection } from "../sections/ExplainerSection";
import { ExploreSection } from "../sections/ExploreSection";
import { useUserData } from "../../contexts/UserDataContext";

export function LandingPage() {
  const [mounted, setMounted] = useState(false);
  
  // Use user data from context
  const { isAuthenticated, authChecked, loading, user, natalDataList, defaultNatal } = useUserData();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  console.log("LandingPage render:", { isAuthenticated, authChecked, loading, mounted, user, natalDataList });

  if (!mounted) {
    return null;
  }

  // Show loading state while checking auth
  if (!authChecked || loading) {
    console.log("LandingPage: Showing loading state");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  console.log("LandingPage: Auth check complete, isAuthenticated:", isAuthenticated);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">Landing Page Debug Info</h1>
        
        {/* Authentication Status */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p className="text-gray-300">
              <span className="font-medium">Status:</span>{" "}
              <span className={isAuthenticated ? "text-green-400" : "text-red-400"}>
                {isAuthenticated ? "Authenticated" : "Not Authenticated"}
              </span>
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Auth Checked:</span> {authChecked ? "Yes" : "No"}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Loading:</span> {loading ? "Yes" : "No"}
            </p>
          </div>
        </div>

        {/* User Information (if authenticated) */}
        {isAuthenticated && user && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">User Information</h2>
            <div className="space-y-2">
              <pre className="text-gray-300 text-sm overflow-auto bg-gray-900 p-4 rounded">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Natal Data List (if authenticated) */}
        {isAuthenticated && natalDataList && natalDataList.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Natal Data List</h2>
            <div className="space-y-2">
              <p className="text-gray-300">
                <span className="font-medium">Count:</span> {natalDataList.length}
              </p>
              <pre className="text-gray-300 text-sm overflow-auto bg-gray-900 p-4 rounded max-h-96">
                {JSON.stringify(natalDataList, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Default Natal (if authenticated) */}
        {isAuthenticated && defaultNatal && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Default Natal Data</h2>
            <div className="space-y-2">
              <pre className="text-gray-300 text-sm overflow-auto bg-gray-900 p-4 rounded max-h-96">
                {JSON.stringify(defaultNatal, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Show existing content for unauthenticated users */}
        {!isAuthenticated && (
          <>
            <Hero />
            <ExplainerSection />
            <CtaRow />
            <ExploreSection />
          </>
        )}
      </div>
    </div>
  );
}

