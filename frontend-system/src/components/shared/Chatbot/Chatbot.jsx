import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatbotService } from '../../../services/chatbotService';
import './Chatbot.css';

const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isMinimized && messages.length === 0) {
      // Initial greeting when chatbot opens
      const greeting = {
        type: 'bot',
        text: "Hello! 👋 Welcome to JobIFY! I'm your AI assistant here to help you find your dream job. How can I assist you today?",
        timestamp: new Date()
      };
      setMessages([greeting]);
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

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(inputValue.trim());
      
      const botMessage = {
        type: 'bot',
        text: response.message || response.text || 'I apologize, but I couldn\'t process that request.',
        timestamp: new Date(),
        jobs: response.jobs || [],
        companies: response.companies || []
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'bot',
        text: error.response?.data?.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
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
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h3>JobIFY Assistant</h3>
            <p className="chatbot-status">Online</p>
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
              {msg.jobs && msg.jobs.length > 0 && (
                <div className="chatbot-jobs-list">
                  {msg.jobs.map((job) => (
                    <div 
                      key={job._id} 
                      className="chatbot-job-item"
                      onClick={() => handleJobClick(job._id)}
                    >
                      <h4>{job.title}</h4>
                      <p>{job.companyName} • {job.location} • {job.jobType}</p>
                    </div>
                  ))}
                </div>
              )}
              {msg.companies && msg.companies.length > 0 && (
                <div className="chatbot-companies-list">
                  {msg.companies.map((company, idx) => (
                    <div key={idx} className="chatbot-company-item">
                      <strong>{company.name}</strong>
                      {company.industry && <span> • {company.industry}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
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

      <form className="chatbot-input-form" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          className="chatbot-input"
        />
        <button type="submit" disabled={!inputValue.trim() || loading} className="chatbot-send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Chatbot;

