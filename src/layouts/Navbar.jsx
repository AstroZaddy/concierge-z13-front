import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { NavbarZodiacToggle } from "../components/ui/NavbarZodiacToggle";
import { NeonButton } from "../components/ui/NeonButton";
import { useSessionBootstrap } from "../contexts/SessionBootstrapContext";

const API_BASE_URL = "/api";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const exploreRef = useRef(null);
  const aboutRef = useRef(null);
  
  // Use session bootstrap to get auth state
  const { sessionState, hasCheckedAuth, user } = useSessionBootstrap();
  const isAuthenticated = sessionState === "authenticated_has_chart" || sessionState === "authenticated_no_chart";
  const hasDefaultChart = sessionState === "authenticated_has_chart";
  const authChecked = hasCheckedAuth;

  // Determine birth chart link destination
  const getBirthChartLink = () => {
    if (!authChecked) return "/natal/create"; // Show form while checking
    if (hasDefaultChart) return "/natal/view"; // Show default chart
    if (isAuthenticated) return "/natal/create"; // Authenticated but no default - show form
    return "/natal/create"; // Not authenticated - show form
  };

  const handleLogout = async () => {
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

      // Reload page to show unauthenticated state
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
      // Still reload to clear state
      window.location.reload();
    }
  };

  // Close submenus when clicking outside (desktop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exploreRef.current && !exploreRef.current.contains(event.target)) {
        setExploreOpen(false);
      }
      if (aboutRef.current && !aboutRef.current.contains(event.target)) {
        setAboutOpen(false);
      }
    };

    if (exploreOpen || aboutOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [exploreOpen, aboutOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open) {
        // Check if click is outside both nav and mobile menu
        const nav = event.target.closest("nav");
        const mobileMenu = event.target.closest('[data-mobile-menu]');
        if (!nav && !mobileMenu) {
          setOpen(false);
          setExploreOpen(false);
          setAboutOpen(false);
        }
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <>
    <nav className="fixed top-0 left-0 w-full z-[100] backdrop-blur-md bg-white/5 border-b border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4" style={{ minHeight: '73px' }}>

        {/* Logo, Toggle, and Login/Join */}
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center">
            <img 
              src="/z13_logo.png" 
              alt="Z13 Astrology" 
              className="h-8 w-auto"
            />
          </a>
          <NavbarZodiacToggle />
          
          {/* Login/Join button (only for unauthenticated users, desktop only) */}
          {!isAuthenticated && (
            <div className="hidden md:block ml-2">
              {authChecked ? (
                <a
                  href="/auth/login"
                  className="px-6 py-2 text-sm rounded-lg font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300"
                >
                  Login/Join
                </a>
              ) : (
                <a
                  href="/auth/login"
                  className="px-6 py-2 text-sm rounded-lg font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300 opacity-75"
                >
                  Login/Join
                </a>
              )}
            </div>
          )}
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-gray-200 text-sm">
          {/* Daily Vibes link (only for authenticated users) */}
          {authChecked && isAuthenticated && (
            <a href="/" className="hover:text-neon-cyan transition">
              Daily Vibes
            </a>
          )}
          
          {/* Explore Submenu */}
          <div className="relative" ref={exploreRef}>
            <button
              onClick={() => {
                setExploreOpen(!exploreOpen);
                setAboutOpen(false);
              }}
              className="flex items-center gap-1 hover:text-neon-cyan transition"
            >
              Explore
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  exploreOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {exploreOpen && (
              <div className="absolute top-full left-0 mt-2 bg-[#0a0a12]/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg py-2 min-w-[180px] animate-slideDown">
                <a
                  href="/positions"
                  className="block px-4 py-2 hover:bg-white/5 hover:text-neon-cyan transition"
                  onClick={() => setExploreOpen(false)}
                >
                  Today's Sky
                </a>
                <a
                  href="/lunar"
                  className="block px-4 py-2 hover:bg-white/5 hover:text-neon-purple transition"
                  onClick={() => setExploreOpen(false)}
                >
                  Lunar Events
                </a>
              </div>
            )}
          </div>

          <a href={getBirthChartLink()} className="hover:text-neon-magenta transition">Birth Chart</a>

          {/* About Submenu */}
          <div className="relative" ref={aboutRef}>
            <button
              onClick={() => {
                setAboutOpen(!aboutOpen);
                setExploreOpen(false);
              }}
              className="flex items-center gap-1 hover:text-neon-cyan transition"
            >
              About
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${
                  aboutOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-2 bg-[#0a0a12]/95 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg py-2 min-w-[180px] animate-slideDown">
                <a
                  href="/about-z13"
                  className="block px-4 py-2 hover:bg-white/5 hover:text-neon-cyan transition"
                  onClick={() => setAboutOpen(false)}
                >
                  About Z13
                </a>
                <a
                  href="/the-z13-story"
                  className="block px-4 py-2 hover:bg-white/5 hover:text-neon-yellow transition"
                  onClick={() => setAboutOpen(false)}
                >
                  The Z13 Story
                </a>
              </div>
            )}
          </div>

          {/* Account link (only for authenticated users) */}
          {authChecked && isAuthenticated && (
            <a href="/account" className="hover:text-neon-cyan transition">
              Account
            </a>
          )}

          <a
            href="/diagnostics"
            className="font-black text-lg tracking-wider text-neon-yellow drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] hover:drop-shadow-[0_0_12px_rgba(250,204,21,1)] transition-all"
          >
            DEVELOPMENT VERSION
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-gray-200"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
    </nav>
    
    {/* Mobile Slide-Out Menu - Outside nav for proper z-index */}
    {open && (
      <>
        {/* Backdrop */}
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[110]"
          style={{ top: '73px', pointerEvents: 'auto' }}
          onClick={(e) => {
            // Only close if clicking directly on backdrop, not on menu
            if (e.target === e.currentTarget) {
              setOpen(false);
              setExploreOpen(false);
              setAboutOpen(false);
            }
          }}
        />
        {/* Slide-in menu from right */}
        <div 
          data-mobile-menu
          className="md:hidden fixed right-0 w-80 max-w-[85vw] bg-[#0a0a12] border-l-2 border-gray-700 shadow-2xl z-[120] overflow-y-auto"
          style={{ 
            top: '73px',
            bottom: '0',
            transform: 'translateX(0)',
            animation: 'slideInFromRight 0.3s ease-out'
          }}
          onClick={(e) => {
            // Stop event propagation so clicks on menu don't trigger backdrop
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Also stop mousedown events
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col text-gray-200 px-6 py-4 space-y-2 text-lg h-full">
            <div className="flex-1">
              {/* Daily Vibes link (only for authenticated users, at top) */}
              {authChecked && isAuthenticated && (
                <a
                  href="/"
                  className="py-2 hover:text-neon-cyan transition block"
                  onClick={() => setOpen(false)}
                >
                  Daily Vibes
                </a>
              )}
              
              {/* Explore Submenu */}
              <div>
                <button
                  onClick={() => setExploreOpen(!exploreOpen)}
                  className="w-full flex items-center justify-between py-2 hover:text-neon-cyan transition"
                >
                  <span>Explore</span>
                  <ChevronRight
                    size={20}
                    className={`transition-transform duration-200 ${
                      exploreOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {exploreOpen && (
                  <div className="pl-4 space-y-2 animate-slideRight">
                    <a
                      href="/positions"
                      className="block py-2 hover:text-neon-cyan transition"
                      onClick={() => {
                        setOpen(false);
                        setExploreOpen(false);
                      }}
                    >
                      Today's Sky
                    </a>
                    <a
                      href="/lunar"
                      className="block py-2 hover:text-neon-purple transition"
                      onClick={() => {
                        setOpen(false);
                        setExploreOpen(false);
                      }}
                    >
                      Lunar Events
                    </a>
                  </div>
                )}
              </div>

              <a
                href={getBirthChartLink()}
                className="py-2 hover:text-neon-magenta transition block"
                onClick={() => setOpen(false)}
              >
                Birth Chart
              </a>

              {/* About Submenu */}
              <div>
                <button
                  onClick={() => setAboutOpen(!aboutOpen)}
                  className="w-full flex items-center justify-between py-2 hover:text-neon-cyan transition"
                >
                  <span>About</span>
                  <ChevronRight
                    size={20}
                    className={`transition-transform duration-200 ${
                      aboutOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {aboutOpen && (
                  <div className="pl-4 space-y-2 animate-slideRight">
                    <a
                      href="/about-z13"
                      className="block py-2 hover:text-neon-cyan transition"
                      onClick={() => {
                        setOpen(false);
                        setAboutOpen(false);
                      }}
                    >
                      About Z13
                    </a>
                    <a
                      href="/the-z13-story"
                      className="block py-2 hover:text-neon-yellow transition"
                      onClick={() => {
                        setOpen(false);
                        setAboutOpen(false);
                      }}
                    >
                      The Z13 Story
                    </a>
                  </div>
                )}
              </div>

              {/* Account link (only for authenticated users) */}
              {authChecked && isAuthenticated && (
                <a
                  href="/account"
                  className="py-2 hover:text-neon-cyan transition block"
                  onClick={() => setOpen(false)}
                >
                  Account
                </a>
              )}

              <a
                href="/diagnostics"
                className="font-black text-base tracking-wider text-neon-yellow drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] hover:drop-shadow-[0_0_12px_rgba(250,204,21,1)] transition-all pt-2 block"
                onClick={() => setOpen(false)}
              >
                DEVELOPMENT VERSION
              </a>
            </div>

            {/* Login/Join button at bottom (only for unauthenticated users) */}
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-700/40 mt-auto">
                {authChecked ? (
                  <a
                    href="/auth/login"
                    className="w-full block text-center px-6 py-4 text-base rounded-lg font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta transition-all duration-300"
                    onClick={() => setOpen(false)}
                  >
                    Login/Join
                  </a>
                ) : (
                  <a
                    href="/auth/login"
                    className="w-full block text-center px-6 py-4 text-base rounded-lg font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta transition-all duration-300 opacity-75"
                    onClick={() => setOpen(false)}
                  >
                    Login/Join
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    )}
    </>
  );
}