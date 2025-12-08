import { NeonButton } from "../ui/NeonButton";
import { GradientText } from "../ui/NeonGradient";

export function Hero() {
  return (
    <section className="text-center pt-16 pb-20 px-6 max-w-3xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
        Z13 Astrology </h1>
        <h2 className="text-2xl md:text-4xl font-extrabold mb-4 leading-tight">
        Showing you the <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400 text-transparent bg-clip-text">
  cosmic breadcrumbs
</span> that are lighting up your life path.
      </h2>

      <p className="text-gray-300 text-lg max-w-md mx-auto mb-10">
        Classical (Tropical) and True-Sky (Sidereal) Zodiac, together in one place - powered by real NASA JPL data.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 justify-center">

        <NeonButton href="/positions" className="w-full md:w-auto">
          Explore Today's Sky
        </NeonButton>

        <NeonButton href="/lunar" className="w-full md:w-auto">
          Lunar Calendar
        </NeonButton>

        <NeonButton href="/natal/create" className="w-full md:w-auto">
          Find Your Real Sign
        </NeonButton>
      </div>
    </section>
  );
}