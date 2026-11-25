import { ScrollReveal } from '@/components/landing/scroll-reveal';
import { LandingNavbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { About } from '@/components/landing/about';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { UserRoles } from '@/components/landing/user-roles';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#FFFDF7]">
      <LandingNavbar />
      <ScrollReveal />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <About />
        <UserRoles />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
