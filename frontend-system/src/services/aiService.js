import api from './api';

export const aiService = {
  // AI CV Screening - Check if candidate qualifies
  async screenCV(applicationId, jobId) {
    const response = await api.post('/ai/screen-cv', {
      applicationId,
      jobId
    });
    return response.data;
  },

  // Get candidate qualification score
  async getQualificationScore(applicationId) {
    const response = await api.get(`/ai/qualification-score/${applicationId}`);
    return response.data;
  },

  // Shortlist candidates for a specific job
  async shortlistCandidates(jobId, limit = 5) {
    const response = await api.get(`/ai/shortlist/${jobId}?limit=${limit}`);
    return response.data;
  },

  // Toggle shortlist for an application
  async toggleShortlist(applicationId) {
    const response = await api.put(`/ai/shortlist/${applicationId}`);
    return response.data;
  },

  // Get AI recommendations for job matches
  async getJobRecommendations(applicationId) {
    const response = await api.get(`/ai/recommendations/${applicationId}`);
    return response.data;
  }
};
