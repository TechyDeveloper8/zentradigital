import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Danish Ali',
      role: 'Founder',
      company: 'Dailit.AI',
      industry: 'AI & Enterprise Tech',
      initials: 'DA',
      logo: null,
      quote:
        'Zentra Digital has been instrumental as our growth and marketing partner. Their deep understanding of AI positioning, multi-channel user acquisition funnels, and high-velocity execution delivered phenomenal traction for Dailit.AI.',
      verified: 'Verified Founder Partner',
    },
    {
      name: 'Vaishnavi Sharma',
      role: 'Founder',
      company: 'Vana Entertainments',
      industry: 'Media & Entertainment',
      initials: 'VS',
      logo: null,
      quote:
        'From engineering our modern interactive web portal to directing creative campaign narratives, Zentra transformed how our brand connects with audiences. Their speed, aesthetic standards, and technical precision are world-class.',
      verified: 'Verified Client Partner',
    },
    {
      name: 'Ayush Kashyap',
      role: 'Founder',
      company: 'The Luxe Shop',
      industry: 'Luxury Retail & E-Commerce',
      initials: 'AK',
      logo: '/logoofclient/theluxeshoplogo.png',
      quote:
        'Zentra Digital scaled our luxury brand with laser-focused performance ads and high-converting visual direction. The return on ad spend (ROAS) and quality customer acquisition consistently exceeded our expectations.',
      verified: 'Verified Client Partner',
    },
    {
      name: 'Dr. K.N. Gupta',
      role: 'Orthopedic Surgeon',
      company: 'Specialist Orthopedic Care',
      industry: 'Healthcare & Medical Authority',
      initials: 'KG',
      logo: null,
      quote:
        'In healthcare, credibility and patient trust are paramount. Zentra crafted an authoritative digital outreach strategy that significantly elevated our specialist visibility, patient education, and local practice reach.',
      verified: 'Verified Practice Partner',
    },
    {
      name: 'Ravi Kumar Agarwal',
      role: 'CEO',
      company: 'Limelight Advertising & Marketing Network',
      industry: 'Advertising & Media Network',
      initials: 'RA',
      logo: '/logoofclient/Limelightingadvertising.png',
      quote:
        'Collaborating with Zentra Digital has been a tremendous force multiplier for our network. Their capability to fuse commercial storytelling with rigorous media performance and CRM architecture makes them exceptional partners.',
      verified: 'Verified Executive Partner',
    },
  ];

  return (
    <section
      id="testimonials"
      className="section-padding"
      style={{
        position: 'relative',
        zIndex: 2,
        backgroundColor: '#FBFBFB',
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
            TESTIMONIALS & TRUST
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
            WHAT FOUNDERS & LEADERS <br />
            <span style={{ color: '#E00000' }}>SAY ABOUT US.</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '2.25rem 2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                position: 'relative',
              }}
              className="testimonial-card"
            >
              <div>
                {/* Header Row: Stars + Quote Icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="#E00000" color="#E00000" />
                    ))}
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#0A0A0A', fontFamily: 'var(--font-body)' }}>
                      5.0
                    </span>
                  </div>

                  <Quote size={24} color="#E00000" style={{ opacity: 0.25 }} />
                </div>

                {/* Quote Text */}
                <p
                  style={{
                    color: '#333333',
                    fontSize: '0.98rem',
                    lineHeight: 1.65,
                    fontWeight: 500,
                    marginBottom: '1.75rem',
                    fontStyle: 'normal',
                  }}
                >
                  "{item.quote}"
                </p>
              </div>

              {/* Founder / Leader Profile Info */}
              <div
                style={{
                  borderTop: '1px solid #EEEEEE',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {/* Initials Avatar or Company Logo */}
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: '#0A0A0A',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                      border: '2px solid #E00000',
                      flexShrink: 0,
                    }}
                  >
                    {item.initials}
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0A0A0A', margin: 0, letterSpacing: '-0.01em' }}>
                      {item.name}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#666666', margin: '0.15rem 0 0 0', fontWeight: 500 }}>
                      <span style={{ color: '#E00000', fontWeight: 700 }}>{item.role}</span>, {item.company}
                    </p>
                  </div>
                </div>

                {/* Verified Badge */}
                <div
                  title={item.verified}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: '#2E7D32',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                    background: '#E8F5E9',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <CheckCircle2 size={12} />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08) !important;
          border-color: #E00000 !important;
        }
      `}</style>
    </section>
  );
}
