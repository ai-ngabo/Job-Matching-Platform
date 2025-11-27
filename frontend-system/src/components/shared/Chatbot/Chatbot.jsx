import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { chatbotService } from '../../../services/chatbotService';
import './Chatbot.css';

const Chatbot = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [quickActions] = useState([
    { label: "💰 High Paying Jobs", action: "high_paying_jobs", icon: "💸" },
    { label: "🌍 Remote Work", action: "remote_opportunities", icon: "🏠" },
    { label: "💻 Tech Jobs", action: "tech_jobs", icon: "⚡" },
    { label: "🚀 Career Advice", action: "career_guidance", icon: "🎯" },
    { label: "🎤 Interview Prep", action: "interview_prep", icon: "💼" },
    { label: "📊 Salary Tips", action: "salary_advice", icon: "💰" }
  ]);

  useEffect(() => {
    if (isOpen && !isMinimized && messages.length === 0) {
      const greeting = {
        type: 'bot',
        text: "Hello! 👋 I'm your AI Job Assistant powered by DeepSeek. I can help you:\n\n• Find the perfect jobs matching your skills\n• Provide career guidance and advice\n• Compare salaries and companies\n• Prepare for interviews\n• Explore remote opportunities\n\nWhat would you like to explore today?",
        timestamp: new Date()
      };
      setMessages([greeting]);
      setConversationHistory([greeting]);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      type: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    const updatedHistory = [...conversationHistory, userMessage];
    setConversationHistory(updatedHistory);
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(
        inputValue.trim(),
        updatedHistory,
        user?.id
      );

      const botMessage = {
        type: 'bot',
        text: response.message,
        timestamp: new Date(),
        jobs: response.jobs || [],
        companies: response.companies || [],
        responseType: response.type,
        context: response.context
      };

      setConversationHistory(prev => [...prev, botMessage]);
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        type: 'bot',
        text: "I apologize, but I'm having trouble connecting to my AI brain right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setConversationHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = async (action) => {
    setLoading(true);
    
    try {
      const response = await chatbotService.quickAction(action, { userId: user?.id });
      
      const botMessage = {
        type: 'bot',
        text: response.message,
        timestamp: new Date(),
        jobs: response.jobs || [],
        responseType: response.type
      };

      setMessages(prev => [...prev, botMessage]);
      setConversationHistory(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Quick action error:', error);
      const errorMessage = {
        type: 'bot',
        text: "I couldn't process that quick action. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setConversationHistory(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (isOpen) {
      if (isMinimized) {
        setIsMinimized(false);
      } else {
        setIsMinimized(true);
      }
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    // Keep conversation history but reset messages when reopening
    setMessages([]);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return (
      <button className="chatbot-toggle" onClick={handleToggle} aria-label="Open chatbot">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h3>JobIFY AI Assistant</h3>
            <p className="chatbot-status">Powered by DeepSeek</p>
          </div>
        </div>
        <div className="chatbot-header-actions">
          <button onClick={handleToggle} className="chatbot-minimize" aria-label="Minimize">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button onClick={handleClose} className="chatbot-close" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Quick Actions Panel */}
          {messages.length <= 2 && (
            <div className="chatbot-quick-actions">
              <p className="quick-actions-title">Quick Help</p>
              <div className="quick-action-buttons">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    className="quick-action-btn"
                    onClick={() => handleQuickAction(action.action)}
                    disabled={loading}
                  >
                    <span className="action-icon">{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-message ${msg.type}`}>
                {msg.type === 'bot' && (
                  <div className="chatbot-message-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                )}
                <div className="chatbot-message-content">
                  <p>{msg.text}</p>
                  
                  {/* Enhanced Jobs List */}
                  {msg.jobs && msg.jobs.length > 0 && (
                    <div className="chatbot-jobs-list">
                      {msg.jobs.map((job) => (
                        <div
                          key={job._id}
                          className="chatbot-job-item"
                          onClick={() => handleJobClick(job._id)}
                        >
                          <h4>{job.title}</h4>
                          <p>{job.companyName} • {job.location}</p>
                          <div className="chatbot-job-meta">
                            <span className="job-meta-tag">{job.jobType}</span>
                            {job.salaryRange && (job.salaryRange.min || job.salaryRange.max) && (
                              <span className="job-meta-tag job-salary">
                                ${job.salaryRange.min || '0'} - ${job.salaryRange.max || 'N/A'}
                              </span>
                            )}
                            {(job.jobType?.toLowerCase().includes('remote') || job.location?.toLowerCase().includes('remote')) && (
                              <span className="job-meta-tag job-remote">Remote</span>
                            )}
                            {job.experienceLevel && (
                              <span className="job-meta-tag">{job.experienceLevel}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Companies List */}
                  {msg.companies && msg.companies.length > 0 && (
                    <div className="chatbot-companies-list">
                      {msg.companies.map((company, idx) => (
                        <div key={idx} className="chatbot-company-item">
                          <strong>{company.name}</strong>
                          {company.industry && <span> • {company.industry}</span>}
                          {company.description && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                              {company.description.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {msg.type === 'user' && (
                  <div className="chatbot-message-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div className="message-time" style={{ 
                  fontSize: '10px', 
                  color: '#94a3b8', 
                  alignSelf: 'flex-end',
                  marginTop: '4px'
                }}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="chatbot-message bot">
                <div className="chatbot-message-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="chatbot-message-content">
                  <div className="chatbot-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form className="chatbot-input-form" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about jobs, careers, salaries..."
              disabled={loading}
              className="chatbot-input"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || loading} 
              className="chatbot-send"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chatbot;