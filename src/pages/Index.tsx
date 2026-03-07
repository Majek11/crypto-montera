import Navbar from "@/components/layout/Navbar";
import TickerBar from "@/components/layout/TickerBar";
import HeroSection from "@/components/features/HeroSection";
import StatsBar from "@/components/features/StatsBar";
import TrustedCompanies from "@/components/features/TrustedCompanies";
import AboutSection from "@/components/features/AboutSection";
import FeaturesGrid from "@/components/features/FeaturesGrid";
import InvestmentPlansPreview from "@/components/features/InvestmentPlansPreview";
import TestimonialsSection from "@/components/features/TestimonialsSection";
import FAQSection from "@/components/features/FAQSection";
import NewsletterSection from "@/components/features/NewsletterSection";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <TickerBar />
        <HeroSection />
        <StatsBar />
        <TrustedCompanies />
        <AboutSection />
        <FeaturesGrid />
        <InvestmentPlansPreview />
        <TestimonialsSection />
        <FAQSection />
        <NewsletterSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
