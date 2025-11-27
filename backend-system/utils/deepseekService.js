import axios from 'axios';

class DeepSeekService {
  constructor() {
    this.apiKey = 'sk-b4cf5f3c24904282b9f85f3ed2c121e1';
    this.baseURL = 'https://api.deepseek.com/v1';
  }

  async generateResponse(prompt, context = {}) {
    try {
      console.log('🤖 Calling DeepSeek API with context:', context);
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are JobIFY AI Assistant - an intelligent career and job matching expert for the JobIFY platform.

IMPORTANT CONTEXT ABOUT JOBSIFY:
- Platform founded by Alain Ngabo on November 25, 2025
- AI-powered job matching platform connecting job seekers and employers
- Based in Rwanda but serves global opportunities
- Features: job search, AI recommendations, application tracking, career guidance

YOUR ROLE:
Help users with job search, career advice, salary information, interview preparation, and platform guidance.

RESPONSE GUIDELINES:
- Be specific, actionable, and helpful
- Use natural, conversational tone
- Include relevant job data when available
- Suggest next steps
- If job data is provided, reference specific opportunities
- For salary questions, provide realistic ranges based on location/experience

PLATFORM DATA CONTEXT: ${JSON.stringify(context, null, 2)}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✅ DeepSeek response received');
      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('❌ DeepSeek API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error('I apologize, but I\'m having trouble connecting to my AI brain right now. Please try again in a moment.');
    }
  }

  async extractJobSearchIntent(prompt) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `Extract job search parameters from user query. Return ONLY valid JSON:

{
  "skills": ["array of skills mentioned"],
  "locations": ["array of locations mentioned"],
  "jobTypes": ["full-time", "part-time", "contract", "freelance", "remote"],
  "experienceLevel": "entry|mid|senior|any",
  "salaryRange": {"min": number, "max": number},
  "industries": ["array of industries mentioned"],
  "companies": ["array of companies mentioned"]
}

Rules:
- Only include parameters explicitly mentioned
- Return empty arrays for missing parameters
- experienceLevel: only if specifically mentioned
- salaryRange: only if numbers mentioned`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('DeepSeek Intent Extraction Error:', error);
      return {};
    }
  }
}

export default new DeepSeekService();