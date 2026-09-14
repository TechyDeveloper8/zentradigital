import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { FolderOpen, Download, FileText, CheckCircle2 } from 'lucide-react';

export default function ClientFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/files')
      .then(res => setFiles(res || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Files & Brand Assets
          </h1>
          <p style={{ fontSize: '13.5px', color: '#9CA3AF', margin: 0 }}>
            Official brand guidelines, high-resolution source logos, finalized creatives, and signed agreements.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#9CA3AF' }}>Loading documents...</div>
      ) : files.length === 0 ? (
        <div className="table-container empty-state">
          <h3>No shared files yet</h3>
          <p>Deliverables uploaded by your creative team will be accessible here for secure download.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>File Type & Size</th>
                <th>Upload Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#F9FAFB' }}>{f.original_name}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>{f.mime_type}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{Math.round(f.file_size / 1024)} KB</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <a
                      href={`/api/files/${f.id}/download`}
                      className="btn btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '12px', textDecoration: 'none' }}
                      download
                    >
                      <Download size={13} /> Download Asset
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
