import React, { useState } from 'react';
import api from '../../../api/client';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download, RefreshCw, Layers } from 'lucide-react';

const SAMPLE_CSV = `company_name,contact_person,phone,email,source,industry,deal_value,city,requirement
Acme Retail Brands,Vikram Singhania,9820011223,vikram@acmeretail.in,Cold Outreach,E-commerce,85000,Mumbai,Performance Meta & Google Ads
Apex Cloud Labs,Pooja Hegde,9845012345,pooja@apexcloud.io,LinkedIn,SaaS,120000,Bangalore,B2B LinkedIn ABM & Content
Sunrise Hospital Group,Dr. Amit Kapoor,9811098765,amit@sunrisehospitals.com,Google Search,Healthcare,95000,Delhi,Local SEO & Reputation Management`;

export default function LeadImportModal({ isOpen, onClose, onImportSuccess }) {
  const [inputText, setInputText] = useState(SAMPLE_CSV);
  const [parsedLeads, setParsedLeads] = useState([]);
  const [parseError, setParseError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  // Simple CSV parser
  const parseCSV = (csvText) => {
    try {
      const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('Please include at least a header row and 1 data row.');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const lead = {};
        headers.forEach((h, idx) => {
          lead[h] = values[idx] || '';
        });

        // Basic validation
        if (lead.company_name && lead.contact_person && lead.phone) {
          lead.deal_value = Number(lead.deal_value) || 50000;
          rows.push(lead);
        }
      }

      if (rows.length === 0) {
        throw new Error('No valid rows found. Each row requires company_name, contact_person, and phone.');
      }

      setParsedLeads(rows);
      setParseError('');
    } catch (err) {
      setParseError(err.message);
      setParsedLeads([]);
    }
  };

  const handleParsePreview = () => {
    parseCSV(inputText);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setInputText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zentra_agency_lead_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = async () => {
    if (parsedLeads.length === 0) {
      parseCSV(inputText);
      return;
    }

    setIsSubmitting(true);
    setParseError('');
    try {
      const res = await api.post('/sales/import-leads', { leads: parsedLeads });
      setImportResult(res);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      setParseError(err.message || 'Bulk import failed. Please check field formats.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Upload className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">Bulk Import Agency Leads</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste CSV or upload a spreadsheet to import multiple prospective agency clients at once.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {importResult ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Import Successful!</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Successfully created <strong className="text-emerald-700">{importResult.imported_count || parsedLeads.length}</strong> new agency leads in your sales pipeline.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setImportResult(null);
                    setParsedLeads([]);
                    setInputText('');
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100"
                >
                  Import Another Batch
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Go to Pipeline
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Actions strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-900">Need the template format?</span>
                  <button
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-md border border-indigo-200 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download CSV Template
                  </button>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-500" /> Upload File (.csv)
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Paste Raw CSV Data:
                </label>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="company_name,contact_person,phone,email,source,industry,deal_value,city,requirement..."
                  className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview Button */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleParsePreview}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> Preview Parsed Leads ({parsedLeads.length})
                </button>
                {parsedLeads.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready to import {parsedLeads.length} valid lead(s)
                  </span>
                )}
              </div>

              {/* Table Preview */}
              {parsedLeads.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2.5">Company</th>
                        <th className="p-2.5">Contact</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Source</th>
                        <th className="p-2.5">Est. Value</th>
                        <th className="p-2.5">City</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {parsedLeads.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-900">{row.company_name}</td>
                          <td className="p-2.5">{row.contact_person}</td>
                          <td className="p-2.5 font-mono">{row.phone}</td>
                          <td className="p-2.5">{row.source || 'Cold Outreach'}</td>
                          <td className="p-2.5 font-semibold text-emerald-600">₹{(Number(row.deal_value) || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2.5">{row.city || 'India'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importResult && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleImportSubmit}
              disabled={isSubmitting || parsedLeads.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Importing into Database...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Confirm & Import {parsedLeads.length > 0 ? `(${parsedLeads.length})` : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
