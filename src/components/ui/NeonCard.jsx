// components/ui/NeonCard.jsx

export function NeonCard({ title, icon, children }) {
  return (
    <div
      className="
        block
        w-full 
        h-full
        p-6 
        rounded-xl 
        bg-white/5 
        border border-gray-700/40 
        backdrop-blur-sm
        transition-all 
        duration-500
        shadow-neon
      "
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {icon && <span className="text-2xl">{icon}</span>}
        <h3 className="text-lg md:text-xl font-semibold text-gray-100">
          {title}
        </h3>
      </div>

      {/* Body text */}
      <div className="text-gray-300 text-sm md:text-base leading-relaxed">
        {children}
      </div>
    </div>
  );
}