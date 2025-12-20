import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavbarZodiacToggle } from "../components/ui/NavbarZodiacToggle";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-white/5 border-b border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Logo and Toggle */}
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center">
            <img 
              src="/z13_logo.png" 
              alt="Z13 Astrology" 
              className="h-8 w-auto"
            />
          </a>
          <NavbarZodiacToggle />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-gray-200 text-sm">
          <a href="/positions" className="hover:text-neon-cyan transition">Today's Sky</a>
          <a href="/lunar" className="hover:text-neon-purple transition">Lunar Events</a>
          <a href="/natal/create" className="hover:text-neon-magenta transition">Birth Chart</a>
          <a href="/about-z13" className="hover:text-neon-cyan transition">About Z13</a>
          <a href="/the-z13-story" className="hover:text-neon-yellow transition">The Z13 Story</a>
          <span className="font-black text-lg tracking-wider text-neon-yellow drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
            DEVELOPMENT VERSION
          </span>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-gray-200"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Slide-Out Menu */}
      {open && (
        <div className="md:hidden bg-[#0a0a12]/95 border-t border-gray-800">
          <div className="flex flex-col text-gray-200 px-6 py-4 space-y-4 text-lg">
            <a href="/positions" className="hover:text-neon-cyan transition">Today's Sky</a>
            <a href="/lunar" className="hover:text-neon-purple transition">Lunar Events</a>
            <a href="/natal/create" className="hover:text-neon-magenta transition">Birth Chart</a>
            <a href="/about-z13" className="hover:text-neon-cyan transition">About Z13</a>
            <a href="/the-z13-story" className="hover:text-neon-yellow transition">The Z13 Story</a>
            <span className="font-black text-base tracking-wider text-neon-yellow drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] pt-2">
              DEVELOPMENT VERSION
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}