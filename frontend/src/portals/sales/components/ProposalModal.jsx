import React, { useState } from 'react';
import api from '../../../api/client';
import { X, FileText, Plus, Trash2, Printer, Send, CheckCircle2, DollarSign } from 'lucide-react';

export default function ProposalModal({ isOpen, onClose, lead, onProposalCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('FORM'); // 'FORM' | 'PREVIEW'

  const proposalNumber = `PROP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const [form, setForm] = useState({
    proposal_number: proposalNumber,
    company_name: lead ? lead.company_name : '',
    proposal_title: lead ? `Growth & Digital Performance Strategy — ${lead.company_name}` : 'Marketing Retainer Proposal',
    services_summary: lead?.requirement || 'Social Media Management + Performance Meta Ads + Creative Lab',
    package_name: 'Agency Growth Accelerator Retainer',
    items: [
      { name: 'Social Media Management (16 Reels + 12 Carousels)', qty: 1, price: 65000 },
      { name: 'Meta & Google Ads Performance Management', qty: 1, price: 45000 },
      { name: 'Dedicated Account Manager & Weekly Strategy Calls', qty: 1, price: 15000 }
    ],
    discount: 5000,
    tax_percent: 18,
    payment_terms: '100% advance on the 1st of every calendar month via NEFT/UPI',
    contract_duration: '6 Months (with 3-month review milestone)',
    proposal_valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    terms: '1. Invoices are generated on the 25th of the preceding month with Net 7 terms.\n2. Ad spend is paid directly by client to Meta/Google platforms.\n3. Creative revisions are accommodated within 48 hours of draft delivery.',
    notes: 'Includes dedicated video editor, senior performance marketer, and creative strategist.',
    status: 'DRAFT'
  });

  if (!isOpen) return null;

  const handleAddItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { name: 'New Service Item', qty: 1, price: 25000 }]
    }));
  };

  const handleRemoveItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemChange = (index, field, val) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index][field] = field === 'qty' || field === 'price' ? Number(val) : val;
      return { ...prev, items };
    });
  };

  // Compute totals
  const subtotal = form.items.reduce((acc, it) => acc + (Number(it.qty || 1) * Number(it.price || 0)), 0);
  const taxableAmount = Math.max(0, subtotal - Number(form.discount || 0));
  const taxAmount = Math.round(taxableAmount * (Number(form.tax_percent || 0) / 100));
  const grandTotal = taxableAmount + taxAmount;

  const handleSave = async (submitStatus = 'DRAFT') => {
    if (!form.company_name) {
      setError('Company Name is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        proposal_number: form.proposal_number,
        lead_id: lead ? lead.id : null,
        company_name: form.company_name,
        proposal_title: form.proposal_title,
        services_summary: form.services_summary,
        package_name: form.package_name,
        quantity: 1,
        price: subtotal,
        discount: Number(form.discount || 0),
        tax: taxAmount,
        total: grandTotal,
        payment_terms: form.payment_terms,
        contract_duration: form.contract_duration,
        items_detail: JSON.stringify(form.items),
        proposal_valid_until: form.proposal_valid_until,
        terms: form.terms,
        notes: form.notes,
        status: submitStatus
      };

      const res = await api.post('/proposals', payload);

      // If attached to lead, advance lead stage to PROPOSAL if currently earlier
      if (lead) {
        await api.put(`/leads/${lead.id}/stage`, {
          stage: 'PROPOSAL',
          notes: `Proposal [${form.proposal_number}] created for ₹${grandTotal.toLocaleString()}`
        }).catch(e => console.error(e));
      }

      onProposalCreated(res.proposal);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save proposal.');
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '850px',
        backgroundColor: '#0F172A',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0B1120'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#10B981', textTransform: 'uppercase', fontWeight: 700 }}>
                {form.proposal_number}
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC', margin: '2px 0 0' }}>
                Client Proposal Builder
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#1E293B', padding: '3px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('FORM')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'FORM' ? '#3B82F6' : 'transparent',
                  color: activeTab === 'FORM' ? '#fff' : '#94A3B8'
                }}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PREVIEW')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'PREVIEW' ? '#3B82F6' : 'transparent',
                  color: activeTab === 'PREVIEW' ? '#fff' : '#94A3B8'
                }}
              >
                Document Preview
              </button>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#F87171',
              fontSize: '12.5px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {activeTab === 'FORM' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Company / Client Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Proposal Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.proposal_title}
                    onChange={(e) => setForm({ ...form, proposal_title: e.target.value })}
                  />
                </div>
              </div>

              {/* Line items table */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Deliverables & Service Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn btn-secondary"
                    style={{ fontSize: '11.5px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={13} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div style={{ backgroundColor: '#0B1120', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  {form.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '4fr 1fr 2fr auto', gap: '10px', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Service description"
                        value={item.name}
                        onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      />
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Rate (₹)"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                      />
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '6px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label className="form-label">Payment Terms</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.payment_terms}
                      onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Contract Duration</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.contract_duration}
                      onChange={(e) => setForm({ ...form, contract_duration: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Valid Until</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.proposal_valid_until}
                      onChange={(e) => setForm({ ...form, proposal_valid_until: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  backgroundColor: '#0B1120',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8' }}>
                    <span>Subtotal:</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#94A3B8' }}>
                    <span>Discount (₹):</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '120px', padding: '4px 8px', textAlign: 'right' }}
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#94A3B8' }}>
                    <span>GST (18%):</span>
                    <span style={{ color: '#F8FAFC', fontWeight: 600 }}>₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800 }}>
                    <span style={{ color: '#F8FAFC' }}>Total Retainer:</span>
                    <span style={{ color: '#10B981' }}>₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW TAB */
            <div style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              padding: '36px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
              fontFamily: 'Inter, sans-serif'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#1E293B', margin: 0 }}>ZENTRA DIGITAL</h1>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>Enterprise Digital Growth & Performance Partner</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#3B82F6' }}>COMMERCIAL PROPOSAL</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Ref: {form.proposal_number}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>Valid Until: {form.proposal_valid_until}</div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Prepared For</div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{form.company_name}</h3>
                <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0' }}>{form.proposal_title}</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '10px', fontSize: '12px', color: '#475569' }}>Deliverable / Service</th>
                    <th style={{ padding: '10px', fontSize: '12px', color: '#475569', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px', fontSize: '12px', color: '#475569', textAlign: 'right' }}>Monthly Rate</th>
                    <th style={{ padding: '10px', fontSize: '12px', color: '#475569', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', fontSize: '13px' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{it.name}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{it.qty}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>₹{Number(it.price).toLocaleString()}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>₹{(Number(it.qty) * Number(it.price)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '280px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#64748B' }}>
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {Number(form.discount || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#EF4444' }}>
                      <span>Discount:</span>
                      <span>-₹{Number(form.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: '#64748B' }}>
                    <span>GST (18%):</span>
                    <span>₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #E2E8F0', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                    <span>Total Investment:</span>
                    <span style={{ color: '#059669' }}>₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '16px', fontSize: '11.5px', color: '#64748B' }}>
                <strong>Commercial Terms:</strong> {form.payment_terms} • Duration: {form.contract_duration}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0B1120'
        }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} />
            <span>Print PDF</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={loading}
              className="btn btn-secondary"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('SENT')}
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Send size={15} />
              <span>Send to Prospect</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
