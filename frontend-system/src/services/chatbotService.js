import api from './api';

export const chatbotService = {
  async sendMessage(message, conversationHistory = [], userId = null) {
    try {
      const response = await api.post('/chatbot/message', {
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

  // Quick actions for common queries
  async quickAction(action, params = {}) {
    const quickActions = {
      'high_paying_jobs': {
        message: "Show me the highest paying jobs available right now"
      },
      'remote_opportunities': {
        message: "Find remote work opportunities I can apply to"
      },
      'tech_jobs': {
        message: "Show me technology and software development jobs"
      },
      'career_guidance': {
        message: "I need career guidance and advice for professional growth"
      },
      'interview_prep': {
        message: "Help me prepare for job interviews and common questions"
      },
      'salary_advice': {
        message: "Provide salary negotiation advice and market rates"
      }
    };

    const actionConfig = quickActions[action];
    if (!actionConfig) {
      throw new Error('Quick action not found');
    }

    return await this.sendMessage(actionConfig.message, [], params.userId);
  }
};

export default chatbotService;