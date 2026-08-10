import React, { useState } from 'react';
import { Search, Map, Paintbrush, Rocket, Sliders, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function Process() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'DISCOVER',
      icon: Search,
      short: 'Understand the business.',
      details: 'Deep analysis into business goals, audience demographics, local market opportunity, and competitor positioning.',
    },
    {
      num: '02',
      title: 'STRATEGIZE',
      icon: Map,
      short: 'Define the strategy.',
      details: 'Formulate an actionable roadmap covering campaign channels, technology integrations, and performance goals.',
    },
    {
      num: '03',
      title: 'CREATE',
      icon: Paintbrush,
      short: 'Build the creative and digital assets.',
      details: 'Develop commercial product shoots, visual ad creative, brand websites, CRM pipelines, and AI chatbots.',
    },
    {
      num: '04',
      title: 'LAUNCH',
      icon: Rocket,
      short: 'Put the strategy into action.',
      details: 'Deploy campaign ad suites across channels, launch digital assets, and initiate live tracking.',
    },
    {
      num: '05',
      title: 'OPTIMIZE',
      icon: Sliders,
      short: 'Analyze and improve.',
      details: 'Analyze live performance data, optimize ad spend allocation, and continuously improve campaign responses.',
    },
    {
      num: '06',
      title: 'SCALE',
      icon: TrendingUp,
      short: 'Build on what works.',
      details: 'Double down on high-performing channels and scale brand presence into broader regional markets.',
    },
  ];

  return (
    <section id="process" className="section-padding" style={{ position: 'relative', zIndex: 2, backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: '#E00000',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.75rem',
              fontWeight: 700,
            }}
          >
            // EXECUTION PROTOCOL
          </span>
          <h2
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
              lineHeight: 1.05,
              fontWeight: 800,
              color: '#0A0A0A',
              textTransform: 'uppercase',
            }}
          >
            HOW WE MOVE <span style={{ color: '#E00000' }}>BRANDS FORWARD.</span>
          </h2>
        </div>

        {/* Thin Red Progressive Line Indicator */}
        <div style={{ position: 'relative', width: '100%', height: '3px', backgroundColor: '#E5E5E5', marginBottom: '2.5rem', borderRadius: '2px' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: `${((activeStep + 1) / steps.length) * 100}%`,
              backgroundColor: '#E00000',
              transition: 'width 0.4s ease',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* 6 Step Horizontal Indicator Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.5rem',
            marginBottom: '2.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
          }}
          className="process-bar"
        >
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <button
                key={step.num}
                onClick={() => setActiveStep(idx)}
                style={{
                  padding: '1rem 0.5rem',
                  background: isActive ? '#0A0A0A' : '#FFFFFF',
                  border: isActive ? '1px solid #0A0A0A' : '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: isActive ? '#FFFFFF' : '#0A0A0A',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  minWidth: '100px',
                }}
                data-cursor={`STEP ${step.num}`}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: isActive ? '#E00000' : '#888888' }}>
                  {step.num}
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 800, marginTop: '0.25rem', textTransform: 'uppercase' }}>
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Step Card */}
        {(() => {
          const current = steps[activeStep];
          const IconComp = current.icon;
          return (
            <div
              style={{
                padding: '3rem',
                background: '#FFFFFF',
                border: '1px solid var(--border-dark)',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '3rem',
                alignItems: 'center',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.06)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(224, 0, 0, 0.08)',
                      color: '#E00000',
                    }}
                  >
                    <IconComp size={32} />
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#E00000', fontWeight: 800 }}>
                      PHASE {current.num}
                    </span>
                    <h3 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0A0A0A', textTransform: 'uppercase' }}>{current.title}</h3>
                  </div>
                </div>

                <p style={{ fontSize: '1.25rem', color: '#0A0A0A', fontWeight: 700, lineHeight: 1.5, marginBottom: '1rem' }}>
                  {current.short}
                </p>

                <p style={{ color: '#555555', fontSize: '1rem', lineHeight: 1.6, fontWeight: 500 }}>
                  {current.details}
                </p>
              </div>

              <div
                style={{
                  padding: '2.2rem',
                  background: '#0A0A0A',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <CheckCircle2 size={42} color="#E00000" style={{ marginBottom: '1rem' }} />
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  CLIENT-ALIGNED EXECUTION
                </h4>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#CCCCCC' }}>
                  Transparent status updates & data analytics at every milestone.
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .process-bar {
            grid-template-columns: repeat(6, 120px) !important;
          }
        }
      `}</style>
    </section>
  );
}
