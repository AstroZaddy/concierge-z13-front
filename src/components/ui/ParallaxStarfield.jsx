import { useEffect } from "react";

export function ParallaxStarfield() {
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY * 0.2; // subtle parallax
      const layers = document.querySelectorAll(".starfield-layer");

      layers.forEach((layer, i) => {
        const depth = (i + 1) * 0.6;
        layer.style.transform = `translateY(${-(offset / depth)}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      {/* Layer 1 — faint far stars */}
      <div className="starfield-layer absolute inset-0">
        <StarLayer count={40} size={1} opacity={0.3} />
      </div>

      {/* Layer 2 — medium stars */}
      <div className="starfield-layer absolute inset-0">
        <StarLayer count={25} size={1.5} opacity={0.5} />
      </div>

      {/* Layer 3 — closest stars */}
      <div className="starfield-layer absolute inset-0">
        <StarLayer count={12} size={2.5} opacity={0.8} />
      </div>
    </div>
  );
}

function StarLayer({ count, size, opacity }) {
  const stars = Array.from({ length: count });

  return (
    <>
      {stars.map((_, i) => {
        const top = Math.random() * 100;
        const left = Math.random() * 100;

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: `rgba(255,255,255,${opacity})`,
              boxShadow: `0 0 ${size * 3}px rgba(255,255,255,${opacity})`
            }}
          />
        );
      })}
    </>
  );
}