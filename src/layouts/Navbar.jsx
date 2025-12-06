import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavbarZodiacToggle } from "../components/ui/NavbarZodiacToggle";

export function Navbar() {
  const [open, setOpen] = useState(false);

  const gradient =
    "bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400 text-transparent bg-clip-text";

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-white/5 border-b border-gray-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Logo and Toggle */}
        <div className="flex items-center gap-4">
          <a href="/" className="text-2xl font-bold">
            <span className={gradient}>Z13</span>
          </a>
          <NavbarZodiacToggle />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-gray-200 text-sm">
          <a href="/positions" className="hover:text-neon-cyan transition">Today's Sky</a>
          <a href="/lunar" className="hover:text-neon-purple transition">Lunar Events</a>
          <a href="/natal/create" className="hover:text-neon-magenta transition">Birth Chart</a>
          <a href="/the-z13-story" className="hover:text-neon-yellow transition">Z13 Story</a>
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
            <a href="/the-z13-story" className="hover:text-neon-yellow transition">Z13 Story</a>
          </div>
        </div>
      )}
    </nav>
  );
}