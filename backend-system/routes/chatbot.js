import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Application from '../models/Application.js';

const router = express.Router();

// CHATBOT WITH REAL JOBSIFY DATA
router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('💬 Chatbot received:', message);

    const lowerMessage = message.toLowerCase();

    // GET REAL DATA FROM YOUR DATABASE
    const recentJobs = await Job.find({ status: 'active' })
      .populate('company', 'company.name company.industry company.logo')
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title companyName location jobType salaryRange experienceLevel skillsRequired applicationDeadline')
      .lean();

    const totalJobs = await Job.countDocuments({ status: 'active' });
    const companies = await User.find({ 
      userType: 'company', 
      approvalStatus: 'approved' 
    })
    .select('company.name company.industry company.description')
    .limit(5)
    .lean();

    // RESPONSES WITH REAL DATA
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return res.json({
        message: `👋 **Welcome to JobIFY!** \n\nI'm your AI assistant for **JobIFY** - the platform founded by **Alain Ngabo** to connect talent with opportunities!\n\n• We have **${totalJobs} active jobs** from **${companies.length} companies**\n• AI-powered matching for better job fits\n• Real-time application tracking\n• Career development resources\n\nWhat would you like to explore on JobIFY today?`,
        jobs: recentJobs.slice(0, 3),
        type: 'greeting'
      });
    }

    if (lowerMessage.includes('job') || lowerMessage.includes('work') || lowerMessage.includes('position') || lowerMessage.includes('opportunity')) {
      let filteredJobs = recentJobs;
      let filterMessage = '';
      
      // REAL FILTERING BASED ON USER QUERY
      if (lowerMessage.includes('remote') || lowerMessage.includes('work from home')) {
        filteredJobs = recentJobs.filter(job => 
          job.jobType?.toLowerCase().includes('remote') || 
          job.location?.toLowerCase().includes('remote')
        );
        filterMessage = '🌍 **Remote Opportunities**\n\n';
      }
      
      if (lowerMessage.includes('tech') || lowerMessage.includes('software') || lowerMessage.includes('developer')) {
        filteredJobs = recentJobs.filter(job => 
          job.title?.toLowerCase().includes('software') ||
          job.title?.toLowerCase().includes('developer') ||
          job.title?.toLowerCase().includes('engineer') ||
          job.title?.toLowerCase().includes('programmer')
        );
        filterMessage = '💻 **Tech Jobs on JobIFY**\n\n';
      }

      if (lowerMessage.includes('senior') || lowerMessage.includes('experienced')) {
        filteredJobs = recentJobs.filter(job => 
          job.experienceLevel?.toLowerCase().includes('senior') ||
          job.experienceLevel?.toLowerCase().includes('experienced')
        );
        filterMessage = '🎯 **Senior Roles**\n\n';
      }

      const jobsToShow = filteredJobs.length > 0 ? filteredJobs.slice(0, 4) : recentJobs.slice(0, 4);

      return res.json({
        message: `${filterMessage || '🎯 **Active Jobs on JobIFY**'}\n\n${jobsToShow.length > 0 ? 
          jobsToShow.map((job, i) => 
            `**${i+1}. ${job.title}**\n   🏢 ${job.companyName || job.company?.company?.name}\n   📍 ${job.location}\n   💼 ${job.jobType}\n   ${job.experienceLevel ? `🎯 ${job.experienceLevel}` : ''}\n   ${job.salaryRange?.min ? `💰 $${job.salaryRange.min} - $${job.salaryRange.max}` : '💵 Competitive Salary'}`
          ).join('\n\n') :
          'No jobs match your criteria yet. Try browsing all jobs or check back soon!'
        }\n\n💡 *These are real jobs on JobIFY - click to apply!*`,
        jobs: jobsToShow,
        type: 'jobs'
      });
    }

    if (lowerMessage.includes('salary') || lowerMessage.includes('pay') || lowerMessage.includes('compensation')) {
      // REAL SALARY DATA FROM JOBS
      const jobsWithSalary = recentJobs.filter(job => job.salaryRange && (job.salaryRange.min || job.salaryRange.max));
      
      return res.json({
        message: `💰 **Real Salary Data on JobIFY**\n\nBased on actual job listings:\n\n${
          jobsWithSalary.length > 0 ? 
          jobsWithSalary.slice(0, 5).map(job => 
            `• **${job.title}**: $${job.salaryRange.min || '0'} - $${job.salaryRange.max || 'N/A'}`
          ).join('\n') : 
          'Check individual job listings for salary information - many employers share ranges!'
        }\n\n💡 **JobIFY Tip**: Complete your profile to see personalized salary estimates!`,
        type: 'salary_info',
        jobs: jobsWithSalary.slice(0, 3)
      });
    }

    if (lowerMessage.includes('company') || lowerMessage.includes('employer') || lowerMessage.includes('business')) {
      return res.json({
        message: `🏢 **Companies Hiring on JobIFY**\n\n${companies.length > 0 ? 
          companies.map((company, i) => 
            `**${i+1}. ${company.company?.name || 'Company'}**\n   🏭 ${company.company?.industry || 'Various Industry'}\n   ${company.company?.description ? `📝 ${company.company.description.substring(0, 100)}...` : '💼 Active on JobIFY'}`
          ).join('\n\n') :
          'Our company network is growing daily! Check back for more employers.'
        }\n\n💡 *Follow companies you like for job alerts!*`,
        companies: companies,
        type: 'companies'
      });
    }

    if (lowerMessage.includes('interview') || lowerMessage.includes('prepare')) {
      return res.json({
        message: `🎤 **JobIFY Interview Preparation**\n\n**For JobIFY Applications:**\n\n1. **Complete Your Profile** - Employers see this first!\n2. **Upload Your CV** - Required for applications\n3. **Track Applications** - See status in real-time\n4. **Prepare for Video Interviews** - Many JobIFY employers use them\n\n**Common Questions:**\n• "Why do you want to work with our company?"\n• "What skills do you bring to this role?"\n• "How do you handle challenges?"\n\n💡 *Use JobIFY's application tracking to follow up professionally!*`,
        type: 'interview_tips'
      });
    }

    if (lowerMessage.includes('remote') || lowerMessage.includes('work from home') || lowerMessage.includes('wfh')) {
      const remoteJobs = await Job.find({ 
        status: 'active',
        $or: [
          { jobType: /remote/i },
          { location: /remote/i }
        ]
      })
      .populate('company', 'company.name company.industry')
      .limit(4)
      .select('title companyName location jobType salaryRange')
      .lean();

      return res.json({
        message: `🌍 **Remote Jobs on JobIFY**\n\n${remoteJobs.length > 0 ? 
          `We have ${remoteJobs.length} remote positions:\n\n${remoteJobs.map((job, i) => 
            `**${i+1}. ${job.title}**\n   🏢 ${job.companyName}\n   💼 ${job.jobType}\n   ${job.salaryRange ? `💰 $${job.salaryRange.min || '0'} - $${job.salaryRange.max || 'N/A'}` : '💵 Competitive'}`
          ).join('\n\n')}` : 
          "More remote opportunities coming soon! Try our job search with 'remote' filter."
        }\n\n💡 *Remote work = Flexibility + Global opportunities!*`,
        jobs: remoteJobs,
        type: 'remote_jobs'
      });
    }

    if (lowerMessage.includes('apply') || lowerMessage.includes('application') || lowerMessage.includes('how to apply')) {
      return res.json({
        message: `📝 **How to Apply on JobIFY**\n\n**Simple 3-Step Process:**\n\n1. **Browse Jobs** - Use search or get AI recommendations\n2. **Click Apply** - On any job that interests you\n3. **Submit & Track** - We'll notify you of updates\n\n**Requirements:**\n• Complete JobIFY profile\n• Upload your CV/Resume\n• Optional: Add a cover letter\n\n💡 *Track all your applications in your JobIFY dashboard!*`,
        type: 'application_guide'
      });
    }

    if (lowerMessage.includes('profile') || lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
      return res.json({
        message: `👤 **Optimize Your JobIFY Profile**\n\n**Get More Job Matches:**\n\n✅ **Complete All Sections**\n• Personal information\n• Skills and expertise\n• Work experience\n• Education background\n\n✅ **Upload Documents**\n• Professional CV/Resume\n• Cover letter template\n• Portfolio (if applicable)\n\n✅ **Boost Visibility**\n• Add a professional photo\n• Write a compelling bio\n• List all relevant skills\n\n💡 *Complete profiles get 3x more employer views!*`,
        type: 'profile_tips'
      });
    }

    // DEFAULT RESPONSE WITH JOBIFY INFO
    res.json({
      message: `🤖 **JobIFY AI Assistant**\n\nI'm here to help you navigate **JobIFY** - your AI-powered job platform!\n\n**Real Data Available:**\n• ${totalJobs} active job listings\n• ${companies.length} hiring companies\n• AI-powered job matching\n• Real application tracking\n\n**Ask me about:**\n• Jobs in specific fields\n• Company information\n• Salary ranges\n• Interview preparation\n• Remote opportunities\n• How to use JobIFY features\n\nWhat would you like to explore?`,
      jobs: recentJobs.slice(0, 2),
      type: 'help'
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    // FALLBACK WITH JOBIFY BRANDING
    res.json({
      message: "👋 Welcome to JobIFY! I'm here to help you find amazing opportunities on our platform. We connect talented people with great companies. What would you like to know?",
      type: 'greeting',
      jobs: []
    });
  }
});

export default router;