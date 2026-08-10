import React, { useState, useEffect, useRef } from 'react';

export default function ResultsMetrics() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const metrics = [
    { target: 250, suffix: '+', label: 'Campaigns Delivered', sub: 'Across enterprise & tech sectors' },
    { target: 40, suffix: '+', label: 'Brands Accelerated', sub: 'Global category leaders' },
    { target: 3.6, suffix: '×', isDecimal: true, label: 'Average ROAS', sub: 'Verified pipeline return' },
    { target: 12, suffix: 'M+', label: 'People Reached', sub: 'Organic & paid campaigns' },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="results"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#040507',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Editorial Section Headline */}
        <div style={{ marginBottom: '5rem', textAlign: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-electric)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.75rem',
            }}
          >
            // VERIFIED TRACK RECORD
          </span>
          <h2
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              lineHeight: 1.05,
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            Numbers Tell <span className="text-gradient">the Story.</span>
          </h2>
        </div>

        {/* Metric Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
          }}
        >
          {metrics.map((item, idx) => (
            <MetricCard key={idx} item={item} animate={isVisible} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ item, animate, index }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!animate) return;

    let start = 0;
    const duration = 2000;
    const steps = 60;
    const increment = item.target / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= item.target) {
        setCount(item.target);
        clearInterval(timer);
      } else {
        setCount(item.isDecimal ? parseFloat(start.toFixed(1)) : Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [animate, item.target, item.isDecimal]);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'rgba(10, 12, 18, 0.65)',
        border: '1px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden',
      }}
      data-cursor="METRIC"
    >
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(3rem, 6vw, 4.5rem)',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1,
          marginBottom: '0.75rem',
        }}
      >
        {item.isDecimal ? count.toFixed(1) : count}
        <span style={{ color: '#00F0FF' }}>{item.suffix}</span>
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
        {item.label}
      </h3>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        {item.sub}
      </p>
    </div>
  );
}
