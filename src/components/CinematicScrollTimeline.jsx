import React, { useState, useEffect } from 'react';
import { Plane, Search, Map, Paintbrush, Zap, TrendingUp, ArrowRight } from 'lucide-react';

export default function CinematicScrollTimeline({ onOpenProjectModal }) {
  const [activeStage, setActiveStage] = useState(0);

  const stages = [
    {
      num: '01',
      title: 'DISCOVER',
      icon: Search,
      subtitle: 'Understanding Business & Audience',
      description: 'Understanding the business, market, audience, and opportunity to identify growth levers.',
    },
    {
      num: '02',
      title: 'STRATEGIZE',
      icon: Map,
      subtitle: 'Creating Growth Direction',
      description: 'Creating a clear digital growth direction with multi-channel performance roadmaps.',
    },
    {
      num: '03',
      title: 'CREATE',
      icon: Paintbrush,
      subtitle: 'Building Assets & Experiences',
      description: 'Building high-converting ad campaigns, content assets, modern websites, and digital experiences.',
    },
    {
      num: '04',
      title: 'PERFORM',
      icon: Zap,
      subtitle: 'Campaign Launch & Analytics',
      description: 'Launching targeted campaigns and measuring real-time customer feedback and performance metrics.',
    },
    {
      num: '05',
      title: 'GROW',
      icon: TrendingUp,
      subtitle: 'Long-term Scale & Momentum',
      description: 'Optimizing what works and building long-term sustainable brand momentum.',
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById('timeline');
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top < windowHeight * 0.7 && rect.bottom > 0) {
        const totalHeight = rect.height;
        const currentProgress = (windowHeight * 0.7 - rect.top) / totalHeight;
        const stageIndex = Math.min(
          stages.length - 1,
          Math.max(0, Math.floor(currentProgress * stages.length))
        );
        setActiveStage(stageIndex);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stages.length]);

  return (
    <section
      id="timeline"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: 'rgba(250, 250, 252, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1.2rem',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9999px',
              color: '#0052FF',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
            }}
          >
            <Plane size={16} />
            <span>CINEMATIC SCROLL JOURNEY</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 800,
              color: '#0A0D14',
              textTransform: 'uppercase',
            }}
          >
            FROM VISION TO <span className="text-gradient">MOMENTUM.</span>
          </h2>
          <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '600px', margin: '1rem auto 0 auto', fontWeight: 500 }}>
            Follow the trajectory as Zentra elevates your brand from grounded concept into market momentum.
          </p>
        </div>

        {/* Stages Timeline Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {stages.map((stage, idx) => {
            const IconComponent = stage.icon;
            const isActive = activeStage === idx;

            return (
              <div
                key={stage.num}
                onClick={() => setActiveStage(idx)}
                className="glass-panel"
                style={{
                  padding: '2rem 1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  borderTop: isActive ? '3px solid #0052FF' : '1px solid var(--border-subtle)',
                  background: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
                  transform: isActive ? 'translateY(-6px)' : 'none',
                  boxShadow: isActive ? '0 15px 35px -10px rgba(0, 82, 255, 0.18)' : 'none',
                  transition: 'all 0.4s ease',
                }}
                data-cursor={`STAGE ${stage.num}`}
              >
                {/* Stage Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: isActive ? '#0052FF' : '#94A3B8',
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <div
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(0, 82, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                      color: isActive ? '#0052FF' : '#475569',
                    }}
                  >
                    <IconComponent size={20} />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.3rem', color: '#0A0D14' }}>
                  {stage.title}
                </h3>
                <p style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#0052FF', marginBottom: '0.85rem', fontWeight: 600 }}>
                  {stage.subtitle}
                </p>

                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* End Takeoff Banner */}
        <div
          className="glass-panel"
          style={{
            marginTop: '5rem',
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)',
            border: '1px solid rgba(0, 82, 255, 0.25)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 20px 40px -10px rgba(0, 82, 255, 0.08)',
          }}
        >
          <h3 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, color: '#0A0D14', textTransform: 'uppercase' }}>
            NOW, LET'S GO FURTHER.
          </h3>
          <p style={{ color: '#475569', maxWidth: '550px', fontSize: '1.05rem', fontWeight: 500 }}>
            Ready to accelerate your brand presence with Zentra Digital?
          </p>
          <button onClick={onOpenProjectModal} className="btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }} data-cursor="LAUNCH">
            <span>Start Your Journey</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
