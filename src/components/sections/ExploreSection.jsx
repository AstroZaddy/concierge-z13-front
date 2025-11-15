import { Compass, Sparkles } from "lucide-react";

const gradient =
  "bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400 text-transparent bg-clip-text";

export function ExploreSection() {
  return (
    <section className="py-24 px-4 max-w-3xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        Explore the <span className={gradient}>Sky Even Further</span>
      </h2>

      <p className="text-gray-300 max-w-lg mx-auto mb-10 leading-relaxed">
        The cosmos is always moving, always shifting, always inviting you to look closer.  
        Z13 gives you the tools to explore astrology from every angle — symbolic, astronomical, 
        or intuitive. Follow your curiosity.
      </p>

      <a
        href="/about-z13"
        className="
          inline-flex items-center gap-2 
          px-6 py-3 rounded-xl 
          bg-white/10 border border-gray-700/40 
          backdrop-blur-sm 
          hover:shadow-neon 
          transition-all duration-300
          text-gray-100 font-semibold
        "
      >
        <Compass size={20} className="text-neon-cyan" />
        Learn About Z13
      </a>
    </section>
  );
}