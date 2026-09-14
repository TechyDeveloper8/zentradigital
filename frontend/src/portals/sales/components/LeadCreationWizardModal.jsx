import React, { useState } from 'react';
import api from '../../../api/client';
import {
  X, Check, ChevronRight, ChevronLeft, Building2, User, Phone,
  Mail, Globe, MapPin, Briefcase, Target, Layers, DollarSign,
  TrendingUp, Calendar, AlertCircle, Sparkles, CheckCircle2, Clock
} from 'lucide-react';

const AGENCY_SERVICES = [
  'Social Media Management',
  'Content Creation',
  'Graphic Design',
  'Video Editing',
  'Reels',
  'Paid Advertising',
  'SEO',
  'Website Development',
  'Website Management',
  'Branding',
  'Marketing Consultation',
  'Other'
];

const INDUSTRIES = [
  'E-commerce & D2C',
  'Healthcare & Wellness',
  'Real Estate & Interior Design',
  'F&B / Restaurants / Hospitality',
  'B2B SaaS & Tech',
  'Fashion & Luxury Lifestyle',
  'Education & EdTech',
  'Finance & Wealth Advisory',
  'Automotive',
  'Other'
];

const LEAD_SOURCES = [
  'Instagram',
  'Facebook',
  'Website',
  'Referral',
  'Google',
  'LinkedIn',
  'Cold Call',
  'WhatsApp',
  'Email',
  'Walk-in',
  'Advertisement',
  'Other'
];

