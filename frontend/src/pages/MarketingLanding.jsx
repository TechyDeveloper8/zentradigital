import React from 'react';
import CustomCursor from '../components/CustomCursor';
import DigitalBox3D from '../components/DigitalBox3D';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Services from '../components/Services';
import CaseStudies from '../components/CaseStudies';
import TrustProof from '../components/TrustProof';
import Testimonials from '../components/Testimonials';
import Team from '../components/Team';
import WhyZentra from '../components/WhyZentra';
import USPComparison from '../components/USPComparison';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

export default function MarketingLanding() {
  const handleOpenModal = () => {
    const whatsappUrl = `https://wa.me/916202050810?text=${encodeURIComponent('Hi Zentra Digital, I want to start a project!')}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* Custom Interactive Cursor */}
      <CustomCursor />

      {/* Single 3D Digital Box Container Scene */}
      <DigitalBox3D />

      {/* Header Navigation */}
      <Navbar onOpenProjectModal={handleOpenModal} />

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* Full-screen Hero (WE MAKE BRANDS IMPOSSIBLE TO IGNORE.) */}
        <Hero onOpenProjectModal={handleOpenModal} />

        {/* Section 2 (DIGITAL GROWTH, BUILT DIFFERENTLY.) */}
        <About />

        {/* Capabilities (WHAT WE DO. Informational list only, no redirection) */}
        <Services />

        {/* Portfolio (WORK THAT MOVES BRANDS.) */}
        <CaseStudies onOpenProjectModal={handleOpenModal} />

        {/* Client Network (BRANDS WE WORK WITH.) */}
        <TrustProof />

        {/* Testimonials (WHAT FOUNDERS & LEADERS SAY ABOUT US.) */}
        <Testimonials />

        {/* Team (THE LEADERSHIP & TEAM BEHIND ZENTRA.) */}
        <Team />

        {/* Why Zentra (MORE THAN MARKETING.) */}
        <WhyZentra />

        {/* USP Comparison (IN-HOUSE HIRE VS FREELANCER VS ZENTRA DIGITAL) */}
        <USPComparison onOpenProjectModal={handleOpenModal} />

        {/* Final CTA (READY TO GROW?) */}
        <FinalCTA onOpenProjectModal={handleOpenModal} />
      </main>

      {/* Minimal Black Footer */}
      <Footer />
    </div>
  );
}
