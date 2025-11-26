import api from './api';

export const chatbotService = {
  async searchJobs(prompt) {
    const response = await api.post('/chatbot/search', { prompt });
    return response.data;
  },

  async sendMessage(message) {
    const response = await api.post('/chatbot/message', { message });
    return response.data;
  }
};

