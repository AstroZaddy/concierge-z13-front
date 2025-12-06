export function Footer() {
    return (
      <footer className="py-12 px-6 mt-20 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 mb-3">
            Astronomically Informed • Spiritually Curious
          </p>
  
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Z13 Astrology. Built with stars, math, and a little magic.
          </p>
        </div>
      </footer>
    );
  }