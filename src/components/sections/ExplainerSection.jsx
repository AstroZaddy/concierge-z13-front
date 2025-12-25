import { Sun, Stars } from "lucide-react";

const gradientClass =
  "bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400 text-transparent bg-clip-text";

export function ExplainerSection() {
  return (
    <section className="py-10 px-4 max-w-5xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-12">
        Why{" "}
        <span className={gradientClass}>
          Two Zodiacs?
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
        {/* Tropical */}
        <div className="p-6 rounded-xl border border-gray-700/40 bg-white/5 backdrop-blur-sm hover:shadow-neon transition-all duration-500">
          <div className="flex items-center gap-3 mb-3">
            <Sun className="text-neon-yellow" size={28} />
            <h3 className="text-xl font-semibold">Tropical Zodiac</h3>
          </div>

          <p className="text-gray-300 leading-relaxed">
            The Tropical zodiac is the one you are probably most familiar with, 
            based on Earth's seasons and psychological
            archetypes. It’s symbolic, reflective, and deeply rooted in Western
            astrology traditions. Most horoscopes you see online use this system.
          </p>
        </div>

        {/* True-Sky */}
        <div className="p-6 rounded-xl border border-gray-700/40 bg-white/5 backdrop-blur-sm hover:shadow-neon-magenta transition-all duration-500">
          <div className="flex items-center gap-3 mb-3">
            <Stars className="text-neon-cyan" size={28} />
            <h3 className="text-xl font-semibold">Z13 True-Sky Zodiac</h3>
          </div>

          <p className="text-gray-300 leading-relaxed">
            The Z13 True-Sky zodiac follows the{" "}
            <strong>actual constellations</strong> in space - with their real
            sizes, boundaries, and positions. It’s the astrology of what you see in the sky, 
            and has a 'soul deep' connection to the stars. 🌟 
          </p>
        </div>
      </div>

      {/* Divider line */}
      <p className="text-gray-400 mt-10 text-sm">
        Both systems have value.{" "}
        <span className={gradientClass}>
          You get to explore them together by clicking the toggle at the top of the page.
        </span> ☝️
      </p>
    </section>
  );
}