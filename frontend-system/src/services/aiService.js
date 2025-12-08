// frontend-system/services/aiService.js
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
  },

  // NEW: Get match score for a specific job
  async getMatchScore(jobId) {
    const response = await api.get(`/ai/match-score/${jobId}`);
    return response.data;
  },

  // NEW: Get comprehensive AI report for job seeker
  async getJobSeekerReport() {
    const response = await api.get('/ai/jobseeker-report');
    return response.data;
  },

  // NEW: Get recommended jobs with AI scores
  async getRecommendedJobs(limit = 6) {
    const response = await api.get(`/jobs/recommended?limit=${limit}`);
    return response.data;
  },

  // NEW: Analyze profile and get improvement suggestions
  async analyzeProfile() {
    try {
      const response = await api.get('/ai/analyze-profile');
      return response.data;
    } catch (error) {
      // Fallback if endpoint doesn't exist
      console.warn('Analyze profile endpoint not available');
      return {
        profileCompleteness: 0,
        suggestions: [],
        estimatedMatchRange: '0-50%'
      };
    }
  }
};

export default aiService;