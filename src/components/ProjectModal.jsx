import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle, Sparkles, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ProjectModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [budget, setBudget] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', company: '', details: '' });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const serviceOptions = [
    'Digital Marketing',
    'Performance Marketing',
    'Ad & Product Shoots',
    'Website Development',
    'Custom CRM Solutions',
    'AI-Integrated Chatbots',
  ];

  const budgetOptions = [
    '$25,000 – $50,000',
    '$50,000 – $100,000',
    '$100,000+',
  ];

  const toggleService = (item) => {
    if (services.includes(item)) {
      setServices(services.filter((s) => s !== item));
    } else {
      setServices([...services, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E00000', '#0A0A0A', '#FFFFFF'],
      });
    } catch (err) {
      console.log('Confetti error', err);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 10, 10, 0.75)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          background: '#FFFFFF',
          border: '1px solid var(--border-dark)',
          borderRadius: '12px',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#F8F8F8',
            border: 'none',
            color: '#0A0A0A',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {!submitted ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E00000', fontFamily: 'var(--font-body)', fontSize: '0.78rem', marginBottom: '0.5rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <Sparkles size={16} />
              <span>PROJECT INITIATION PROTOCOL // STEP {step} OF 3</span>
            </div>

            <h3 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700, color: '#0A0A0A', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
              {step === 1 && 'Select Your Objectives'}
              {step === 2 && 'Select Target Investment'}
              {step === 3 && 'Final Contact Info'}
            </h3>

            {step === 1 && (
              <div>
                <p style={{ color: '#555555', marginBottom: '1.25rem', fontWeight: 500, fontSize: '0.95rem' }}>
                  Choose one or multiple growth capabilities you want Zentra to engineer:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
                  {serviceOptions.map((opt) => {
                    const isSelected = services.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleService(opt)}
                        style={{
                          padding: '0.85rem 1rem',
                          textAlign: 'left',
                          background: isSelected ? 'rgba(224, 0, 0, 0.08)' : '#F8F8F8',
                          border: isSelected ? '1px solid #E00000' : '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: isSelected ? '#E00000' : '#0A0A0A',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{opt}</span>
                        {isSelected && <CheckCircle size={16} color="#E00000" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={services.length === 0}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', opacity: services.length === 0 ? 0.5 : 1 }}
                >
                  <span>Continue to Investment Range</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <p style={{ color: '#555555', marginBottom: '1.25rem', fontWeight: 500, fontSize: '0.95rem' }}>
                  Select the estimated annual or quarterly budget allocated for this growth campaign:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
                  {budgetOptions.map((bOpt) => {
                    const isSelected = budget === bOpt;
                    return (
                      <button
                        key={bOpt}
                        type="button"
                        onClick={() => setBudget(bOpt)}
                        style={{
                          padding: '1rem 1.25rem',
                          textAlign: 'left',
                          background: isSelected ? 'rgba(224, 0, 0, 0.08)' : '#F8F8F8',
                          border: isSelected ? '1px solid #E00000' : '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: isSelected ? '#E00000' : '#0A0A0A',
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{bOpt}</span>
                        {isSelected && <CheckCircle size={18} color="#E00000" />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', minWidth: '100px' }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!budget}
                    className="btn-primary"
                    style={{ flex: 2, justifyContent: 'center', minWidth: '160px', opacity: !budget ? 0.5 : 1 }}
                  >
                    <span>Final Details</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#888888', marginBottom: '0.35rem', fontWeight: 700 }}>
                      YOUR FULL NAME *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Alex Morgan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        background: '#F8F8F8',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#0A0A0A',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#888888', marginBottom: '0.35rem', fontWeight: 700 }}>
                      WORK EMAIL ADDRESS *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="alex@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        background: '#F8F8F8',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#0A0A0A',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#888888', marginBottom: '0.35rem', fontWeight: 700 }}>
                      COMPANY / BRAND NAME
                    </label>
                    <input
                      type="text"
                      placeholder="Nova Technologies"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        background: '#F8F8F8',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#0A0A0A',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#888888', marginBottom: '0.35rem', fontWeight: 700 }}>
                      PROJECT OVERVIEW (OPTIONAL)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us about your current growth targets..."
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        background: '#F8F8F8',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#0A0A0A',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        resize: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', minWidth: '100px' }}
                  >
                    Back
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center', minWidth: '160px' }}>
                    <span>Submit Project Brief</span>
                    <Send size={18} />
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(224, 0, 0, 0.1)', border: '1px solid #E00000', color: '#E00000', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <CheckCircle size={32} />
            </div>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0A0A0A', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              PROJECT BRIEF TRANSMITTED
            </h3>
            <p style={{ color: '#555555', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.75rem', fontWeight: 500 }}>
              Thank you, <strong style={{ color: '#0A0A0A' }}>{formData.name}</strong>. Our senior growth strategists are analyzing your requirements and will reach out within 24 hours.
            </p>

            <button onClick={onClose} className="btn-primary" style={{ padding: '0.85rem 2rem', width: '100%' }}>
              <span>Close Window</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
