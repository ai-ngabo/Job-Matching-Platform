import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { RefreshCw, Trash2, RotateCw } from 'lucide-react';

const EmailQueuePanel = () => {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [healthMsg, setHealthMsg] = useState('');

  useEffect(() => {
    if (adminToken) {
      fetchQueue();
    }
  }, [adminToken]);

  const saveToken = (value) => {
    localStorage.setItem('adminToken', value);
    setAdminToken(value);
  };

  const fetchQueue = async (opts = {}) => {
    setLoading(true);
    setError('');
    setHealthMsg('');
    try {
      const token = adminToken;
      if (!token) throw new Error('Admin token not set. Click "Set token" to add it.');

      const res = await api.get('/email-queue', {
        headers: { 'x-admin-token': token },
        params: { status: opts.status || 'pending', limit: opts.limit || 100 }
      });
      setItems(res.data.items || []);
    } catch (err) {
      console.error('Fetch queue error', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch email queue');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (id) => {
    if (!window.confirm('Resend this queued email now?')) return;
    try {
      const token = adminToken;
      await api.post(`/email-queue/${id}/resend`, {}, { headers: { 'x-admin-token': token } });
      alert('Resend triggered');
      fetchQueue();
    } catch (err) {
      console.error('Resend error', err);
      alert(err.response?.data?.message || err.message || 'Resend failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this queued email?')) return;
    try {
      const token = adminToken;
      await api.delete(`/email-queue/${id}`, { headers: { 'x-admin-token': token } });
      alert('Deleted');
      fetchQueue();
    } catch (err) {
      console.error('Delete error', err);
      alert(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const checkHealth = async () => {
    setHealthMsg('');
    try {
      const token = adminToken;
      const res = await api.get('/email-health', { headers: { 'x-admin-token': token } });
      setHealthMsg(res.data.message || 'OK');
      alert('Email health check OK');
    } catch (err) {
      console.error('Health check error', err);
      const msg = err.response?.data?.message || err.message || 'Health check failed';
      setHealthMsg(msg);
      alert('Health check failed: ' + msg);
    }
  };

  return (
    <div className="emails-panel">
      <div className="panel-header">
        <h2>Email Queue</h2>
        <div className="panel-actions">
          <button className="btn" onClick={() => fetchQueue()} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn" onClick={checkHealth}>
            <RotateCw size={14} /> Check Email Health
          </button>
        </div>
      </div>

      <div className="admin-token-row">
        <label style={{ marginRight: 8 }}>Admin token:</label>
        <input
          type="password"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          placeholder="Paste ADMIN_HEALTH_TOKEN here"
          style={{ width: 420 }}
        />
        <button className="btn" onClick={() => saveToken(adminToken)} style={{ marginLeft: 8 }}>Set token</button>
        <button className="btn" onClick={() => { localStorage.removeItem('adminToken'); setAdminToken(''); setItems([]); }} style={{ marginLeft: 8 }}>Clear</button>
      </div>

      {healthMsg && <div className="health-msg">{healthMsg}</div>}

      {error && <div className="error">{error}</div>}

      <div className="emails-list">
        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div className="empty">No queued emails (or token missing)</div>
        ) : (
          <table className="emails-table">
            <thead>
              <tr>
                <th>To</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.to}</td>
                  <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subject}</td>
                  <td>{item.status}</td>
                  <td>{item.attempts || 0}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="btn small" onClick={() => handleResend(item._id)} title="Resend">
                      Resend
                    </button>
                    <button className="btn danger small" onClick={() => handleDelete(item._id)} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .emails-panel { padding: 12px; }
        .panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px }
        .panel-actions .btn { margin-left:8px }
        .admin-token-row { display:flex; align-items:center; margin-bottom:10px }
        .emails-table { width:100%; border-collapse:collapse }
        .emails-table th, .emails-table td { padding:8px; border-bottom:1px solid #eee; text-align:left }
        .btn { background:#eee; border:1px solid #ccc; padding:6px 8px; cursor:pointer }
        .btn.small { padding:4px 6px }
        .btn.danger { background:#ffecec; border-color:#ffb3b3 }
        .health-msg { margin-bottom:8px; color:green }
        .error { margin-bottom:8px; color:crimson }
      `}</style>
    </div>
  );
};

export default EmailQueuePanel;
