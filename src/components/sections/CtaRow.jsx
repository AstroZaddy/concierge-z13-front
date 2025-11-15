import { NeonCard } from "../ui/NeonCard";
import { ArrowRightCircle, Map, Moon } from "lucide-react";

export function CtaRow() {
  return (
    <section className="py-20 px-4 max-w-6xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-12">
        Start Your <span className="gradient-text">Cosmic Journey</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1 */}
        <a href="/natal/create" className="block">
          <NeonCard
            icon={<ArrowRightCircle className="text-neon-purple" size={32} />}
            title="Find Your Real Sign"
          >
            <p>
              Discover your Tropical <strong>and</strong> Z13 True-Sky signs —
              side-by-side. Accurate, personal, and eye-opening.
            </p>
          </NeonCard>
        </a>

        {/* Card 2 */}
        <a href="/positions" className="block">
          <NeonCard
            icon={<Map className="text-neon-cyan" size={32} />}
            title="Explore Today’s Sky"
          >
            <p>
              See where the planets actually are <em>right now</em>.
              Updated live using NASA JPL ephemeris.
            </p>
          </NeonCard>
        </a>

        {/* Card 3 */}
        <a href="/lunar-events" className="block">
          <NeonCard
            icon={<Moon className="text-neon-magenta" size={32} />}
            title="Lunar Calendar"
          >
            <p>
              Track the Moon through Z13 signs, phases, ingresses, and
              energetic shifts. A daily ritual for the astro-aligned.
            </p>
          </NeonCard>
        </a>
      </div>
    </section>
  );
}