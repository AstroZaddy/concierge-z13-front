// components/ui/NeonButton.jsx

export function NeonButton({ children, className = "", href, ...props }) {
    const baseClasses = `
      px-6 py-3 rounded-full font-semibold text-white
      bg-neon-gradient shadow-neon
      hover:shadow-neon-magenta hover:scale-[1.02]
      transition-all duration-300
      ${className}
    `;

    // If href is provided, render as anchor tag
    if (href) {
      return (
        <a
          href={href}
          className={baseClasses}
          {...props}
        >
          {children}
        </a>
      );
    }

    // Otherwise render as button
    return (
      <button
        {...props}
        className={baseClasses}
      >
        {children}
      </button>
    );
  }