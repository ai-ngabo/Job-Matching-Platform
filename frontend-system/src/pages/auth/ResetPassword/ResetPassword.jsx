import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      setStatus({ type: 'error', message: 'Reset token is missing. Please request a new email.' });
      return;
    }
    if (form.password !== form.confirm) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await authService.resetPassword({ token, password: form.password });
      setStatus({ type: 'success', message: data.message });
      setForm({ password: '', confirm: '' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to reset password.';
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card password-card">
        <h2>Set a new password</h2>
        <p className="helper-text">
          {email ? `Resetting password for ${email}` : 'Enter your new credentials below.'}
        </p>

        {status.message && (
          <div className={`status-banner ${status.type}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="password-form">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={6}
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            minLength={6}
            value={form.confirm}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
          <Link to="/forgot-password">Need a new link?</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

