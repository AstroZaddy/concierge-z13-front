export function Footer() {
    return (
      <footer className="py-12 px-6 mt-20 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 mb-3">
            Astronomically Informed • Spiritually Curious
          </p>
  
          <div className="flex justify-center gap-6 text-sm mb-6 text-gray-300">
            <a href="/about-z13" className="hover:text-neon-cyan transition">About</a>
            <a href="/the-z13-story" className="hover:text-neon-purple transition">The Z13 Story</a>
            <a href="/positions" className="hover:text-neon-magenta transition">Today’s Sky</a>
            <a href="/natal/create" className="hover:text-neon-yellow transition">Birth Chart</a>
          </div>
  
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Z13 Astrology. Built with stars, math, and a little magic.
          </p>
        </div>
      </footer>
    );
  }