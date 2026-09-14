import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  DollarSign, Plus, CheckCircle2, AlertCircle, FileText,
  Calendar, CreditCard, ArrowUpRight, TrendingUp
} from 'lucide-react';

export default function FinanceBilling() {
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState('INVOICES');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [newInvoice, setNewInvoice] = useState({
    client_id: '',
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    discount: 0,
    tax: 0,
    notes: 'Payment terms: Net 15 days from date of invoice.',
    items: [{ description: 'Monthly Digital Marketing Retainer', quantity: 1, rate: 50000 }]
  });

  const [payment, setPayment] = useState({
    amount: '',
    payment_method: 'Bank Transfer',
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
    api.get('/clients').then(res => setClients(res || [])).catch(e => console.error(e));
  }, [activeTab]);

  const loadData = () => {
    setLoading(true);
    if (activeTab === 'INVOICES') {
      api.get('/billing/invoices')
        .then(res => setInvoices(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      api.get('/billing/contracts')
        .then(res => setContracts(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/billing/invoices', newInvoice);
      setShowInvoiceModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create invoice');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.post('/billing/payments', {
        invoice_id: selectedInvoice.id,
        ...payment
      });
      setShowPaymentModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const addItemRow = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, rate: 0 }]
    });
  };

  const [searchTerm, setSearchTerm] = useState('');

  const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.total || 0), 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + Number(inv.paid_amount || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (Number(inv.total || 0) - Number(inv.paid_amount || 0)), 0);
  const monthlyRetainerMRR = contracts.reduce((acc, c) => acc + (c.status === 'active' || c.status === 'ACTIVE' ? Number(c.monthly_amount || 0) : 0), 0);

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (inv.invoice_number && inv.invoice_number.toLowerCase().includes(q)) ||
           (inv.company_name && inv.company_name.toLowerCase().includes(q));
  });

  const filteredContracts = contracts.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (c.contract_code && c.contract_code.toLowerCase().includes(q)) ||
           (c.company_name && c.company_name.toLowerCase().includes(q));
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Agency Billing, Invoices & Subscriptions
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Generate client invoices, record received payments, and track monthly recurring revenue (MRR).
          </p>
        </div>

        <button onClick={() => setShowInvoiceModal(true)} className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '14px', borderRadius: '10px' }}>
          <Plus size={16} /> Generate Invoice
        </button>
      </div>

      {/* Executive Financial Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Total Invoiced */}
        <div className="spotlight-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Invoiced</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB' }}>
            ₹{totalInvoiced.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '4px' }}>
            Across {invoices.length} total invoices
          </div>
        </div>

        {/* Total Collected */}
        <div className="spotlight-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Collected Revenue</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }}>
            ₹{totalCollected.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: '#10B981', marginTop: '4px', fontWeight: 500 }}>
            {totalInvoiced > 0 ? `${Math.round((totalCollected / totalInvoiced) * 100)}% realization rate` : '100% realized'}
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="spotlight-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Receivables</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: totalOutstanding > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: totalOutstanding > 0 ? '#EF4444' : '#10B981' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: totalOutstanding > 0 ? '#F87171' : '#10B981' }}>
            ₹{totalOutstanding.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '4px' }}>
            {totalOutstanding === 0 ? 'No overdue payments' : 'Pending client clearance'}
          </div>
        </div>

        {/* Retainer MRR */}
        <div className="spotlight-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Retainer MRR</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#A78BFA' }}>
            ₹{monthlyRetainerMRR.toLocaleString()}
          </div>
          <div style={{ fontSize: '11.5px', color: '#6B7280', marginTop: '4px' }}>
            {contracts.length} active client agreements
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="tabs-header" style={{ margin: 0 }}>
          <button
            className={`tab-btn ${activeTab === 'INVOICES' ? 'active' : ''}`}
            onClick={() => setActiveTab('INVOICES')}
          >
            Client Invoices ({filteredInvoices.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'CONTRACTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('CONTRACTS')}
          >
            Retainer Subscriptions ({filteredContracts.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder="Filter by invoice # or client..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '7px 12px',
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB',
              fontSize: '13px',
              width: '240px'
            }}
          />
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading billing records...</div>
      ) : activeTab === 'INVOICES' ? (
        filteredInvoices.length === 0 ? (
          <div className="table-container empty-state">
            <h3>No invoices found</h3>
            <p>Generate an invoice for your subscribed agency clients.</p>
            <button onClick={() => setShowInvoiceModal(true)} className="btn btn-primary">
              <Plus size={16} /> Generate First Invoice
            </button>
          </div>
        ) : (
          <div className="table-container" style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Client Company</th>
                  <th>Total Amount</th>
                  <th>Amount Paid</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Record Payment</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#60A5FA' }}>{inv.invoice_number}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.company_name}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{inv.primary_contact_email}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>₹{Number(inv.total).toLocaleString()}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#10B981' }}>₹{Number(inv.paid_amount || 0).toLocaleString()}</span>
                    </td>
                    <td>{inv.due_date}</td>
                    <td>
                      <span className={`status-badge ${
                        inv.payment_status === 'PAID' ? 'green' :
                        (inv.payment_status === 'PARTIAL' ? 'yellow' : 'red')
                      }`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td>
                      {inv.payment_status !== 'PAID' ? (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPayment({ ...payment, amount: inv.total - (inv.paid_amount || 0) });
                            setShowPaymentModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11.5px' }}
                        >
                          <CreditCard size={13} /> Record Payment
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                          ✓ Fully Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* Contracts List */
        contracts.length === 0 ? (
          <div className="table-container empty-state">
            <h3>No active retainer contracts</h3>
            <p>Retainer agreements created for clients will appear here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract Code</th>
                  <th>Client</th>
                  <th>Package Name</th>
                  <th>Monthly Retainer</th>
                  <th>Billing Cycle</th>
                  <th>Renewal Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: '#60A5FA' }}>{c.contract_code}</td>
                    <td style={{ fontWeight: 600 }}>{c.company_name}</td>
                    <td>{c.package_name}</td>
                    <td style={{ fontWeight: 700, color: '#10B981' }}>₹{Number(c.monthly_amount).toLocaleString()}</td>
                    <td>{c.billing_cycle}</td>
                    <td>{c.renewal_date || c.end_date}</td>
                    <td><span className="status-badge green">{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Generate Invoice Modal (Section 37) */}
      {showInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Generate Client Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateInvoice}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Client *</label>
                    <select
                      className="form-control"
                      required
                      value={newInvoice.client_id}
                      onChange={e => setNewInvoice({ ...newInvoice, client_id: e.target.value })}
                    >
                      <option value="">-- Choose Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={newInvoice.due_date}
                      onChange={e => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ margin: '14px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Invoice Line Items</label>
                    <button type="button" onClick={addItemRow} style={{ background: 'transparent', border: 'none', color: '#60A5FA', fontSize: '12px', cursor: 'pointer' }}>
                      + Add Item
                    </button>
                  </div>

                  {newInvoice.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Deliverable description"
                        value={it.description}
                        onChange={e => {
                          const updated = [...newInvoice.items];
                          updated[idx].description = e.target.value;
                          setNewInvoice({ ...newInvoice, items: updated });
                        }}
                      />
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Qty"
                        value={it.quantity}
                        onChange={e => {
                          const updated = [...newInvoice.items];
                          updated[idx].quantity = e.target.value;
                          setNewInvoice({ ...newInvoice, items: updated });
                        }}
                      />
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Rate (₹)"
                        value={it.rate}
                        onChange={e => {
                          const updated = [...newInvoice.items];
                          updated[idx].rate = e.target.value;
                          setNewInvoice({ ...newInvoice, items: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Discount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newInvoice.discount}
                      onChange={e => setNewInvoice({ ...newInvoice, discount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Taxes / GST (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newInvoice.tax}
                      onChange={e => setNewInvoice({ ...newInvoice, tax: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Terms & Notes</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newInvoice.notes}
                    onChange={e => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowInvoiceModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Record Payment for {selectedInvoice.invoice_number}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Payment Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    required
                    value={payment.amount}
                    onChange={e => setPayment({ ...payment, amount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method *</label>
                  <select
                    className="form-control"
                    value={payment.payment_method}
                    onChange={e => setPayment({ ...payment, payment_method: e.target.value })}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reference / UTR Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. UTR12345678"
                    value={payment.reference_number}
                    onChange={e => setPayment({ ...payment, reference_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
