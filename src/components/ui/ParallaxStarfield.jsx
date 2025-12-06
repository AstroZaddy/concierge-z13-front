import { useEffect, useState } from "react";

export function ParallaxStarfield() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
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

  // Only render stars on client to avoid hydration mismatch
  if (!mounted) {
    return <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10"></div>;
  }

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
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate star positions only on client
    const starPositions = Array.from({ length: count }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
    }));
    setStars(starPositions);
  }, [count]);

  if (stars.length === 0) {
    return null;
  }

  return (
    <>
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: `rgba(255,255,255,${opacity})`,
            boxShadow: `0 0 ${size * 3}px rgba(255,255,255,${opacity})`
          }}
        />
      ))}
    </>
  );
}