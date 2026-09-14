import React from 'react';
import { Check, X, Minus, Sparkles, ArrowRight, ShieldCheck, Users, Zap } from 'lucide-react';

export default function USPComparison({ onOpenProjectModal }) {
  const comparisonItems = [
    {
      feature: 'Total Cost & Overhead',
      inHouse: 'High payroll (₹1.5L - ₹3L+/mo) + PF, hiring costs, bonuses & workspace',
      freelancer: 'Unpredictable hourly/gig rates; scope creep quickly escalates billing',
      zentra: 'Predictable flat monthly partnership; full agency access at a fraction of 1 salary',
    },
    {
      feature: 'Skill Diversity & Depth',
      inHouse: 'Limited to 1-2 skills of the hired employee; requires 4-5 hires for a team',
      freelancer: 'Fragmented; no cohesion between your designer, video editor, and ad buyer',
      zentra: 'Full-stack growth team: Performance Marketers, 4K Video Directors, Copywriters & Engineers',
    },
    {
      feature: 'Speed to Execution',
      inHouse: '4-8 weeks wasted on recruitment, interviews, contracts, and onboarding',
      freelancer: 'Inconsistent turnaround times; competing client gigs & ghosting risk',
      zentra: 'Immediate Day 1 kickoff; rapid 24-48h sprint deliveries with proven SOPs',
    },
    {
      feature: 'Technology & Tooling',
      inHouse: 'Company must pay extra for Adobe, Meta ad tools, hosting, and CRM licenses',
      freelancer: 'Disconnected personal tools; zero centralized enterprise infrastructure',
      zentra: 'Enterprise CRM portal, AI chatbot automation, client review center & analytics included',
    },
    {
      feature: 'Accountability & ROI',
      inHouse: 'Fixed salary paid monthly regardless of campaign performance or ROAS',
      freelancer: 'Task-only mindset ("delivered the file"); zero accountability for revenue',
      zentra: 'Obsessed with business ROI, qualified lead generation, and scalable ROAS targets',
    },
    {
      feature: 'Management Drag',
      inHouse: 'Heavy daily supervision required; time lost in standups, reviews, and HR',
      freelancer: 'High coordination chaos; constant follow-ups across scattered WhatsApp threads',
      zentra: 'Zero management drag; dedicated leadership, automated workflows & seamless delivery',
    },
  ];

  return (
    <section
      id="usp"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ marginBottom: '3.5rem' }} className="mobile-text-center">
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              color: '#E00000',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.75rem',
              fontWeight: 700,
            }}
          >
            OUR UNIQUE ADVANTAGE
          </span>
          <h2
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#0A0A0A',
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
            }}
          >
            HOW ZENTRA COMPARES <br />
            <span style={{ color: '#E00000' }}>TO THE ALTERNATIVES.</span>
          </h2>
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: '#666666',
              maxWidth: '680px',
              marginTop: '1rem',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Why ambitious founders choose our integrated growth model over the risk of fragmented freelancers or expensive in-house overhead.
          </p>
        </div>

        {/* 3 Comparative Option Headers on Desktop */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
            alignItems: 'stretch',
          }}
        >
          {/* Card 1: In-House Hire */}
          <div
            style={{
              background: '#F9F9F9',
              border: '1px solid #E5E5E5',
              borderRadius: '12px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#777777',
                    background: '#ECECEC',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  Option A
                </span>
                <Users size={20} color="#777777" />
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1A1A1A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                In-House Hire
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#666666', lineHeight: 1.5, marginBottom: '2rem' }}>
                Salaried full-time employees with overhead, training delays, and limited singular skillsets.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {comparisonItems.map((item, idx) => (
                  <div key={idx} style={{ borderTop: '1px solid #EBEBEB', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888888', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                      {item.feature}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                      <X size={16} color="#DC2626" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.88rem', color: '#444444', lineHeight: 1.5, fontWeight: 500 }}>
                        {item.inHouse}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E5E5E5', textAlign: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#888888' }}>
                High overhead • Slow scaling
              </span>
            </div>
          </div>

          {/* Card 2: Freelancers */}
          <div
            style={{
              background: '#F9F9F9',
              border: '1px solid #E5E5E5',
              borderRadius: '12px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#777777',
                    background: '#ECECEC',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '4px',
                    letterSpacing: '0.05em',
                  }}
                >
                  Option B
                </span>
                <Minus size={20} color="#777777" />
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1A1A1A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Freelancers
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#666666', lineHeight: 1.5, marginBottom: '2rem' }}>
                Individual gig contractors scattered across platforms with zero team cohesion or accountability.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {comparisonItems.map((item, idx) => (
                  <div key={idx} style={{ borderTop: '1px solid #EBEBEB', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888888', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                      {item.feature}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                      <Minus size={16} color="#EA580C" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.88rem', color: '#444444', lineHeight: 1.5, fontWeight: 500 }}>
                        {item.freelancer}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E5E5E5', textAlign: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#888888' }}>
                Unpredictable • Management chaos
              </span>
            </div>
          </div>

          {/* Card 3: Zentra Digital (FLAGSHIP HIGHLIGHT) */}
          <div
            style={{
              background: 'linear-gradient(165deg, #0A0A0A 0%, #141414 100%)',
              border: '2px solid #E00000',
              borderRadius: '12px',
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 12px 40px rgba(224, 0, 0, 0.22)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle glow background */}
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                right: '-30px',
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle, rgba(224, 0, 0, 0.3) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#FFFFFF',
                    background: '#E00000',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '9999px',
                    letterSpacing: '0.08em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 0 15px rgba(224, 0, 0, 0.5)',
                  }}
                >
                  <Sparkles size={12} />
                  RECOMMENDED
                </span>
                <ShieldCheck size={22} color="#E00000" />
              </div>

              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                Zentra Digital<span style={{ color: '#E00000' }}>.</span>
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#CCCCCC', lineHeight: 1.5, marginBottom: '2rem', fontWeight: 500 }}>
                Dedicated multi-disciplinary agency squad with proprietary CRM, speed execution, and guaranteed ROI focus.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {comparisonItems.map((item, idx) => (
                  <div key={idx} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E00000', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                      {item.feature}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: '#E00000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '0.15rem',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: '0.88rem', color: '#FFFFFF', lineHeight: 1.5, fontWeight: 600 }}>
                        {item.zentra}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <button
                onClick={onOpenProjectModal}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem 1.5rem',
                  fontSize: '0.92rem',
                  justifyContent: 'center',
                }}
              >
                <span>CHOOSE ZENTRA DIGITAL</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