export default function LeadCreationWizardModal({ isOpen, onClose, onLeadCreated, employees = [] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    company_name: '',
    contact_person: '',
    designation: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    city: '',
    state: '',
    country: 'India',

    // Step 2: Business Information
    industry: 'E-commerce & D2C',
    business_type: 'B2C',
    company_size: '11-50 employees',
    product_service: '',
    target_market: '',
    target_location: '',
    existing_website: '',
    existing_social_media: '',
    competitors: '',
    current_marketing_method: '',

    // Step 3: Requirement
    services_required: [],
    requirement: '',
    main_business_problem: '',
    desired_outcome: '',
    expected_start_date: '',
    existing_agency: '',
    urgency: 'High',

    // Step 4: Commercial Information
    deal_value: 100000,
    budget_range: '₹1,00,000 - ₹1,50,000 / month',
    billing_type: 'Monthly',
    expected_contract_duration: '6 Months',
    decision_maker: '',
    purchase_timeline: 'Immediate',
    pricing_sensitivity: 'Normal',

    // Step 5: Sales Information
    source: 'Website',
    lead_type: 'Inbound',
    priority: 'HIGH',
    assigned_sales_employee_id: '',
    first_follow_up_date: new Date().toISOString().split('T')[0],
    lead_score: 75,
    notes: '',

    // Initial follow-up
    schedule_initial_follow_up: true,
    follow_up_time: '11:00',
    follow_up_method: 'Phone',
    follow_up_note: 'Initial discovery and scope alignment call'
  });

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleService = (svc) => {
    setFormData(prev => {
      const exists = prev.services_required.includes(svc);
      return {
        ...prev,
        services_required: exists
          ? prev.services_required.filter(s => s !== svc)
          : [...prev.services_required, svc]
      };
    });
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.company_name.trim()) return 'Company Name is required.';
      if (!formData.contact_person.trim()) return 'Contact Person is required.';
      if (!formData.phone.trim()) return 'Mobile Number is required.';
    }
    if (step === 2) {
      if (!formData.industry) return 'Please select an industry.';
    }
    if (step === 3) {
      if (formData.services_required.length === 0) return 'Please select at least one required service.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(currentStep);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setCurrentStep(prev => Math.min(6, prev + 1));
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSave = async (postAction = 'NONE') => {
    const err = validateStep(1);
    if (err) {
      setError(err);
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        initial_follow_up: formData.schedule_initial_follow_up ? {
          follow_up_date: formData.first_follow_up_date,
          follow_up_time: formData.follow_up_time,
          contact_method: formData.follow_up_method,
          discussion_summary: formData.follow_up_note,
          next_action: 'Discovery & Intro Call'
        } : null
      };

      const res = await api.post('/leads', payload);
      onLeadCreated(res.lead, postAction);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create lead.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [
    { num: 1, title: 'Basic Info' },
    { num: 2, title: 'Business Info' },
    { num: 3, title: 'Requirements' },
    { num: 4, title: 'Commercials' },
    { num: 5, title: 'Sales Info' },
    { num: 6, title: 'Review & Save' }
  ];

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '840px',
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0B1120'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>
                STEP {currentStep} OF 6
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>• New Prospect Enrollment</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#F8FAFC', margin: '4px 0 0' }}>
              Lead Creation Wizard
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: '#070C16',
          overflowX: 'auto'
        }}>
          {stepLabels.map((s) => {
            const active = s.num === currentStep;
            const completed = s.num < currentStep;
            return (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                style={{
                  flex: 1,
                  minWidth: '110px',
                  padding: '12px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: active ? '2px solid #3B82F6' : '2px solid transparent',
                  cursor: completed ? 'pointer' : 'default',
                  opacity: active ? 1 : (completed ? 0.8 : 0.45)
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: completed ? '#10B981' : (active ? '#3B82F6' : '#1E293B'),
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {completed ? <Check size={12} /> : s.num}
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: active ? '#F8FAFC' : '#94A3B8', whiteSpace: 'nowrap' }}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Body with Scroll */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#F87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Building2 size={16} />
                <span>Primary Company & Contact Credentials</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Zenith Apparel Brands Pvt Ltd"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Contact Person *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Vikram Malhotra"
                    value={formData.contact_person}
                    onChange={(e) => handleChange('contact_person', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Co-Founder / CMO"
                    value={formData.designation}
                    onChange={(e) => handleChange('designation', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">WhatsApp Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={formData.whatsapp}
                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="vikram@zenithbrand.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Website URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://zenithbrand.com"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Business Information */}
          {currentStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Briefcase size={16} />
                <span>Industry & Commercial Profile</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Industry *</label>
                  <select
                    className="form-input"
                    value={formData.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                  >
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Business Type</label>
                  <select
                    className="form-input"
                    value={formData.business_type}
                    onChange={(e) => handleChange('business_type', e.target.value)}
                  >
                    <option value="B2C">B2C (Direct to Consumer)</option>
                    <option value="B2B">B2B (Business to Business)</option>
                    <option value="D2C">D2C E-commerce</option>
                    <option value="B2B2C">B2B2C / Marketplace</option>
                    <option value="Franchise">Franchise & Retail</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Company Size</label>
                  <select
                    className="form-input"
                    value={formData.company_size}
                    onChange={(e) => handleChange('company_size', e.target.value)}
                  >
                    <option value="1-10 employees">1-10 employees (Startup / Boutique)</option>
                    <option value="11-50 employees">11-50 employees (Growth Stage)</option>
                    <option value="51-200 employees">51-200 employees (Mid-Market)</option>
                    <option value="200+ employees">200+ employees (Enterprise)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Product / Service Description</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Premium activewear and organic gym apparel"
                    value={formData.product_service}
                    onChange={(e) => handleChange('product_service', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Target Market & Demographics</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Fitness enthusiasts 22-38 in metro cities"
                    value={formData.target_market}
                    onChange={(e) => handleChange('target_market', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Target Location / Geography</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Pan-India (Tier 1 & 2 cities) / US Export"
                    value={formData.target_location}
                    onChange={(e) => handleChange('target_location', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Main Competitors</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Brand X, Brand Y, Competitor Z"
                    value={formData.competitors}
                    onChange={(e) => handleChange('competitors', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Current Marketing Method</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. In-house social media + basic Meta ads"
                    value={formData.current_marketing_method}
                    onChange={(e) => handleChange('current_marketing_method', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Requirement */}
          {currentStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} />
                <span>Scope of Services & Requirement Breakdown</span>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                  What services does the prospect require? * (Select all that apply)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {AGENCY_SERVICES.map(svc => {
                    const isSelected = formData.services_required.includes(svc);
                    return (
                      <button
                        type="button"
                        key={svc}
                        onClick={() => toggleService(svc)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : '#1E293B',
                          color: isSelected ? '#60A5FA' : '#94A3B8',
                          border: isSelected ? '1px solid #3B82F6' : '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected && <Check size={13} />}
                        <span>{svc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="form-label">Main Business Problem to Solve</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="e.g. High customer acquisition cost (CAC) on Meta ads, poor ROAS (1.4x), and flatlining organic reach."
                  value={formData.main_business_problem}
                  onChange={(e) => handleChange('main_business_problem', e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Desired Outcome & Growth Target</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Scale from ₹20L to ₹50L/mo with 3.5x ROAS"
                    value={formData.desired_outcome}
                    onChange={(e) => handleChange('desired_outcome', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Expected Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.expected_start_date}
                    onChange={(e) => handleChange('expected_start_date', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Existing Agency Status</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Terminating contract with previous agency due to poor communication"
                    value={formData.existing_agency}
                    onChange={(e) => handleChange('existing_agency', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Project Urgency</label>
                  <select
                    className="form-input"
                    value={formData.urgency}
                    onChange={(e) => handleChange('urgency', e.target.value)}
                  >
                    <option value="Immediate">Immediate (Kickoff within 7 days)</option>
                    <option value="High">High (Within 15 days)</option>
                    <option value="Medium">Medium (Within 30 days)</option>
                    <option value="Low">Low (Exploratory / Planning)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Commercial Information */}
          {currentStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <DollarSign size={16} />
                <span>Deal Valuation & Commercial Terms</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Estimated Deal Value (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="100000"
                    value={formData.deal_value}
                    onChange={(e) => handleChange('deal_value', e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
                    Used for live pipeline value and weighted revenue calculations.
                  </span>
                </div>
                <div>
                  <label className="form-label">Budget Range</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="₹1,00,000 - ₹1,50,000 / month"
                    value={formData.budget_range}
                    onChange={(e) => handleChange('budget_range', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Billing Structure</label>
                  <select
                    className="form-input"
                    value={formData.billing_type}
                    onChange={(e) => handleChange('billing_type', e.target.value)}
                  >
                    <option value="Monthly">Monthly Retainer</option>
                    <option value="Quarterly">Quarterly Retainer</option>
                    <option value="One-time">One-time Project Sprint</option>
                    <option value="Hybrid">Base Retainer + Performance Bonus</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Expected Contract Duration</label>
                  <select
                    className="form-input"
                    value={formData.expected_contract_duration}
                    onChange={(e) => handleChange('expected_contract_duration', e.target.value)}
                  >
                    <option value="3 Months">3 Months (Standard Pilot)</option>
                    <option value="6 Months">6 Months (Growth Retainer)</option>
                    <option value="12 Months">12 Months (Annual Partner)</option>
                    <option value="Sprint">1 Month Sprint</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Decision Maker</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Founder / Managing Partner"
                    value={formData.decision_maker}
                    onChange={(e) => handleChange('decision_maker', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Purchase Timeline</label>
                  <select
                    className="form-input"
                    value={formData.purchase_timeline}
                    onChange={(e) => handleChange('purchase_timeline', e.target.value)}
                  >
                    <option value="Immediate">Immediate (&lt; 7 days)</option>
                    <option value="Within 30 days">Within 30 days</option>
                    <option value="1-3 months">1-3 months</option>
                    <option value="3+ months">3+ months</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Pricing Sensitivity</label>
                  <select
                    className="form-input"
                    value={formData.pricing_sensitivity}
                    onChange={(e) => handleChange('pricing_sensitivity', e.target.value)}
                  >
                    <option value="Quality Focused">Quality & Speed Focused (Low sensitivity)</option>
                    <option value="Normal">Normal Market Benchmark</option>
                    <option value="Budget Sensitive">High Budget Sensitivity</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Sales Information */}
          {currentStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Target size={16} />
                <span>Sales Assignment & Strategy Setup</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Lead Source *</label>
                  <select
                    className="form-input"
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                  >
                    {LEAD_SOURCES.map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Lead Priority</label>
                  <select
                    className="form-input"
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent 🔥</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Initial Lead Score (0 - 100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="form-input"
                    value={formData.lead_score}
                    onChange={(e) => handleChange('lead_score', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Assigned Sales Executive</label>
                  <select
                    className="form-input"
                    value={formData.assigned_sales_employee_id}
                    onChange={(e) => handleChange('assigned_sales_employee_id', e.target.value)}
                  >
                    <option value="">Assign to Me (Default)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.designation || 'Sales'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">First Follow-up Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.first_follow_up_date}
                    onChange={(e) => handleChange('first_follow_up_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Initial Follow-Up Schedule Option */}
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '10px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#F8FAFC' }}>
                  <input
                    type="checkbox"
                    checked={formData.schedule_initial_follow_up}
                    onChange={(e) => handleChange('schedule_initial_follow_up', e.target.checked)}
                  />
                  <span>Automatically schedule first follow-up action</span>
                </label>

                {formData.schedule_initial_follow_up && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>Preferred Method</label>
                      <select
                        className="form-input"
                        value={formData.follow_up_method}
                        onChange={(e) => handleChange('follow_up_method', e.target.value)}
                      >
                        <option value="Phone">Phone Call</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                        <option value="Video Call">Video Call</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={formData.follow_up_time}
                        onChange={(e) => handleChange('follow_up_time', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11.5px' }}>Action Objective</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Discovery call and agency intro deck"
                        value={formData.follow_up_note}
                        onChange={(e) => handleChange('follow_up_note', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Sales Rep Notes / Context</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Key background notes, referral context, specific instructions..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 6: Review & Save */}
          {currentStep === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>Verification Summary Before Enrollment</span>
              </div>

              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '18px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Company & Contact</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>{formData.company_name}</div>
                  <div style={{ fontSize: '13px', color: '#CBD5E1', marginTop: '2px' }}>{formData.contact_person} ({formData.designation || 'Owner'})</div>
                  <div style={{ fontSize: '12px', color: '#60A5FA', marginTop: '4px' }}>{formData.phone} • {formData.email || 'No email provided'}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{formData.city ? `${formData.city}, ${formData.state}` : 'Location not specified'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Valuation & Pipeline</div>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                    ₹{Number(formData.deal_value || 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#CBD5E1', marginTop: '2px' }}>
                    {formData.billing_type} Retainer • {formData.expected_contract_duration}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span className={`badge badge-${formData.priority === 'URGENT' || formData.priority === 'HIGH' ? 'danger' : 'info'}`}>
                      {formData.priority} PRIORITY
                    </span>
                    <span className="badge badge-success">
                      SCORE: {formData.lead_score}/100
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Selected Agency Capabilities
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {formData.services_required.map(svc => (
                    <span key={svc} style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: '#60A5FA',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              {formData.schedule_initial_follow_up && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Clock size={18} color="#10B981" />
                  <div style={{ fontSize: '12.5px', color: '#E2E8F0' }}>
                    <strong>Scheduled First Follow-up:</strong> {formData.first_follow_up_date} at {formData.follow_up_time} via {formData.follow_up_method}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0B1120'
        }}>
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={submitting}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>Continue to Step {currentStep + 1}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave('NONE')}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  {submitting ? 'Creating Lead...' : 'Save Lead'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('OPEN_LEAD')}
                  disabled={submitting}
                  className="btn btn-success"
                  style={{ fontWeight: 700 }}
                >
                  Save & Open Lead
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
