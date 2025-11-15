import { NeonButton } from "../ui/NeonButton";
import { GradientText } from "../ui/NeonGradient";

export function Hero() {
  return (
    <section className="text-center pt-16 pb-20 px-6 max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
        Discover Astrology <br />
        From <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400 text-transparent bg-clip-text">
  Both Worlds
</span>
      </h1>

      <p className="text-gray-300 text-lg max-w-md mx-auto mb-10">
        Tropical and True-Sky Zodiac, together in one place — powered by real NASA JPL data.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 justify-center">
        <NeonButton className="w-full md:w-auto">
          Find Your Real Sign
        </NeonButton>

        <NeonButton className="w-full md:w-auto">
          Explore Today’s Sky
        </NeonButton>

        <NeonButton className="w-full md:w-auto">
          Lunar Calendar
        </NeonButton>
      </div>
    </section>
  );
}