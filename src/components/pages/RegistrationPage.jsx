import { useState, useEffect } from "react";
import { NeonButton } from "../ui/NeonButton";

const API_BASE_URL = "/api";

export function RegistrationPage() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 10) {
      setError("Password must be at least 10 characters");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        credentials: "include", // Important: include cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          plan_type: "free",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Registration failed");
      }

      // Registration successful - redirect to login page
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
      setRegisterLoading(false);
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
            <span className="gradient-text">Create Account</span>
          </h1>
          <p className="text-gray-400 mt-4">
            Already have an account?{" "}
            <a 
              href="/auth/login" 
              className="text-neon-cyan hover:text-neon-purple transition-colors underline"
            >
              Login here
            </a>
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 rounded-xl bg-red-900/20 border border-red-500/40 text-red-300">
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <div className="p-8 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">
            Register
          </h2>
          <form onSubmit={handleRegister} className="space-y-6">
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
                minLength={10}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
                placeholder="At least 10 characters"
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 10 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={10}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
                placeholder="Confirm your password"
              />
            </div>
            <div className="flex justify-center">
              <NeonButton
                type="submit"
                disabled={registerLoading}
                className="px-8 py-3"
              >
                {registerLoading ? "Creating account..." : "Register"}
              </NeonButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

