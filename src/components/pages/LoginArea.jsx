import { useState } from "react";
import { NeonButton } from "../ui/NeonButton";

const API_BASE_URL = "/api";

export function LoginArea() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
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

      // Reload page to show authenticated content
      window.location.reload();
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
      setLoginLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mb-8 p-6 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
      <h2 className="text-xl font-bold text-gray-100 mb-4 text-center">
        Login
      </h2>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleLogin} className="space-y-4">
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
        <div className="flex flex-col gap-3">
          <NeonButton
            type="submit"
            disabled={loginLoading}
            className="w-full"
          >
            {loginLoading ? "Logging in..." : "Login"}
          </NeonButton>
          <a
            href="/auth/register"
            className="text-center text-sm text-neon-cyan hover:text-neon-purple transition-colors underline"
          >
            Create an account
          </a>
        </div>
      </form>
    </div>
  );
}

