export function ConstellationDivider() {
    return (
      <div className="w-full flex justify-center my-6">
        <div className="relative flex items-center gap-3">
  
          {/* Left Line */}
          <span className="h-[1px] w-20 bg-gradient-to-r from-transparent via-gray-700 to-gray-500"></span>
  
          {/* Stars */}
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-neon-purple shadow-[0_0_6px_rgba(168,85,247,0.7)]"></span>
            <span className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(56,189,248,0.8)] twinkle"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-neon-magenta shadow-[0_0_7px_rgba(217,70,239,0.8)]"></span>
          </div>
  
          {/* Right Line */}
          <span className="h-[1px] w-20 bg-gradient-to-l from-transparent via-gray-700 to-gray-500"></span>
  
        </div>
      </div>
    );
  }