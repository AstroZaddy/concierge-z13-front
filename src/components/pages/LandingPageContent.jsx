import { Hero } from "../sections/Hero";
import { CtaRow } from "../sections/CtaRow";
import { ExplainerSection } from "../sections/ExplainerSection";
import { ExploreSection } from "../sections/ExploreSection";
import { DailyVibesSection } from "../sections/DailyVibesSection";
import { Footer } from "../../layouts/Footer";
import { useSessionBootstrap } from "../../contexts/SessionBootstrapContext";
import { ConstellationDivider } from "../ui/ConstellationDivider";
import { useMounted } from "../../hooks/useMounted";

export function LandingPageContent() {
  const mounted = useMounted();
  
  // Use session bootstrap data
  const {
    sessionState,
    hasCheckedAuth,
    user,
  } = useSessionBootstrap();

  if (!mounted) {
    return null;
  }

  const isAuthenticated = sessionState === "authenticated_has_chart" || sessionState === "authenticated_no_chart";
  const displayName = user?.display_name;
  const greetingName = displayName || "Celestial Seeker";

  // Show authenticated content only if auth check is complete and user is authenticated
  // Otherwise show anonymous content (optimistic rendering to avoid blank screen)
  const showAuthenticatedContent = hasCheckedAuth && isAuthenticated;

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {showAuthenticatedContent ? (
          <>
            {/* Authenticated User Content */}
            <section className="pt-28 pb-12 px-4">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Welcome back, {greetingName}
                </h1>
                <p className="text-xl md:text-2xl text-gray-300">
                  Here's your daily vibes!
                </p>
              </div>
            </section>
            
            <DailyVibesSection />
          </>
        ) : (
          <>
            {/* Anonymous User Content (shown by default, or if auth check completed and user is not authenticated) */}
            <Hero />
            <ConstellationDivider />
            <ExplainerSection />
            <ConstellationDivider />
            <CtaRow />
            <ConstellationDivider />
            <ExploreSection />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

