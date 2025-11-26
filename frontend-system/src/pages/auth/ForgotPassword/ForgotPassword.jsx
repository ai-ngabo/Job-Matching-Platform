import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../../services/authService';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await authService.requestPasswordReset(email);
      setStatus({ type: 'success', message: data.message });
      setEmail('');
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to process request right now.';
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card password-card">
        <h2>Forgot password?</h2>
        <p className="helper-text">
          We will email you a secure link so you can set a new password.
        </p>

        {status.message && (
          <div className={`status-banner ${status.type}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="password-form">
          <label htmlFor="email">Account email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
          <Link to="/register">Create a new account</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

