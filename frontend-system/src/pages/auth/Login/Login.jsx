import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './Login.css';

const Login = () => {
  const heroImageUrl =
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Initialize Google SDK
  React.useEffect(() => {
    // Load Google SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnop.apps.googleusercontent.com',
          callback: handleGoogleSuccess
        });
      }
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleSuccess = async (response) => {
    try {
      setLoading(true);
      setError('');
      
      // Send token to backend for verification
      const res = await api.post('/auth/google-login', {
        token: response.credential
      });

      const data = res.data;

      // Store token
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to authenticate with Google';
      setError(errorMsg);
      console.error('Google authentication error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    window.google?.accounts.id.renderButton(
      event.currentTarget,
      { theme: 'outline', size: 'large' }
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-content">
          <div className="login-header">
            <Link to="/" className="logo">
              <span className="logo-main">JobIFY</span>
              <span className="logo-sub">AI Job Matching</span>
            </Link>
            <h1>Welcome back</h1>
            <p className="login-subtitle">
              Access your account here and continue your job security journey with us. 
              Find your dream job with AI-powered matching.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
                disabled={loading}
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
                className="form-input"
                autoComplete="current-password"
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Keep me signed in
              </label>
              <Link to="/forgot-password" className="forgot-password">
                Reset Password
              </Link>
            </div>

            <button 
              type="submit" 
              className={`login-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <button
              type="button"
              className="google-button"
              disabled={loading}
              onClick={handleGoogleClick}
            >
              <span className="google-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" focusable="false">
                  <g fill="none" fillRule="evenodd">
                    <path d="M17.64 9.2045c0-.638-.0573-1.251-.1636-1.836H9v3.471h4.843a4.137 4.137 0 0 1-1.796 2.716v2.258h2.907c1.702-1.567 2.686-3.875 2.686-6.609Z" fill="#4285F4"></path>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.186l-2.907-2.258c-.806.54-1.836.861-3.049.861-2.343 0-4.327-1.582-5.032-3.71H.957v2.332A8.998 8.998 0 0 0 9 18Z" fill="#34A853"></path>
                    <path d="M3.968 10.707a5.41 5.41 0 0 1 0-3.414V4.961H.957a8.998 8.998 0 0 0 0 8.078l3.011-2.332Z" fill="#FBBC05"></path>
                    <path d="M9 3.579c1.32 0 2.505.453 3.436 1.344l2.58-2.58C13.465.89 11.43 0 9 0a8.998 8.998 0 0 0-8.043 4.961l3.011 2.332C4.673 5.161 6.657 3.579 9 3.579Z" fill="#EA4335"></path>
                  </g>
                </svg>
              </span>
              Continue with Google Account
            </button>

            <div className="signup-link">
              New to JobIFY? <Link to="/register">Create Account</Link>
            </div>
          </form>
        </div>
      </div>

      <div className="login-right">
        <img
          src={heroImageUrl}
          alt="Young professionals collaborating in a modern workspace"
          className="login-hero-image"
        />
      </div>
    </div>
  );
};

export default Login;