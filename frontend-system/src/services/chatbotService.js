import api from './api';

export const chatbotService = {
  async intelligentSearch(prompt, userId = null) {
    try {
      const response = await api.post('/chatbot/intelligent-search', { 
        prompt, 
        userId 
      });
      return response.data;
    } catch (error) {
      console.error('Intelligent search error:', error);
      throw error;
    }
  },

  async sendMessage(message, conversationHistory = [], userId = null) {
    try {
      const response = await api.post('/chatbot/conversation', {
        message,
        conversationHistory,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  async getCareerAdvice(topic, userBackground = {}, goals = '') {
    try {
      const response = await api.post('/chatbot/career-advice', {
        topic,
        userBackground,
        goals
      });
      return response.data;
    } catch (error) {
      console.error('Career advice error:', error);
      throw error;
    }
  },

  // Quick actions for common queries
  async quickAction(action, params = {}) {
    const quickActions = {
      'high_paying_jobs': {
        message: "Show me the highest paying jobs available right now",
        type: 'intelligent-search'
      },
      'remote_opportunities': {
        message: "Find remote work opportunities I can apply to",
        type: 'intelligent-search'
      },
      'tech_jobs': {
        message: "Show me technology and software development jobs",
        type: 'intelligent-search'
      },
      'career_guidance': {
        message: "I need career guidance and advice for professional growth",
        type: 'conversation'
      },
      'interview_prep': {
        message: "Help me prepare for job interviews and common questions",
        type: 'conversation'
      },
      'salary_advice': {
        message: "Provide salary negotiation advice and market rates",
        type: 'conversation'
      }
    };

    const actionConfig = quickActions[action];
    if (!actionConfig) {
      throw new Error('Quick action not found');
    }

    if (actionConfig.type === 'intelligent-search') {
      return await this.intelligentSearch(actionConfig.message, params.userId);
    } else {
      return await this.sendMessage(actionConfig.message, [], params.userId);
    }
  },

  // Legacy method for backward compatibility
  async searchJobs(prompt) {
    return await this.intelligentSearch(prompt);
  }
};

export default chatbotService;