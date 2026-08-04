import { HomeHeader } from "./HomeHeader";
import { HeroSection } from "./HeroSection";
import { SandboxSection } from "./SandboxSection";
import { FeaturesSection } from "./FeaturesSection";
import { ComparisonSection } from "./ComparisonSection";
import { PricingSection } from "./PricingSection";
import { HomeFooter } from "./HomeFooter";

export function HomeView() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-clip">
      {/* Background Gradients & Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-linear-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-96 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <HomeHeader />
      <HeroSection />
      <SandboxSection />
      <FeaturesSection />
      <ComparisonSection />
      <PricingSection />
      <HomeFooter />
    </div>
  );
}
