// components/ui/NeonButton.jsx

export function NeonButton({ children, className = "", ...props }) {
    return (
      <button
        {...props}
        className={`
          px-6 py-3 rounded-full font-semibold text-white
          bg-neon-gradient shadow-neon
          hover:shadow-neon-magenta hover:scale-[1.02]
          transition-all duration-300
          ${className}
        `}
      >
        {children}
      </button>
    )
  }