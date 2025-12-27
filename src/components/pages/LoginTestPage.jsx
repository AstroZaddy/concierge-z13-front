import { useState, useEffect } from "react";
import { NeonButton } from "../ui/NeonButton";
import { useUserData } from "../../contexts/UserDataContext";

import { API_BASE_URL } from "../../utils/constants";

export function LoginTestPage() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Use user data from context
  const { user, defaultNatal, isAuthenticated, loading, authChecked } = useUserData();
  
  // Get user name from natal data
  const userName = defaultNatal?.name || null;

  // Debug logging
  console.log("LoginTestPage render:", { user, loading, authChecked, isAuthenticated });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include", // Important: include cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Login failed");
      }

      // After successful login, reload page to refresh context
      window.location.reload();
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include", // Important: include cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Reload page to refresh context
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message || "Logout failed");
    }
  };

  if (!mounted) {
    return null; // SSR safety
  }

  return (
    <section className="min-h-screen px-4 py-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Login</span>
          </h1>
          <p className="text-gray-400 mt-4">
            Don't have an account?{" "}
            <a 
              href="/auth/register" 
              className="text-neon-cyan hover:text-neon-purple transition-colors underline"
            >
              Register here
            </a>
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">Checking authentication status...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 rounded-xl bg-red-900/20 border border-red-500/40 text-red-300">
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Logged In State */}
        {!loading && user && (
          <div className="mb-8 p-8 rounded-xl bg-white/5 border border-green-500/30 backdrop-blur-sm">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-4">
                Welcome back, {userName || user.email || "Sentient Stardust"}!
              </h2>
              <p className="text-gray-300 mb-6">
                You are successfully logged in.
              </p>
            </div>
            <div className="flex justify-center">
              <NeonButton
                onClick={handleLogout}
                className="px-8 py-3"
              >
                Logout
              </NeonButton>
            </div>
          </div>
        )}

        {/* Login Form */}
        {!loading && !user && (
          <div className="p-8 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">
              Login
            </h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex justify-center">
                <NeonButton
                  type="submit"
                  disabled={loginLoading}
                  className="px-8 py-3"
                >
                  {loginLoading ? "Logging in..." : "Login"}
                </NeonButton>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

