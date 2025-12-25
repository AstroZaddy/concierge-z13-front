import { useState } from "react";
import { NeonButton } from "../ui/NeonButton";

const API_BASE_URL = "/api";

export function AccountPageContent() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Redirect to landing page
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
      // Still redirect to landing page even on error
      window.location.href = "/";
    }
  };

  return (
    <section className="min-h-screen px-4 pt-32 pb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          <span className="gradient-text">Account Management</span>
        </h1>
        
        <div className="p-8 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
          <p className="text-gray-300 text-lg mb-4">
            Account management features will be available here soon.
          </p>
          <p className="text-gray-400 mb-8">
            This page is a placeholder for future account functionality.
          </p>

          <div className="mt-8 pt-8 border-t border-gray-700/40">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-6 py-3 rounded-full font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

