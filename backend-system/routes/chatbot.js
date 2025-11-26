import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';

const router = express.Router();

const stopWords = new Set([
  'i',
  'am',
  "i'm",
  'interested',
  'in',
  'for',
  'with',
  'looking',
  'searching',
  'jobs',
  'role',
  'roles',
  'a',
  'an',
  'the',
  'and',
  'like'
]);

const normalizeKeywords = (prompt = '') => {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !stopWords.has(word))
    .slice(0, 6);
};

router.post('/search', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    const keywords = normalizeKeywords(prompt);
    const baseFilter = { status: 'active' };
    let jobs = [];

    if (keywords.length) {
      const textQuery = keywords.join(' ');
      jobs = await Job.find({
        ...baseFilter,
        $text: { $search: textQuery }
      })
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .limit(8)
        .select('title companyName location jobType category skillsRequired experienceLevel applicationDeadline');
    }

    if (!jobs.length && keywords.length) {
      const regex = new RegExp(keywords.join('|'), 'i');
      jobs = await Job.find({
        ...baseFilter,
        $or: [
          { category: { $in: keywords } },
          { jobType: { $in: keywords } },
          { skillsRequired: { $in: keywords } },
          { title: regex }
        ]
      })
        .limit(8)
        .select('title companyName location jobType category skillsRequired experienceLevel applicationDeadline');
    } else if (!jobs.length) {
      jobs = await Job.find(baseFilter)
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title companyName location jobType category skillsRequired experienceLevel applicationDeadline');
    }

    res.json({
      message: jobs.length ? 'Matches found' : 'No jobs found for that field yet.',
      matches: jobs,
      keywords
    });
  } catch (error) {
    console.error('❌ Chatbot search error:', error);
    res.status(500).json({
      message: 'Unable to process chatbot search',
      error: error.message
    });
  }
});

// Conversational chatbot endpoint
router.post('/message', async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    const lowerMessage = message.toLowerCase().trim();

    // Check for JobIFY information queries
    if (
      lowerMessage.includes('jobify') ||
      lowerMessage.includes('about') ||
      lowerMessage.includes('what is') ||
      lowerMessage.includes('who created') ||
      lowerMessage.includes('founder') ||
      lowerMessage.includes('started') ||
      lowerMessage.includes('founded')
    ) {
      const response = {
        message: `JobIFY is an AI-powered job matching platform founded by Alain Ngabo on November 25th, 2025. 

Our mission is to revolutionize the job search experience by connecting talented job seekers with the right opportunities through intelligent matching algorithms. 

JobIFY was created to solve the challenges job seekers face in finding relevant positions and help companies discover the perfect candidates. We use advanced AI technology to analyze skills, experience, and preferences to provide personalized job recommendations.

Whether you're looking for your next career move or seeking top talent, JobIFY makes the process seamless and efficient.`,
        type: 'info'
      };
      return res.json(response);
    }

    // Check for company listing queries
    if (
      lowerMessage.includes('compan') ||
      lowerMessage.includes('employer') ||
      lowerMessage.includes('who work') ||
      lowerMessage.includes('list compan') ||
      lowerMessage.includes('registered compan')
    ) {
      const companies = await User.find({
        userType: 'company',
        approvalStatus: 'approved'
      })
        .select('company.name company.industry company.description')
        .limit(20);

      if (companies.length === 0) {
        return res.json({
          message: 'Currently, there are no approved companies registered on JobIFY yet. Check back soon!',
          companies: []
        });
      }

      const companyList = companies.map(u => ({
        name: u.company?.name || 'Unnamed Company',
        industry: u.company?.industry || 'Not specified',
        description: u.company?.description || ''
      }));

      const companyNames = companyList.map(c => c.name).join(', ');
      
      return res.json({
        message: `Here are the companies currently working with JobIFY:\n\n${companyList.map((c, i) => `${i + 1}. ${c.name}${c.industry ? ` (${c.industry})` : ''}`).join('\n')}\n\nThese companies are actively posting jobs and looking for talented candidates like you!`,
        companies: companyList,
        type: 'companies'
      });
    }

    // Check for job search queries
    if (
      lowerMessage.includes('job') ||
      lowerMessage.includes('position') ||
      lowerMessage.includes('role') ||
      lowerMessage.includes('opportunit') ||
      lowerMessage.includes('interested') ||
      lowerMessage.includes('looking for') ||
      lowerMessage.includes('find') ||
      lowerMessage.includes('search')
    ) {
      const keywords = normalizeKeywords(message);
      const baseFilter = { status: 'active' };
      let jobs = [];

      if (keywords.length) {
        const textQuery = keywords.join(' ');
        jobs = await Job.find({
          ...baseFilter,
          $text: { $search: textQuery }
        })
          .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
          .limit(5)
          .select('title companyName location jobType category skillsRequired experienceLevel applicationDeadline');
      }

      if (!jobs.length && keywords.length) {
        const regex = new RegExp(keywords.join('|'), 'i');
        jobs = await Job.find({
          ...baseFilter,
          $or: [
            { category: { $in: keywords } },
            { jobType: { $in: keywords } },
            { skillsRequired: { $in: keywords } },
            { title: regex }
          ]
        })
          .limit(5)
          .select('title companyName location jobType category skillsRequired experienceLevel applicationDeadline');
      } else if (!jobs.length) {
        jobs = await Job.find(baseFilter)
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title companyName location jobType category skillsRequired experienceLevel applicationDeadline');
      }

      if (jobs.length > 0) {
        return res.json({
          message: `I found ${jobs.length} job${jobs.length > 1 ? 's' : ''} that match your interest! Here they are:`,
          jobs: jobs,
          type: 'jobs'
        });
      } else {
        return res.json({
          message: "I couldn't find any jobs matching that description right now. Try asking about a specific field, skill, or job type (like 'software developer', 'marketing', 'remote jobs', etc.)",
          jobs: [],
          type: 'jobs'
        });
      }
    }

    // Default helpful response
    return res.json({
      message: `I'm here to help! You can ask me about:
      
• JobIFY - Learn about our platform and mission
• Companies - See which companies are on JobIFY
• Jobs - Search for positions by field, skill, or type
• Your interests - Tell me what you're looking for and I'll find matching jobs

What would you like to know?`,
      type: 'help'
    });

  } catch (error) {
    console.error('❌ Chatbot message error:', error);
    res.status(500).json({
      message: 'Sorry, I encountered an error processing your message. Please try again.',
      error: error.message
    });
  }
});

export default router;

