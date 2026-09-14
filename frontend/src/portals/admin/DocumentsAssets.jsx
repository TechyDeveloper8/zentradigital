import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { FolderOpen, Plus, Download, Shield, Eye, FileText } from 'lucide-react';

export default function DocumentsAssets() {
  const [files, setFiles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [clientId, setClientId] = useState('');
  const [visibility, setVisibility] = useState('CLIENT_VISIBLE');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFiles();
    api.get('/clients').then(res => setClients(res || [])).catch(e => console.error(e));
  }, []);

  const loadFiles = () => {
    setLoading(true);
    api.get('/files')
      .then(res => setFiles(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (clientId) formData.append('client_id', clientId);
    formData.append('visibility', visibility);

    try {
      await api.post('/files/upload', formData);
      setShowUploadModal(false);
      setSelectedFile(null);
      loadFiles();
    } catch (err) {
      alert(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Documents & Asset Vault
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Structured asset repository supporting strict Internal vs Client-Visible privacy boundaries.
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          <Plus size={16} /> Upload Asset
        </button>
      </div>

      {/* Files Table */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading asset records...</div>
      ) : files.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No files uploaded yet</h3>
          <p>Store brand guidelines, font packages, creative raw assets, and contracts.</p>
          <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
            <Plus size={16} /> Upload First Asset
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Client Association</th>
                <th>File Type & Size</th>
                <th>Uploaded By</th>
                <th>Access Level</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{f.original_name}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{new Date(f.created_at).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{f.company_name || 'General Agency Asset'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>{f.mime_type}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{Math.round(f.file_size / 1024)} KB</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px' }}>{f.uploaded_by_username || 'System'}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${f.visibility === 'CLIENT_VISIBLE' ? 'green' : 'purple'}`}>
                      {f.visibility}
                    </span>
                  </td>
                  <td>
                    <a
                      href={`/api/files/${f.id}/download`}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11.5px', textDecoration: 'none' }}
                      download
                    >
                      <Download size={13} /> Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Asset Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Upload Document or Creative</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select File *</label>
                  <input
                    type="file"
                    className="form-control"
                    required
                    onChange={e => setSelectedFile(e.target.files[0])}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Client Association</label>
                  <select
                    className="form-control"
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                  >
                    <option value="">-- General Agency Internal --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name} ({c.client_code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Visibility Permission *</label>
                  <select
                    className="form-control"
                    value={visibility}
                    onChange={e => setVisibility(e.target.value)}
                  >
                    <option value="CLIENT_VISIBLE">Client Visible (Accessible in Client Portal)</option>
                    <option value="INTERNAL">Internal Only (Strictly Agency Staff Access)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={uploading} className="btn btn-primary">
                  {uploading ? 'Uploading...' : 'Upload Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
