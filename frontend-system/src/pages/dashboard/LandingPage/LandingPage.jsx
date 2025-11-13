import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Users, 
  Briefcase, 
  Target, 
  CheckCircle, 
  ArrowRight,
  Menu,
  X,
  Building2,
  FileText,
  Zap,
  Filter,
  Send
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contact: '',
    message: ''
  });
  const [formMessage, setFormMessage] = useState('');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormMessage('Thank you for reaching out! We will get back to you soon.');
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      contact: '',
      message: ''
    });

    setTimeout(() => {
      setFormMessage('');
    }, 5000);
  };

  const features = [
    {
      icon: <Users className="feature-icon" />,
      title: 'User Registration',
      description: 'Separate portals for job seekers and employers with secure authentication',
      color: 'purple'
    },
    {
      icon: <FileText className="feature-icon" />,
      title: 'Profile Management',
      description: 'Upload CV and credentials for comprehensive profile building',
      color: 'blue'
    },
    {
      icon: <Briefcase className="feature-icon" />,
      title: 'Job Posting',
      description: 'Employers can easily post and manage job opportunities',
      color: 'pink'
    },
    {
      icon: <Search className="feature-icon" />,
      title: 'Smart Search',
      description: 'Advanced filtering to find the perfect job match quickly',
      color: 'green'
    },
    {
      icon: <Zap className="feature-icon" />,
      title: 'AI Matching',
      description: 'Skills-based matching algorithm connecting talent to opportunities',
      color: 'yellow'
    },
    {
      icon: <Filter className="feature-icon" />,
      title: 'Application System',
      description: 'Streamlined application process with real-time tracking',
      color: 'indigo'
    }
  ];

  const stats = [
    { number: '20%+', label: 'Youth Unemployment Rate' },
    { number: 'AI', label: 'Powered Matching' },
    { number: '100%', label: 'Verified Opportunities' }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">JobIFY</span>
          </div>
          
          <div className={`nav-links ${isMenuOpen ? 'nav-links-mobile' : ''}`}>
            <a href="#home" className="nav-link">Home</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#mission" className="nav-link">Mission</a>
            <a href="#contact" className="nav-link">Contact</a>
            <Link to="/login" className="nav-login-btn">
              Login
            </Link>
          </div>

          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title">
            Connecting Rwanda's Youth to Their Future
          </h1>
          <p className="hero-subtitle">
            AI-powered job matching platform reducing youth unemployment through verified opportunities
          </p>
          <Link to="/register" className="cta-button">
            Get Started Today
            <ArrowRight className="cta-icon" />
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="mission-section">
        <div className="mission-container">
          <h2 className="mission-title">Our Mission</h2>
          <p className="mission-text">
            We leverage technology to reduce youth unemployment in Rwanda through a digital platform 
            that connects job seekers to verified opportunities. Our solution is part of Rwanda's 
            growing technology ecosystem, directly contributing to inclusive economic development 
            and complementing national strategies for job creation and ICT growth.
          </p>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="problem-section">
        <div className="problem-container">
          <h2 className="problem-title">The Challenge We're Solving</h2>
          <div className="problem-grid">
            <div className="problem-card problem-card-purple">
              <h3 className="problem-card-title">For Job Seekers</h3>
              <ul className="problem-list">
                <li className="problem-list-item">
                  <CheckCircle className="list-icon" />
                  Recent graduates struggling to find employment
                </li>
                <li className="problem-list-item">
                  <CheckCircle className="list-icon" />
                  Lack of platforms matching skills to opportunities
                </li>
                <li className="problem-list-item">
                  <CheckCircle className="list-icon" />
                  Long, inefficient application processes
                </li>
              </ul>
            </div>
            <div className="problem-card problem-card-blue">
              <h3 className="problem-card-title">For Employers</h3>
              <ul className="problem-list">
                <li className="problem-list-item">
                  <CheckCircle className="list-icon" />
                  Difficulty finding qualified candidates
                </li>
                <li className="problem-list-item">
                  <CheckCircle className="list-icon" />
                  Time-consuming screening processes
                </li>
                <li className="problem-list-item">
                  <CheckCircle className="list-icon" />
                  Limited access to talent pools
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-container">
          <h2 className="features-title">MVP Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className={`feature-card feature-card-${feature.color}`}>
                <div className="feature-icon-container">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="partners-section">
        <div className="partners-container">
          <h2 className="partners-title">Our Partners</h2>
          <p className="partners-subtitle">
            Working together with leading organizations to create opportunities for Rwanda's youth
          </p>
          <div className="partners-grid">
            {['Partner 1', 'Partner 2', 'Partner 3', 'Partner 4'].map((partner, index) => (
              <div key={index} className="partner-item">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <h2 className="contact-title">Reach Out to Us</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  className="form-input"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  className="form-input"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="form-input"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contact" className="form-label">Contact</label>
              <input
                type="tel"
                id="contact"
                name="contact"
                required
                className="form-input"
                value={formData.contact}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="message" className="form-label">Message</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                required
                className="form-textarea"
                value={formData.message}
                onChange={handleInputChange}
              ></textarea>
            </div>
            <button type="submit" className="submit-button">
              <Send className="submit-icon" />
              Submit
            </button>
            {formMessage && (
              <div className="form-message">
                {formMessage}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-section">
              <h3 className="footer-logo">JobIFY</h3>
              <p className="footer-text">
                Connecting Rwanda's youth to verified opportunities through AI-powered matching.
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Location</h4>
              <p className="footer-text">Kigali, Rwanda</p>
              <p className="footer-text">KG 123 St, Gasabo</p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Follow Us</h4>
              <div className="social-links">
                <a href="#" className="social-link">
                  <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="social-link">
                  <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="social-link">
                  <svg className="social-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2024 JobIFY. All rights reserved. Empowering Rwanda's youth through technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;