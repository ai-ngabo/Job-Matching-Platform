import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Application from '../models/Application.js';

const router = express.Router();

// Comprehensive stop words list
const stopWords = new Set([
  'i', 'am', "i'm", 'interested', 'in', 'for', 'with', 'looking', 'searching',
  'jobs', 'role', 'roles', 'a', 'an', 'the', 'and', 'like', 'to', 'is', 'are',
  'can', 'could', 'would', 'will', 'do', 'does', 'did', 'be', 'been', 'being',
  'have', 'has', 'had', 'or', 'but', 'not', 'no', 'yes', 'so', 'as', 'at',
  'by', 'on', 'of', 'about', 'from', 'what', 'where', 'when', 'who', 'why',
  'how', 'which', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her'
]);

// Enhanced keyword extraction with intent detection
const extractIntent = (message) => {
  const lower = message.toLowerCase().trim();
  
  const intents = {
    about_platform: ['jobify', 'about', 'what is', 'who created', 'founded', 'mission', 'purpose', 'started'],
    company_info: ['company', 'employer', 'companies', 'list compan', 'registered', 'hiring'],
    job_search: ['job', 'position', 'role', 'opportunit', 'looking', 'find', 'search', 'vacancy'],
    salary_info: ['salary', 'pay', 'compensation', 'wage', 'cost', 'money', 'how much'],
    experience_level: ['junior', 'senior', 'entry', 'beginner', 'expert', 'level'],
    location: ['remote', 'onsite', 'hybrid', 'location', 'where', 'city', 'country', 'office'],
    skills: ['skill', 'qualification', 'require', 'technical', 'soft skill'],
    career: ['career', 'career path', 'advance', 'growth', 'develop', 'learn'],
    application: ['apply', 'application', 'applied', 'application status', 'how to apply'],
    profile: ['profile', 'resume', 'cv', 'update', 'upload', 'portfolio'],
    help: ['help', 'how do', 'how can', 'guide', 'tutorial', 'support', 'feature']
  };

  let detectedIntents = [];
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(kw => lower.includes(kw))) {
      detectedIntents.push(intent);
    }
  }
  
  return detectedIntents.length > 0 ? detectedIntents : ['general'];
};

// Enhanced keyword normalization
const normalizeKeywords = (prompt = '') => {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !stopWords.has(word) && word.length > 2)
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

