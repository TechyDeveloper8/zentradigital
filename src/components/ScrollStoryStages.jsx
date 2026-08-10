import React, { useState, useEffect } from 'react';
import { Eye, Share2, Zap, Cpu, TrendingUp } from 'lucide-react';

export default function ScrollStoryStages() {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      num: 'STAGE 01',
      title: 'ATTENTION',
      text: 'Get noticed.',
      icon: Eye,
      subtext: 'Social media icons and content elements capture initial audience visibility.',
    },
    {
      num: 'STAGE 02',
      title: 'ENGAGEMENT',
      text: 'Build attention into engagement.',
      icon: Share2,
      subtext: 'Content, influencer marketing, advertising, and social channels connect.',
    },
    {
      num: 'STAGE 03',
      title: 'CONVERSION',
      text: 'Turn attention into action.',
      icon: Zap,
      subtext: 'Websites, ad landing pages, and analytics transform engagement into leads.',
    },
    {
      num: 'STAGE 04',
      title: 'AUTOMATION',
      text: 'Make growth smarter.',
      icon: Cpu,
      subtext: 'CRM pipelines and AI chatbot objects automate long-term customer operations.',
    },
    {
      num: 'STAGE 05',
      title: 'SCALE',
      text: 'EVERYTHING CONNECTS.',
      icon: TrendingUp,
      subtext: 'All digital elements unify into one scalable growth ecosystem.',
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById('scroll-story');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight * 0.7 && rect.bottom > 0) {
        const progress = (windowHeight * 0.7 - rect.top) / rect.height;
        const index = Math.min(
          stages.length - 1,
          Math.max(0, Math.floor(progress * stages.length))
        );
        setActiveStage(index);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stages.length]);

  return (
    <section
      id="scroll-story"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Narrative Flow Bar */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
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
            // THE DIGITAL ECOSYSTEM JOURNEY
          </span>
          <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, color: '#0A0A0A', textTransform: 'uppercase' }}>
            CONTENT → ADS → WEBSITE → LEADS → CRM → AI → <span style={{ color: '#E00000' }}>GROWTH</span>
          </h2>
        </div>

        {/* 5 Interactive Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '4rem',
          }}
        >
          {stages.map((stage, idx) => {
            const IconComp = stage.icon;
            const isActive = activeStage === idx;

            return (
              <div
                key={stage.num}
                onClick={() => setActiveStage(idx)}
                style={{
                  padding: '2rem 1.5rem',
                  background: isActive ? '#0A0A0A' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#0A0A0A',
                  border: isActive ? '1px solid #0A0A0A' : '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderTop: isActive ? '4px solid #E00000' : '1px solid var(--border-subtle)',
                }}
                data-cursor={stage.num}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isActive ? '#E00000' : '#888888', fontWeight: 700 }}>
                    {stage.num}
                  </span>
                  <IconComp size={20} color={isActive ? '#E00000' : '#0A0A0A'} />
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  {stage.title}
                </h3>
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: isActive ? '#FFFFFF' : '#E00000', marginBottom: '0.75rem' }}>
                  {stage.text}
                </p>
                <p style={{ fontSize: '0.85rem', color: isActive ? '#CCCCCC' : '#555555', lineHeight: 1.5 }}>
                  {stage.subtext}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stage 05 Scale Reveal Banner */}
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: '#0A0A0A',
            color: '#FFFFFF',
            borderRadius: '12px',
            position: 'relative',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#E00000', letterSpacing: '0.2em', display: 'block', marginBottom: '1rem', fontWeight: 700 }}>
            STAGE 05 // SCALE
          </span>

          <h3 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', color: '#FFFFFF' }}>
            EVERYTHING CONNECTS.
          </h3>

          <div style={{ display: 'inline-block', position: 'relative' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              ZENTRA DIGITAL
            </span>
            <div style={{ height: '4px', width: '100%', backgroundColor: '#E00000', marginTop: '0.5rem', borderRadius: '2px' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
