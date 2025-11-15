// components/ui/ZodiacToggle.jsx

export function ZodiacToggle({ value, onChange }) {
    return (
      <div className="flex bg-cosmic-light rounded-full p-1 w-max mx-auto shadow-card">
        <button
          onClick={() => onChange("tropical")}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all
            ${value === "tropical"
              ? "bg-neon-purple-blue text-white shadow-neon"
              : "text-neon-purple hover:text-white"
            }
          `}
        >
          Tropical Zodiac
        </button>
  
        <button
          onClick={() => onChange("z13")}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all
            ${value === "z13"
              ? "bg-neon-purple-blue text-white shadow-neon"
              : "text-neon-teal hover:text-white"
            }
          `}
        >
          Sidereal Zodiac
        </button>
      </div>
    )
  }