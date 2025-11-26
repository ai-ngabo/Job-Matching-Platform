import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './Register.css';

const Register = () => {
  const heroImageUrl =
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=80';

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    userType: 'jobseeker',
    // Account
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    // Personal
    avatar: null,
    bio: '',
    location: '',
    phone: '',
    // Education & Experience
    skills: '',
    experienceLevel: 'entry',
    educationLevel: 'high-school',
    // Company
    companyName: '',
    companyDescription: '',
    companyWebsite: '',
    companyIndustry: '',
    companyContactPhone: '',
    companyContactEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  // Memoize the Google success handler
  const handleGoogleSuccess = useCallback(async (response) => {
    try {
      setLoading(true);
      setError('');
      
      if (!response || !response.credential) {
        throw new Error('No credential received from Google');
      }

      console.log('✅ Google Sign-In successful, sending token to backend...');
      
      // Send token to backend for verification
      const res = await api.post('/auth/google-login', {
        token: response.credential
      });

      const data = res.data;

      if (!data || !data.token) {
        throw new Error('No token received from server');
      }

      // Store token
      localStorage.setItem('authToken', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      console.log('✅ Google authentication successful, navigating...');

      // Navigate to dashboard or complete profile based on user data
      if (data.user?.profile?.firstName || data.user?.company?.name) {
        navigate('/dashboard', { replace: true });
      } else {
        // User needs to complete their profile
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to authenticate with Google';
      setError(errorMsg);
      console.error('❌ Google authentication error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Initialize Google SDK
  useEffect(() => {
    // Function to initialize Google Sign-In
    const initializeGoogleSignIn = () => {
      if (!window.google || !googleButtonRef.current) {
        return false;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnop.apps.googleusercontent.com',
          callback: handleGoogleSuccess,
          ux_mode: 'popup',
          locale: 'en'
        });
        
        // Render the button (Google doesn't accept percentage width, so we use CSS instead)
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
            locale: 'en'
          }
        );
        return true;
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        return false;
      }
    };

    // Check if Google SDK is already loaded
    if (window.google && googleButtonRef.current) {
      initializeGoogleSignIn();
      return;
    }

    // Load Google SDK if not already loaded
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Wait a bit for the ref to be ready, then initialize
        const checkAndInit = () => {
          if (googleButtonRef.current) {
            initializeGoogleSignIn();
          } else {
            // Retry after a short delay
            setTimeout(checkAndInit, 100);
          }
        };
        checkAndInit();
      };
      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
        setError('Failed to load Google Sign-In. Please refresh the page.');
      };
      document.body.appendChild(script);
    } else {
      // Script already loaded, just wait for ref
      const checkAndInit = () => {
        if (window.google && googleButtonRef.current) {
          initializeGoogleSignIn();
        } else {
          setTimeout(checkAndInit, 100);
        }
      };
      checkAndInit();
    }
  }, [handleGoogleSuccess]);

  const getSteps = () =>
    formData.userType === 'company'
      ? ['Selection', 'Account', 'Company Information']
      : ['Selection', 'Account', 'Personal Information', 'Education & Experience'];

  const steps = getSteps();
  const stepsLength = steps.length;

  React.useEffect(() => {
    if (step >= stepsLength) {
      setStep(Math.max(stepsLength - 1, 0));
    }
  }, [formData.userType, stepsLength, step]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files && files[0] ? files[0] : null }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const canProceedFromStep = () => {
    if (step === 0) {
      return !!formData.userType;
    }

    if (step === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!formData.agreeToTerms) {
        setError('Please agree to the terms and conditions');
        return false;
      }

      if (formData.userType === 'jobseeker') {
        if (!formData.firstName || !formData.lastName) {
          return false;
        }
      }

      if (formData.userType === 'company') {
        if (!formData.companyName) {
          return false;
        }
      }

      return true;
    }

    if (formData.userType === 'company' && step === 2) {
      if (!formData.companyDescription || !formData.companyIndustry) {
        return false;
      }
    }

    return true;
  };

  const goNext = () => {
    setError('');
    if (!canProceedFromStep()) return;
    setStep((currentStep) => Math.min(currentStep + 1, getSteps().length - 1));
  };

  const goBack = () => {
    setError('');
    setStep(s => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!canProceedFromStep()) return;
    setLoading(true);
    try {
      // Prepare data (omit confirmPassword and avatar file if backend not ready)
      const { confirmPassword, avatar, ...rest } = formData;
      const payload =
        formData.userType === 'company'
          ? {
              userType: rest.userType,
              email: rest.email,
              password: rest.password,
              companyName: rest.companyName,
              companyDescription: rest.companyDescription,
              companyWebsite: rest.companyWebsite,
              companyIndustry: rest.companyIndustry,
              companyContactPhone: rest.companyContactPhone,
              companyContactEmail: rest.companyContactEmail
            }
          : {
              userType: rest.userType,
              email: rest.email,
              password: rest.password,
              firstName: rest.firstName,
              lastName: rest.lastName,
              bio: rest.bio,
              location: rest.location,
              phone: rest.phone,
              skills: rest.skills,
              experienceLevel: rest.experienceLevel,
              educationLevel: rest.educationLevel
            };

      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <img
          src={heroImageUrl}
          alt="Young African professionals collaborating"
          className="register-hero-image"
        />
      </div>

      <div className="register-right">
        <div className="register-content">
          <div className="register-header">
            <Link to="/" className="logo">
              <span className="logo-main">JobIFY</span>
              <span className="logo-sub">AI Job Matching</span>
            </Link>
            <h1>Create your account</h1>
            <p className="register-subtitle">
              Join JobIFY to discover AI-powered job opportunities tailored for you.
            </p>
          </div>

          <div className="stepper">
            {steps.map((label, idx) => (
              <div key={label} className={`step ${idx <= step ? 'active' : ''}`}>
                <div className="step-index">{idx + 1}</div>
                <div className="step-label">{label}</div>
                {idx < steps.length - 1 && <div className="step-divider" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => e.preventDefault()}
            className="register-form"
          >
            {step === 0 && (
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="userType">I am a</label>
                  <select
                    id="userType"
                    name="userType"
                    value={formData.userType}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="jobseeker">Job Seeker</option>
                    <option value="company">Company / Employer</option>
                  </select>
                </div>
              </div>
            )}

            {step === 1 && formData.userType === 'jobseeker' && (
              <div className="form-section">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter your first name"
                      required
                      disabled={loading}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter your last name"
                      required
                      disabled={loading}
                      className="form-input"
                    />
                  </div>
                </div>

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

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                      minLength="6"
                      disabled={loading}
                      className="form-input"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      disabled={loading}
                      className="form-input"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <label className="checkbox-label terms-checkbox">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  I agree to the terms and conditions
                </label>
              </div>
            )}

            {step === 1 && formData.userType === 'company' && (
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter your company name"
                    required
                    disabled={loading}
                    className="form-input"
                  />
                </div>

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

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                      minLength="6"
                      disabled={loading}
                      className="form-input"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      disabled={loading}
                      className="form-input"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <label className="checkbox-label terms-checkbox">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  I agree to the terms and conditions
                </label>
              </div>
            )}

            {formData.userType === 'jobseeker' && step === 2 && (
              <div className="form-section">
                <p className="section-intro">
                  Tell us a little more about you. This helps us personalize job matches.
                </p>
                <div className="form-group">
                  <label htmlFor="avatar">Add Profile Picture</label>
                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/*"
                    onChange={handleChange}
                    disabled={loading}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Briefly describe your background and interests"
                    disabled={loading}
                    className="form-input"
                    rows="3"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, Country (e.g., Kigali, Rwanda)"
                      disabled={loading}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+250 7XX XXX XXX"
                      disabled={loading}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.userType === 'jobseeker' && step === 3 && (
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="skills">Skills</label>
                  <textarea
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="List your skills separated by commas (e.g., React, Node.js, SQL)"
                    disabled={loading}
                    className="form-input"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="experienceLevel">Experience Level</label>
                    <select
                      id="experienceLevel"
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      disabled={loading}
                      className="form-input"
                    >
                      <option value="entry">Entry</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="educationLevel">Education Level</label>
                    <select
                      id="educationLevel"
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      disabled={loading}
                      className="form-input"
                    >
                      <option value="high-school">High School</option>
                      <option value="diploma">Diploma</option>
                      <option value="bachelors">Bachelors</option>
                      <option value="masters">Masters</option>
                      <option value="phd">PhD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {formData.userType === 'company' && step === 2 && (
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="companyDescription">Company Description</label>
                  <textarea
                    id="companyDescription"
                    name="companyDescription"
                    value={formData.companyDescription}
                    onChange={handleChange}
                    placeholder="Describe your company and vision"
                    disabled={loading}
                    className="form-input"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyWebsite">Website Link</label>
                  <input
                    type="url"
                    id="companyWebsite"
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                    placeholder="https://yourcompany.com"
                    disabled={loading}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyIndustry">Industry</label>
                  <input
                    type="text"
                    id="companyIndustry"
                    name="companyIndustry"
                    value={formData.companyIndustry}
                    onChange={handleChange}
                    placeholder="e.g., Technology, Finance, Healthcare"
                    disabled={loading}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyContactPhone">Contact Phone</label>
                  <input
                    type="tel"
                    id="companyContactPhone"
                    name="companyContactPhone"
                    value={formData.companyContactPhone}
                    onChange={handleChange}
                    placeholder="+250 7XX XXX XXX"
                    disabled={loading}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyContactEmail">Contact Email</label>
                  <input
                    type="email"
                    id="companyContactEmail"
                    name="companyContactEmail"
                    value={formData.companyContactEmail}
                    onChange={handleChange}
                    placeholder="hr@yourcompany.com"
                    disabled={loading}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            <div className="form-nav">
              <button
                type="button"
                className="secondary-button"
                onClick={goBack}
                disabled={loading || step === 0}
              >
                Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={goNext}
                  disabled={loading}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className={`register-button ${loading ? 'loading' : ''}`}
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              )}
            </div>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <div 
              ref={googleButtonRef}
              className="google-button-container"
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            ></div>

            <div className="login-link">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;