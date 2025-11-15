import { useState } from "react";
import { ZodiacToggle } from "../ui/ZodiacToggle";
import { NeonCard } from "../ui/NeonCard";
import { GradientText } from "../ui/NeonGradient";
import { Sun, Stars } from "lucide-react"; 

export function DualSystemSection() {
  const [system, setSystem] = useState("tropical");
  const gradientClass =
  "bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400 text-transparent bg-clip-text";

  return (
    <section className="py-16 px-4 max-w-5xl mx-auto text-center">
      {/* Toggle */}
      <div className="mb-10">
        <ZodiacToggle value={system} onChange={setSystem} />
      </div>

      {/* Cards */}
      <div className="flex flex-col md:flex-row justify-center gap-6">
        {/* Tropical Card */}
        <div
          className={`transition-all duration-500 w-full md:w-1/2 ${
            system === "tropical"
              ? "scale-[1.02] shadow-neon border-neon-cyan"
              : "opacity-80"
          }`}
        >
          <NeonCard
            icon={<Sun className="text-neon-yellow" size={28} />}
            title="Tropical Zodiac"
          >
            <p className="mb-4">
              The classic Western zodiac based on the seasons and psychological archetypes.
              Reflective, symbolic, and deeply familiar.
            </p>
            <a
              href="/the-z13-story#tropical"
              className="text-neon-purple hover:text-white transition-colors font-medium"
            >
              Learn More →
            </a>
          </NeonCard>
        </div>

        {/* Z13 True-Sky Card */}
        <div
          className={`transition-all duration-500 w-full md:w-1/2 ${
            system === "z13"
              ? "scale-[1.02] shadow-neon-magenta border-neon-purple"
              : "opacity-80"
          }`}
        >
          <NeonCard
            icon={<Stars className="text-neon-cyan" size={28} />}
            title="Z13 True-Sky Zodiac"
          >
            <p className="mb-4">
              The astronomical zodiac based on where the constellations actually are in the sky—
              calculated using NASA JPL ephemeris data.
            </p>
            <a
              href="/the-z13-story#z13"
              className="text-neon-cyan hover:text-white transition-colors font-medium"
            >
              Learn More →
            </a>
          </NeonCard>
        </div>
      </div>

      {/* Little supportive line below */}
      <p className="text-gray-400 mt-6 text-sm">
        Two lenses. One cosmos. <span className={gradientClass}>Explore them both.</span>
      </p>
    </section>
  );
}