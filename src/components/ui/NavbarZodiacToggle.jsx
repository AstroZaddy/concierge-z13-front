import { useZodiacMode } from "../../contexts/ZodiacModeContext";
import { useState, useEffect, useRef } from "react";

export function NavbarZodiacToggle() {
  const { mode, setMode } = useZodiacMode();
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef(null);
  
  const currentMode = mode || "z13";

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    };

    if (showInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInfo]);

  const handleZ13Click = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMode("z13");
  };

  const handleTropicalClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMode("tropical");
  };

  return (
    <div 
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "4px 8px",
        borderRadius: "6px",
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
      }}
    >
      {/* Compact Label */}
      <span style={{
        fontSize: "11px",
        color: "#9ca3af",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        whiteSpace: "nowrap",
      }}>
        System
      </span>
      
      {/* Divider */}
      <div style={{ 
        width: "1px", 
        height: "16px", 
        backgroundColor: "rgba(255,255,255,0.1)" 
      }} />

      {/* Info Badge */}
      <div ref={infoRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowInfo(!showInfo);
          }}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: "13px",
            padding: "2px 4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#9ca3af";
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6b7280";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          aria-label="What is zodiac system?"
        >
          ⓘ
        </button>
        
        {/* Info Popover */}
        {showInfo && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: "8px",
            padding: "12px",
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#e5e7eb",
            width: "280px",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            lineHeight: "1.5",
          }}>
            <div style={{ fontWeight: "600", marginBottom: "8px", fontSize: "13px" }}>
              Zodiac System Selection
            </div>
            <div style={{ marginBottom: "10px" }}>
              <div style={{ marginBottom: "6px" }}>
                <strong style={{ color: "#38bdf8" }}>Z13:</strong> 13 signs, true-sky sizes
              </div>
              <div>
                <strong style={{ color: "#a855f7" }}>Tropical:</strong> 12 equal signs, seasonal
              </div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowInfo(false);
              }}
              style={{
                width: "100%",
                padding: "6px 12px",
                backgroundColor: "#374151",
                border: "none",
                borderRadius: "4px",
                color: "#e5e7eb",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "500",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#4b5563";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#374151";
              }}
            >
              Got it
            </button>
          </div>
        )}
      </div>

      {/* Toggle Buttons Container */}
      <div 
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
      <button
        type="button"
        style={{ 
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          userSelect: "none",
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
        }}
        onClick={handleZ13Click}
        aria-label="Switch to Z13 mode"
        aria-pressed={currentMode === "z13"}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            border: "2px solid",
            borderColor: currentMode === "z13" ? "#22d3ee" : "#4b5563",
            backgroundColor: currentMode === "z13" ? "#0891b2" : "transparent",
            boxShadow: currentMode === "z13" 
              ? "0 0 8px rgba(56,189,248,0.6)" 
              : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {currentMode === "z13" && (
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
              }}
            />
          )}
        </div>
        <span
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: currentMode === "z13" ? "#38bdf8" : "#9ca3af",
            fontFamily: "Arial, sans-serif",
            display: "block",
            whiteSpace: "nowrap",
          }}
        >
          Z13
        </span>
      </button>
      <button
        type="button"
        style={{ 
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          userSelect: "none",
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
        }}
        onClick={handleTropicalClick}
        aria-label="Switch to Tropical mode"
        aria-pressed={currentMode === "tropical"}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            border: "2px solid",
            borderColor: currentMode === "tropical" ? "#c084fc" : "#4b5563",
            backgroundColor: currentMode === "tropical" ? "#9333ea" : "transparent",
            boxShadow: currentMode === "tropical" 
              ? "0 0 8px rgba(168,85,247,0.6)" 
              : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {currentMode === "tropical" && (
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
              }}
            />
          )}
        </div>
        <span
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: currentMode === "tropical" ? "#a855f7" : "#9ca3af",
            fontFamily: "Arial, sans-serif",
            display: "block",
            whiteSpace: "nowrap",
          }}
        >
          Tropical
        </span>
      </button>
      </div>
    </div>
  );
}

