import { ZodiacModeProvider } from "../../contexts/ZodiacModeContext";
import { Navbar } from "../../layouts/Navbar.jsx";

export function ClientLayoutWrapper({ children }) {
  return (
    <ZodiacModeProvider>
      <Navbar />
      {children}
    </ZodiacModeProvider>
  );
}

