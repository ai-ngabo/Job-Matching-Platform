import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import deepseekService from '../utils/deepseekService.js';

const router = express.Router();

// Enhanced intelligent search with fallback
router.post('/intelligent-search', async (req, res) => {
  const { prompt, userId } = req.body;

  try {
    console.log('🔍 Intelligent search for:', prompt);
    
    // Try DeepSeek first
    const searchParams = await deepseekService.extractJobSearchIntent(prompt);
    console.log('📊 Extracted search params:', searchParams);
    
    // Build MongoDB query
    const query = { status: 'active' };
    const $and = [];

    if (searchParams.skills && searchParams.skills.length > 0) {
      $and.push({
        $or: [
          { skillsRequired: { $in: searchParams.skills.map(s => new RegExp(s, 'i')) } },
          { title: { $in: searchParams.skills.map(s => new RegExp(s, 'i')) } },
          { description: { $in: searchParams.skills.map(s => new RegExp(s, 'i')) } }
        ]
      });
    }

    if (searchParams.locations && searchParams.locations.length > 0) {
      $and.push({
        location: { $in: searchParams.locations.map(l => new RegExp(l, 'i')) }
      });
    }

    if (searchParams.jobTypes && searchParams.jobTypes.length > 0) {
      $and.push({
        jobType: { $in: searchParams.jobTypes }
      });
    }

    if ($and.length > 0) {
      query.$and = $and;
    }

    // Execute search
    const jobs = await Job.find(query)
      .populate('company', 'company.name company.industry company.logo company.description')
      .sort({ createdAt: -1 })
      .limit(8);

    console.log(`✅ Found ${jobs.length} jobs`);

    // Get AI explanation
    const aiExplanation = await deepseekService.generateResponse(
      `User asked: "${prompt}"
      
Search parameters extracted: ${JSON.stringify(searchParams)}
Jobs found: ${jobs.length}

Provide a helpful summary of these job opportunities.`,
      { jobCount: jobs.length, searchParams }
    );

    res.json({
      message: aiExplanation,
      jobs: jobs,
      searchParams,
      type: 'intelligent_search'
    });

  } catch (error) {
    console.error('❌ Intelligent search error, using fallback:', error);
    
    // Fallback to basic search
    const jobs = await Job.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title companyName location jobType salaryRange');
    
    res.json({
      message: `I found ${jobs.length} active job opportunities. Here are some recent listings:\n\n${jobs.map((j, i) => `${i+1}. **${j.title}** at ${j.companyName} (${j.location})`).join('\n')}\n\nYou can click on any job to view details and apply!`,
      jobs: jobs,
      type: 'fallback_search'
    });
  }
});

// Main conversational endpoint with fallback
router.post('/conversation', async (req, res) => {
  const { message, conversationHistory = [], userId } = req.body;

  try {
    console.log('💬 Conversation request:', { message, userId });

    // Get platform context for better responses
    const recentJobs = await Job.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title companyName location jobType salaryRange skillsRequired experienceLevel');

    const context = {
      platform: {
        totalJobs: recentJobs.length,
        recentJobs: recentJobs,
        features: ['AI Job Matching', 'Application Tracking', 'Career Guidance']
      }
    };

    // Try DeepSeek first
    const aiResponse = await deepseekService.generateResponse(message, context);

    // Check if we should include job recommendations
    const shouldIncludeJobs = 
      message.toLowerCase().includes('job') ||
      message.toLowerCase().includes('position') ||
      message.toLowerCase().includes('hire') ||
      message.toLowerCase().includes('opportunity') ||
      message.toLowerCase().includes('career');

    let jobs = [];
    if (shouldIncludeJobs && recentJobs.length > 0) {
      jobs = recentJobs.slice(0, 4);
    }

    res.json({
      message: aiResponse,
      jobs: jobs,
      type: 'ai_conversation'
    });

  } catch (error) {
    console.error('❌ DeepSeek error, using fallback:', error);
    
    // Comprehensive fallback responses
    const lowerMessage = message.toLowerCase().trim();
    let response = {};
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      response = {
        message: "👋 Hello! I'm your JobIFY AI Assistant! I can help you:\n\n• Find job opportunities that match your skills\n• Provide career guidance and advice\n• Answer questions about our platform\n• Help with your job search strategy\n\nWhat would you like to explore today?",
        type: 'greeting'
      };
    }
    else if (lowerMessage.includes('job') || lowerMessage.includes('position') || lowerMessage.includes('work')) {
      const jobs = await Job.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .limit(4)
        .select('title companyName location jobType salaryRange');
      
      response = {
        message: `🎯 I found ${jobs.length} active job opportunities!\n\n${jobs.map((j, i) => `${i+1}. **${j.title}**\n   🏢 ${j.companyName}\n   📍 ${j.location}\n   💼 ${j.jobType}`).join('\n\n')}\n\nClick on any job to view details and apply! ✨`,
        jobs: jobs,
        type: 'jobs'
      };
    }
    else if (lowerMessage.includes('salary') || lowerMessage.includes('pay')) {
      response = {
        message: "💰 **Salary Information**\n\nSalaries on JobIFY vary based on:\n\n• **Experience Level**: Junior vs Senior roles\n• **Location**: Local market rates\n• **Industry**: Tech, Finance, Healthcare etc.\n• **Job Type**: Full-time, Contract, Remote\n\n**Tip**: Look for jobs with listed salary ranges, and don't hesitate to discuss compensation during interviews!",
        type: 'info'
      };
    }
    else if (lowerMessage.includes('remote') || lowerMessage.includes('work from home')) {
      const remoteJobs = await Job.find({ 
        status: 'active',
        $or: [
          { jobType: 'remote' },
          { location: /remote/i }
        ]
      })
      .limit(4)
      .select('title companyName location jobType salaryRange');
      
      response = {
        message: `🌍 **Remote Opportunities**\n\n${remoteJobs.length > 0 ? 
          `Found ${remoteJobs.length} remote positions:\n\n${remoteJobs.map((j, i) => `${i+1}. **${j.title}** at ${j.companyName}`).join('\n')}` : 
          "Currently checking for remote opportunities. Try browsing our job listings with the 'Remote' filter!"}`,
        jobs: remoteJobs,
        type: 'remote_jobs'
      };
    }
    else if (lowerMessage.includes('interview') || lowerMessage.includes('prepare')) {
      response = {
        message: `🎤 **Interview Preparation**\n\n**Common Questions to Prepare:**\n1. "Tell me about yourself"\n2. "Why do you want this role?"\n3. "What are your strengths/weaknesses?"\n4. "Describe a challenging project"\n\n**Tips:**\n• Research the company thoroughly\n• Practice your answers aloud\n• Prepare questions to ask them\n• Dress professionally\n• Follow up with a thank you email\n\nYou've got this! 💪`,
        type: 'advice'
      };
    }
    else {
      response = {
        message: "🤖 I'm here to help with your job search! You can ask me about:\n\n• **Finding jobs** in specific fields or locations\n• **Career advice** and skill development\n• **Interview preparation** tips\n• **Salary information** and negotiation\n• **Remote work** opportunities\n• **How to use JobIFY** features\n\nWhat would you like to know?",
        type: 'help'
      };
    }

    res.json(response);
  }
});

// Keep existing endpoints for compatibility
router.post('/message', async (req, res) => {
  const { message } = req.body;
  return await router.handle('/conversation', req, res);
});

router.post('/search', async (req, res) => {
  const { prompt } = req.body;
  req.body.prompt = prompt;
  return await router.handle('/intelligent-search', req, res);
});

export default router;