// Conversational chatbot endpoint - ENHANCED
router.post('/message', async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    const lowerMessage = message.toLowerCase().trim();
    const intents = extractIntent(message);

    // ========== ABOUT JOBIFY ==========
    if (intents.includes('about_platform')) {
      const responses = {
        what_is: `JobIFY is an AI-powered job matching platform that revolutionizes how job seekers and employers connect. Founded on November 25, 2025, by Alain Ngabo, JobIFY uses intelligent algorithms to match candidates with their ideal roles.

🎯 **Key Features:**
• AI-powered job recommendations personalized to your skills
• Real-time application tracking and status updates
• Smart candidate matching for employers
• Career development resources and guidance
• Direct communication between employers and candidates
• Application journey tracking with email notifications

Our mission is to eliminate the friction in job searching and hiring, making it easy for talented individuals to find meaningful work and for companies to discover top talent.`,

        mission: `Our mission at JobIFY is simple yet powerful: **Connect Talent with Opportunity**. We believe everyone deserves to find work they're passionate about, and companies deserve to find the right people. We're building the future of recruitment through AI and human-centered design.`,

        founder: `JobIFY was founded by **Alain Ngabo** on November 25, 2025. Alain is passionate about leveraging technology to solve real-world problems in the job market, making recruitment more fair, transparent, and efficient for everyone.`,

        started: `JobIFY launched on November 25, 2025, as a response to the challenges in modern job searching. We recognized that both job seekers and employers were struggling with inefficiency and lack of personalization. That's when JobIFY was born—a platform that puts intelligence and humanity at the center of recruitment.`
      };

      let response = responses.what_is;
      if (lowerMessage.includes('mission')) response = responses.mission;
      if (lowerMessage.includes('founder') || lowerMessage.includes('created')) response = responses.founder;
      if (lowerMessage.includes('started') || lowerMessage.includes('began')) response = responses.started;

      return res.json({ message: response, type: 'info', confidence: 0.95 });
    }

    // ========== COMPANY INFORMATION ==========
    if (intents.includes('company_info')) {
      const companies = await User.find({
        userType: 'company',
        approvalStatus: 'approved'
      })
        .select('company.name company.industry company.description company.website company.founded')
        .limit(20);

      if (companies.length === 0) {
        return res.json({
          message: `📋 **No Companies Yet**\n\nWe're currently building our company network. Be among the first to explore opportunities! Check back soon as more companies join JobIFY daily.\n\nIn the meantime, browse available job postings to see what's in the market.`,
          companies: [],
          type: 'companies',
          confidence: 0.9
        });
      }

      const companyList = companies.map(u => ({
        name: u.company?.name || 'Unnamed Company',
        industry: u.company?.industry || 'Not specified',
        description: u.company?.description || 'No description available',
        website: u.company?.website || null
      }));

      const message = `🏢 **Companies on JobIFY** (${companies.length} total)\n\nHere are the companies actively hiring through our platform:\n\n${companyList.map((c, i) => `**${i + 1}. ${c.name}**\n   Industry: ${c.industry}\n   ${c.description ? `Description: ${c.description.substring(0, 100)}...` : 'Building their team with us'}`).join('\n\n')}\n\nThese companies are actively posting jobs and looking for talented candidates like you! Explore their open positions to find your next opportunity.`;

      return res.json({
        message,
        companies: companyList,
        type: 'companies',
        confidence: 0.92
      });
    }

    // ========== JOB SEARCH ==========
    if (intents.includes('job_search')) {
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
          .limit(8)
          .select('title companyName location jobType category skillsRequired experienceLevel applicationDeadline salaryRange');
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
          .select('title companyName location jobType category skillsRequired experienceLevel applicationDeadline salaryRange');
      } else if (!jobs.length) {
        jobs = await Job.find(baseFilter)
          .sort({ createdAt: -1 })
          .limit(6)
          .select('title companyName location jobType category skillsRequired experienceLevel applicationDeadline salaryRange');
      }

      if (jobs.length > 0) {
        const jobList = jobs.map((j, i) => `**${i + 1}. ${j.title}** at ${j.companyName}\n   📍 ${j.location} | ${j.jobType}\n   💼 ${j.experienceLevel || 'Not specified'}\n   ${j.salaryRange ? `💰 ${j.salaryRange}` : ''}`).join('\n\n');
        
        const message = `🎯 **Found ${jobs.length} Job${jobs.length !== 1 ? 's' : ''}!**\n\n${jobList}\n\n✨ *Click on any job to view full details and apply!*`;
        
        return res.json({
          message,
          jobs: jobs,
          type: 'jobs',
          confidence: 0.93
        });
      } else {
        return res.json({
          message: `🔍 **No Jobs Found Yet**\n\nI couldn't find jobs matching "${message}" right now. Here are some tips:\n\n• Try searching for a **specific role** (e.g., "Software Developer", "Marketing Manager")\n• Search by **job type** (e.g., "remote jobs", "full-time", "freelance")\n• Try a **skill** (e.g., "Python", "React", "Project Management")\n• Search by **location** (e.g., "New York", "Berlin", "Singapore")\n\nOr ask me about companies and opportunities in different fields!`,
          jobs: [],
          type: 'jobs',
          confidence: 0.85
        });
      }
    }

    // ========== SALARY INFORMATION ==========
    if (intents.includes('salary_info')) {
      return res.json({
        message: `💰 **Salary Information**\n\nJobIFY job listings include salary ranges when available. Factors affecting salary:\n\n• **Experience Level**: Entry-level roles typically pay less than senior positions\n• **Location**: Cost of living varies significantly by region\n• **Job Type**: Full-time vs freelance compensation differs\n• **Industry**: Tech and finance usually offer higher salaries\n• **Skills**: Specialized skills command premium compensation\n\n**Tip**: When browsing jobs, filter by salary range to find positions matching your expectations. If a job doesn't list salary, don't hesitate to ask the employer during the application process!`,
        type: 'info',
        confidence: 0.88
      });
    }

    // ========== APPLICATION PROCESS ==========
    if (intents.includes('application')) {
      return res.json({
        message: `📝 **How to Apply on JobIFY**\n\n**Step 1**: Browse or search for jobs that interest you\n**Step 2**: Click on a job to view full details\n**Step 3**: Review requirements and company information\n**Step 4**: Click "Apply" button\n**Step 5**: Write a brief cover letter (optional but recommended)\n**Step 6**: Submit your application\n\n✅ **After Applying**:\n• You'll receive a confirmation email\n• The company will review your profile\n• Track your application status in your dashboard\n• Receive notifications at each stage (Under Review → Shortlisted → Interview → Offer)\n\n💡 **Pro Tips**:\n• Ensure your profile is complete and up-to-date\n• Upload a professional CV/Resume\n• Personalize your cover letters\n• Respond quickly to company messages\n• Check your email for interview invitations`,
        type: 'guide',
        confidence: 0.91
      });
    }

    // ========== PROFILE & RESUME ==========
    if (intents.includes('profile')) {
      return res.json({
        message: `👤 **Profile & Resume Optimization**\n\n**Building Your Profile**:\n• Complete all profile fields (name, email, location)\n• Write a compelling professional summary\n• List your skills and expertise\n• Add your experience and education\n• Upload a professional profile photo\n\n**Resume/CV Tips**:\n• Keep it to 1-2 pages (3 max for senior roles)\n• Use clear, readable formatting\n• Highlight achievements and metrics\n• Include relevant skills and certifications\n• Update it regularly for each job application\n\n**What Employers Look For**:\n✓ Clear career progression\n✓ Quantifiable achievements\n✓ Relevant skills\n✓ Strong educational background\n✓ Professional presentation\n\n📌 A complete profile increases your chances of being discovered by companies by 40%!`,
        type: 'guide',
        confidence: 0.89
      });
    }

    // ========== CAREER ADVICE ==========
    if (intents.includes('career')) {
      return res.json({
        message: `🚀 **Career Development & Growth**\n\n**Career Progression**:\n• Start with entry-level roles to build foundation\n• Gain relevant skills and certifications\n• Seek mentorship from senior professionals\n• Take on challenging projects\n• Move to intermediate roles after 2-3 years\n\n**Skill Development**:\n• Identify gaps between your skills and target roles\n• Take online courses (Coursera, Udemy, etc.)\n• Practice through projects and freelance work\n• Build a portfolio to showcase your work\n• Stay updated with industry trends\n\n**Networking**:\n• Attend industry events and conferences\n• Connect with professionals on LinkedIn\n• Join relevant communities and forums\n• Engage with content in your field\n• Build genuine relationships\n\n**Salary Growth**:\n• Research market rates for your position\n• Document your achievements\n• Negotiate confidently during interviews\n• Change jobs strategically when possible\n• Develop in-demand skills\n\n💡 **Remember**: Career growth is a marathon, not a sprint. Focus on continuous learning and building value.`,
        type: 'guide',
        confidence: 0.87
      });
    }

    // ========== LOCATION & REMOTE WORK ==========
    if (intents.includes('location') && (lowerMessage.includes('remote') || lowerMessage.includes('location'))) {
      const isRemote = lowerMessage.includes('remote');
      return res.json({
        message: isRemote ? 
`🌍 **Remote Jobs on JobIFY**\n\n**Benefits of Remote Work**:\n✓ Work from anywhere in the world\n✓ No commute saves time and money\n✓ Better work-life balance\n✓ Access to global opportunities\n✓ Often more flexible hours\n\n**Types of Remote Positions**:\n• Fully Remote (work from home)\n• Hybrid (office + home)\n• Flexible (your choice)\n\n**Finding Remote Jobs**:\n1. Use the job search filter for "Remote"\n2. Filter by job type and location\n3. Check company policies for flexibility\n4. Confirm timezone requirements\n\n**Remote Work Tips**:\n• Have a dedicated workspace\n• Maintain strong communication\n• Use collaboration tools effectively\n• Keep regular working hours\n• Build relationships with remote team` :
`📍 **Location-Based Jobs on JobIFY**\n\n**Searching by Location**:\n1. Go to job search\n2. Filter by city/region\n3. View jobs nearby\n4. Check office locations\n\n**Benefits of Office Work**:\n✓ Team collaboration and mentorship\n✓ Clear career progression\n✓ Networking opportunities\n✓ Company culture immersion\n✓ Professional development\n\n**Popular Hiring Cities**:\n• Tech hubs (San Francisco, Berlin, Singapore)\n• Financial centers (London, New York, Hong Kong)\n• Emerging markets (Kigali, Lagos, Bangalore)\n\n**Relocation Tips**:\n• Research cost of living\n• Understand visa requirements\n• Budget for moving expenses\n• Connect with local communities\n• Visit before committing if possible`,
        type: 'guide',
        confidence: 0.9
      });
    }

    // ========== SKILLS & REQUIREMENTS ==========
    if (intents.includes('skills')) {
      return res.json({
        message: `🎯 **Skills & Job Requirements**\n\n**Understanding Job Requirements**:\n• **Must-haves**: Non-negotiable skills listed first\n• **Nice-to-haves**: Additional skills that are beneficial\n• **Soft skills**: Communication, leadership, teamwork\n• **Technical skills**: Programming, tools, platforms\n\n**How to Match Your Skills**:\n1. List your current skills\n2. Identify gaps in target roles\n3. Learn missing technical skills\n4. Practice soft skills through projects\n5. Update your profile with new skills\n\n**Don't Worry If**:\n• You don't have 100% of skills (60-70% is usually enough)\n• You're missing some nice-to-have skills\n• You can learn on the job\n\n**In-Demand Skills (2025)**:\n💻 **Tech**: AI/ML, Cloud Computing, Full-Stack Development\n📊 **Data**: Data Analysis, Business Intelligence\n🎨 **Design**: UX/UI, Product Design\n💼 **Business**: Project Management, Sales, Marketing\n\n**Building Skills**:\n• Online courses and certifications\n• Real project experience\n• Freelance projects\n• Open-source contributions\n• Skills showcase/portfolio`,
        type: 'guide',
        confidence: 0.91
      });
    }

    // ========== INTERVIEW PREPARATION ==========
    if (lowerMessage.includes('interview') || lowerMessage.includes('prepare')) {
      return res.json({
        message: `🎤 **Interview Preparation Guide**\n\n**Before the Interview**:\n✓ Research the company thoroughly\n✓ Review the job description\n✓ Prepare examples of your work\n✓ Practice common questions\n✓ Prepare questions to ask\n✓ Test technology (video call)\n✓ Dress appropriately\n✓ Arrive 15 minutes early\n\n**Common Interview Questions**:\n1. "Tell me about yourself"\n2. "Why do you want this role?"\n3. "What are your strengths?"\n4. "What are your weaknesses?"\n5. "Describe a challenge you overcame"\n6. "Where do you see yourself in 5 years?"\n7. "Why should we hire you?"\n\n**How to Answer Well**:\n• Use the STAR method (Situation, Task, Action, Result)\n• Provide specific examples\n• Show enthusiasm and authenticity\n• Keep answers concise (2-3 minutes)\n• Relate experiences to the role\n\n**Interview Types**:\n📞 **Phone Screen**: Brief initial conversation\n💻 **Video Call**: More in-depth discussion\n🏢 **In-Person**: Final round, meet the team\n💻 **Technical Test**: Coding or task-based\n🤝 **Panel Interview**: Multiple interviewers\n\n**After the Interview**:\n✓ Send thank-you email within 24 hours\n✓ Mention specific points from discussion\n✓ Reiterate interest in position\n✓ Wait for their response\n\n💡 **Pro Tip**: Be genuine, enthusiastic, and show how you can add value to their team!`,
        type: 'guide',
        confidence: 0.92
      });
    }

    // ========== HELP & FEATURES ==========
    if (intents.includes('help')) {
      return res.json({
        message: `❓ **How Can JobIFY Help You?**\n\n**For Job Seekers**:\n🔍 Search & discover jobs matched to your skills\n💬 Get personalized job recommendations\n📋 Track your applications in real-time\n📧 Receive notifications at each stage\n👤 Build and optimize your profile\n📞 Direct communication with employers\n💡 Career guidance and resources\n🎯 AI-powered job matching\n\n**For Employers**:\n📢 Post jobs and reach qualified candidates\n🤖 Smart candidate matching\n📊 Manage applications efficiently\n📧 Automated communication\n💼 Build your employer brand\n🎯 Find top talent faster\n\n**Key Features**:\n✅ AI-powered recommendations\n✅ Application journey tracking\n✅ Email notifications\n✅ Video interview integration\n✅ Real-time status updates\n✅ Skill-based matching\n✅ Interview scheduling\n✅ Offer management\n\n**Quick Navigation**:\n• 🏠 **Dashboard**: View your job recommendations\n• 🔍 **Search Jobs**: Find opportunities\n• 📨 **Applications**: Track your applications\n• 👤 **Profile**: Update your information\n• 💬 **Messages**: Communicate with employers\n\n**What would you like to know more about?**`,
        type: 'help',
        confidence: 0.94
      });
    }

    // ========== DEFAULT INTELLIGENT RESPONSE ==========
    return res.json({
      message: `👋 **I'm here to help! Here's what I can assist with:**\n\n🏢 **About JobIFY**: Learn about our platform and mission\n🔍 **Job Search**: Find opportunities in any field or role\n💰 **Salary Info**: Understand compensation in different roles\n📝 **Applications**: Learn how to apply and track progress\n👤 **Profile Help**: Optimize your resume and profile\n🎤 **Interview Prep**: Get ready for your interviews\n🚀 **Career Growth**: Develop your professional path\n🌍 **Remote Jobs**: Find work from anywhere\n🎯 **Skills**: Understand requirements and develop abilities\n\n**Feel free to ask me anything about:**\n• Specific job roles or industries\n• Career development\n• Interview preparation\n• Company information\n• Remote work opportunities\n• Salary expectations\n• How to use JobIFY\n\n*What would you like to explore?*`,
      type: 'help',
      confidence: 0.88
    });

  } catch (error) {
    console.error('❌ Chatbot message error:', error);
    res.status(500).json({
      message: 'Sorry, I encountered an error. Please try again in a moment.',
      error: error.message,
      type: 'error'
    });
  }
});

export default router;

