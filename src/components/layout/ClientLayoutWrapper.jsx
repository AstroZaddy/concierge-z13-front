import { ZodiacModeProvider } from "../../contexts/ZodiacModeContext";
import { UserDataProvider } from "../../contexts/UserDataContext";
import { SessionBootstrapProvider } from "../../contexts/SessionBootstrapContext";
import { Navbar } from "../../layouts/Navbar.jsx";
import { LandingPageContent } from "../pages/LandingPageContent.jsx";
import { LoginPageContent } from "../pages/LoginPageContent.jsx";
import { BirthChartPageContent } from "../pages/BirthChartPageContent.jsx";
import { DefaultChartViewPage } from "../pages/DefaultChartViewPage.jsx";

export function ClientLayoutWrapper({ children, showLandingPage, showLoginPage, showBirthChartPage, showDefaultChartPage }) {
  return (
    <ZodiacModeProvider>
      <SessionBootstrapProvider>
      <UserDataProvider>
        <Navbar />
        {showLandingPage ? <LandingPageContent /> : showLoginPage ? <LoginPageContent /> : showBirthChartPage ? <BirthChartPageContent /> : showDefaultChartPage ? <DefaultChartViewPage /> : children}
      </UserDataProvider>
      </SessionBootstrapProvider>
    </ZodiacModeProvider>
  );
}

