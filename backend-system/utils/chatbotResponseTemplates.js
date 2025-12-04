/**
 * Response templates for chatbot intents
 * Provides fallback responses and context-aware message generation
 */

export const responseTemplates = {
  greeting: {
    templates: [
      "👋 Welcome to JobIFY! I'm your AI job assistant. I can help you:\n\n• 🔍 Find the perfect jobs matching your skills\n• 💼 Get career guidance and advice\n• 💰 Explore salaries and compensation\n• 🎤 Prepare for interviews\n• 🏢 Discover companies hiring in your field\n\nWhat would you like to explore today?",
      "Hey there! 👋 Welcome to JobIFY! I'm here to help you navigate your job search journey. Whether you want to find jobs, learn about companies, or get career advice, just let me know. What can I help you with?",
      "Hello! 🎯 I'm your JobIFY AI assistant. I specialize in matching you with great jobs, providing career insights, and helping you succeed in interviews. What brings you here today?"
    ]
  },

  job_search: {
    templates: [
      "🔍 Great! I found some jobs that might interest you:\n\n{jobs}\n\nClick on any job to view full details and apply. If you want to narrow down the search, tell me more about what you're looking for!",
      "📋 Here are available positions that match your interest:\n\n{jobs}\n\nFeel free to ask about specific roles, locations, or salaries!",
      "✨ I've compiled a list of relevant job opportunities for you:\n\n{jobs}\n\nWould you like to know more about any of these positions or filter by location, salary, or experience level?"
    ]
  },

  salary_info: {
    templates: [
      "💰 Here are some of the highest-paying opportunities available:\n\n{topJobs}\n\nThe salary market varies based on experience level, location, and industry. Want to know more about a specific role?",
      "💵 Salary insights from our platform:\n\n{stats}\n\n{topJobs}\n\nThese represent some of the best-paying roles currently available. Interested in any of these?",
      "📊 Based on current listings, here's what I found:\n\n{topJobs}\n\nSalary ranges depend on your experience, skills, and location. Let me know if you'd like recommendations for a specific level!"
    ]
  },

  best_salary: {
    templates: [
      "🏆 The highest-paying jobs on JobIFY right now:\n\n{topJobs}\n\nThese top-tier positions require strong experience and specialized skills. Which interests you most?",
      "💎 Premium, high-paying opportunities:\n\n{topJobs}\n\nThese roles offer competitive compensation packages. Ready to apply or need more details?",
      "🌟 Best-paying positions available:\n\n{topJobs}\n\nCompetition for these roles is typically higher. Make sure your profile showcases your strongest skills!"
    ]
  },

  remote_work: {
    templates: [
      "🌍 Remote and flexible work opportunities:\n\n{jobs}\n\nThese roles allow you to work from anywhere! Click on any position to learn more about the requirements and apply.",
      "💻 Work-from-home and remote positions:\n\n{jobs}\n\nPerfect for anyone seeking flexibility and the freedom to work globally. Which one catches your eye?",
      "🏠 Here are the latest remote job openings:\n\n{jobs}\n\nEnjoy the flexibility of working from your preferred location. Check out these opportunities!"
    ]
  },

  companies: {
    templates: [
      "🏢 Here are some of the leading companies hiring on JobIFY:\n\n{companies}\n\nVisit their profiles to learn about their culture, current openings, and what it's like to work there!",
      "👥 Featured companies actively recruiting:\n\n{companies}\n\nThese are verified employers with open positions. Explore their profiles to find opportunities that match you!",
      "🌟 Top employers on JobIFY:\n\n{companies}\n\nInvestigate these companies' cultures and job listings. You might find your next dream role!"
    ]
  },

  career_guidance: {
    templates: [
      "🚀 Career Growth Tips:\n\n📈 **Continuous Learning**: Develop new skills relevant to your target role\n💼 **Network**: Build professional relationships in your industry\n🎯 **Goal Setting**: Define short-term and long-term career objectives\n📊 **Track Progress**: Monitor your advancement and accomplishments\n🤝 **Mentorship**: Find mentors and learn from experienced professionals\n\nWould you like advice on any specific area?",
      "💡 **Career Development Path**:\n\n1. **Assess Your Skills**: Identify strengths and areas for growth\n2. **Set Objectives**: Define where you want to be in 1, 3, 5 years\n3. **Build Your Brand**: Create a strong professional profile\n4. **Gain Experience**: Take on challenging projects and roles\n5. **Network Strategically**: Connect with industry leaders\n6. **Upskill Continuously**: Stay updated with industry trends\n\nWhat's your next career milestone?",
      "🎓 **Career Advancement Strategy**:\n\n✓ Update your skills regularly\n✓ Seek mentorship and guidance\n✓ Build a strong professional network\n✓ Showcase your achievements\n✓ Be open to new opportunities\n✓ Invest in professional development\n\nLet me help you explore career growth options!"
    ]
  },

  interview_prep: {
    templates: [
      "🎤 **Interview Preparation Guide**:\n\n📋 **Before the Interview**:\n• Research the company thoroughly\n• Practice common interview questions\n• Prepare your story and examples\n• Dress appropriately and arrive early\n\n💬 **Common Questions**:\n• Tell me about yourself\n• Why do you want this role?\n• What are your strengths and weaknesses?\n• Describe a challenge you overcame\n\n✨ **Pro Tips**:\n• Be confident and authentic\n• Use the STAR method for stories\n• Ask thoughtful questions\n• Follow up after the interview\n\nWould you like tips on specific interview scenarios?",
      "🏆 **Ace Your Interview**:\n\n✅ **Preparation Steps**:\n1. Know the job description inside-out\n2. Research the company's mission and values\n3. Prepare examples of your achievements\n4. Practice with a friend or mirror\n5. Get good sleep and eat well\n\n🎯 **During the Interview**:\n• Listen carefully to each question\n• Pause before answering\n• Maintain eye contact\n• Show enthusiasm for the role\n• Ask about team dynamics and growth\n\n🚀 **After the Interview**:\n• Send a thank-you email within 24 hours\n• Highlight why you're perfect for the role\n• Reiterate your interest\n\nReady to land that job?",
      "💪 **Interview Success Formula**:\n\n📚 **Preparation**:\n• Review your resume thoroughly\n• Know 3-5 strong examples\n• Practice your introduction (2 min)\n• Prepare questions to ask\n\n🗣️ **Communication**:\n• Speak clearly and at a moderate pace\n• Use positive body language\n• Tell stories, not just facts\n• Show genuine interest\n\n🎁 **Differentiation**:\n• Share unique insights about the company\n• Explain how you add specific value\n• Mention relevant industry knowledge\n• Be memorable and personable\n\nLet's build your confidence for the big day!"
    ]
  },

  profile_completion: {
    templates: [
      "👤 **Complete Your Profile**:\n\nA strong profile dramatically improves your job match chances!\n\n✅ **Essential sections**:\n• Professional photo (clear, friendly)\n• Compelling headline (role + key skills)\n• Detailed work experience\n• Skills (add 5-10 relevant ones)\n• Education & certifications\n• Project portfolio (if applicable)\n• Professional links (GitHub, LinkedIn)\n\n💡 **Pro tip**: The more complete your profile, the better our AI can match you with ideal jobs!\n\nNeed help with specific sections?",
      "📝 **Profile Enhancement Checklist**:\n\n📸 **About You**:\n☐ Professional profile photo\n☐ Compelling bio (2-3 sentences)\n☐ Current job title and experience level\n\n🎯 **Skills & Experience**:\n☐ List 5-10 core skills\n☐ Add work history with achievements\n☐ Include certifications and education\n\n🌟 **Showcase**:\n☐ Portfolio or project examples\n☐ Links to relevant work (GitHub, portfolio)\n☐ Key achievements and metrics\n\nComplete these to unlock better job matches!",
      "🚀 **Level Up Your Profile**:\n\nYour profile is your digital resume. Make it count!\n\n✨ **Must-Have Elements**:\n• Clear, professional photo\n• Detailed skills list (helps our AI match you perfectly)\n• Complete work history with metrics\n• Education and certifications\n• Link to portfolio or GitHub\n\n🎁 **Bonus Additions**:\n• Endorsements from colleagues\n• Recommendations\n• Personal projects\n• Published articles or insights\n\nLet's get your profile match-ready!"
    ]
  },

  most_paying_field: {
    templates: [
      "📈 The fields currently paying the most on JobIFY are:\n\n{fields}\n\nHere are a few representative openings in the top field:\n\n{exampleJobs}\n\nSalaries depend on experience and location. Would you like openings filtered by experience level or location?",
      "💼 Top-paying industries right now:\n\n{fields}\n\nYou can inspect these roles to see requirements and apply:\n\n{exampleJobs}\n\nWant me to show only remote or senior roles?",
      "💸 Most lucrative fields on JobIFY:\n\n{fields}\n\nSample top jobs in the leading field:\n\n{exampleJobs}\n\nAsk me to filter these by location or role level."
    ]
  },

  how_to_get_job: {
    templates: [
      "🎯 How to get a job — practical steps:\n\n1. Polish your profile and resume with measurable achievements\n2. Tailor applications to the job description\n3. Build skills that appear often in job listings (take short courses)\n4. Network with people in target companies\n5. Prepare for interviews using role-specific examples\n6. Follow-up after applications and interviews\n\nI can help: review your profile, find matching jobs, or give interview questions for a role. What would you like first?",
      "🚀 Steps to increase your hiring chances:\n\n• Complete your JobIFY profile with skills and projects\n• Apply to roles that match your skills level (entry/mid/senior)\n• Upskill in-demand technologies listed in job requirements\n• Use our AI job suggestions to target roles you match\n• Prepare for interviews with the STAR method and company research\n\nWant me to check your profile or show roles to apply to now?",
      "📚 A quick checklist to land a job:\n\n1. Optimize your profile (photo, headline, skills)\n2. Create a tailored resume for each application\n3. Network and request referrals\n4. Practice interview questions and case studies\n5. Keep applying and iterate on feedback\n\nI can fetch job matches and build a prioritized list for you—shall I?"
    ]
  },

  about_platform: {
    templates: [
      "🌟 **Welcome to JobIFY**!\n\n**Our Mission**: Empower job seekers and employers across Rwanda and beyond with a modern, transparent, and efficient job matching platform.\n\n**What We Offer**:\n✓ Smart AI-powered job matching based on your skills\n✓ Verified company profiles and employer reviews\n✓ Application tracking and status updates\n✓ Interview guidance and career support\n✓ Support for remote, freelance, and full-time roles\n✓ Transparent salary information\n\n**Founded**: November 25, 2025\n**Created by**: Alain Ngabo\n\nHave questions about JobIFY?",
      "🎯 **About JobIFY**:\n\nWe're a modern job platform designed to connect talented professionals with dream opportunities.\n\n**Our Core Values**:\n💼 Transparency in hiring\n🤝 Fair opportunities for all\n📈 Career growth support\n🌍 Global reach with local focus\n\n**Key Features**:\n• Smart job matching algorithm\n• Company verification system\n• Secure application process\n• Real-time notifications\n• Career resources and guidance\n\n**Who We Serve**:\n👨‍💼 Job seekers looking for their next opportunity\n🏢 Companies seeking top talent\n🌐 Both local (Rwanda) and international candidates\n\nReady to explore opportunities on JobIFY?",
      "🌈 **JobIFY Platform Overview**:\n\n**Founded**: November 2025 by Alain Ngabo\n**Purpose**: Bridge the gap between talented job seekers and innovative companies\n\n**Platform Highlights**:\n🔍 Intelligent job matching using AI\n✅ Verified employers and secure applications\n📲 Real-time notifications and updates\n🎓 Career development resources\n💰 Transparent salary information\n🌍 Remote and flexible opportunities\n\n**Why JobIFY**:\nWe believe the right opportunity can transform careers and lives. Our mission is to make that connection seamless and fair for everyone.\n\nWhat would you like to explore?"
    ]
  },

  help: {
    templates: [
      "🆘 **How Can I Help You?**\n\nI'm your JobIFY AI Assistant. Here's what I can do:\n\n🔍 **Find Jobs**: Search by title, location, salary, or skills\n💼 **Career Advice**: Get guidance on career growth and development\n💰 **Salary Info**: Explore compensation trends\n🎤 **Interview Prep**: Get tips for acing interviews\n👤 **Profile Help**: Optimize your job seeker profile\n🏢 **Company Info**: Learn about employers\n❓ **General Help**: Answer questions about JobIFY\n\nWhat would you like to do?",
      "💡 **I Can Assist With**:\n\n✨ **Job Discovery**:\n• Find jobs matching your skills\n• Filter by location, salary, role type\n• Get personalized recommendations\n\n📚 **Learning & Growth**:\n• Career development advice\n• Interview preparation strategies\n• Skill enhancement tips\n\n🤔 **Information**:\n• About JobIFY and how it works\n• Company profiles and reviews\n• Salary and market insights\n\n🎯 **Profile Optimization**:\n• Profile completion tips\n• Skill showcasing strategies\n• Application best practices\n\nWhat do you need help with today?",
      "🤖 **Welcome!**\n\nI'm here to help with:\n\n📋 Browsing and applying for jobs\n🎯 Career planning and guidance\n💬 Interview tips and preparation\n📊 Salary and benefits information\n🏢 Information about companies\n✨ Optimizing your profile\n❓ General platform guidance\n\nJust ask me anything about jobs and careers on JobIFY!"
    ]
  },

  generic: {
    templates: [
      "😊 Thanks for reaching out! I'm here to help you navigate your job search journey on JobIFY.\n\nFeel free to ask me about:\n• Finding specific jobs\n• Salary information\n• Interview tips\n• Career growth strategies\n• Company information\n• Profile optimization\n\nWhat can I help you with?",
      "💬 Great question! While I process that, here are some popular topics I can help with:\n\n🔍 Job Search & Recommendations\n💼 Career Development\n💰 Salary & Compensation\n🎤 Interview Preparation\n👥 Company Information\n\nLet me know what interests you most!",
      "🎯 I'd love to help! Here are a few ways I can assist:\n\n✓ Find jobs tailored to your skills\n✓ Provide career guidance\n✓ Help prepare for interviews\n✓ Share salary insights\n✓ Explain how JobIFY works\n\nWhat's on your mind?"
    ]
  },

  error: {
    templates: [
      "⚠️ I apologize, but I encountered an issue. Please try again or ask me something else. I'm here to help!",
      "😅 Oops! Something went wrong. Don't worry, this is temporary. Feel free to rephrase your question or explore other topics!",
      "🔧 I'm experiencing a temporary issue. Please try again in a moment. In the meantime, feel free to ask about other topics!"
    ]
  }
};

/**
 * Get a random response template for an intent
 */
export function getResponseTemplate(intent = 'generic') {
  const templates = responseTemplates[intent]?.templates || responseTemplates.generic.templates;
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Format jobs into a readable list for chat responses
 */
export function formatJobsList(jobs = [], maxJobs = 5) {
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return "No jobs found at the moment.";
  }

  const jobList = jobs.slice(0, maxJobs).map((job, idx) => {
    const title = job.title || 'Job Title';
    const company = job.companyName || 'Company';
    const location = job.location || 'Location TBD';
    const salary = job.salaryRange?.max
      ? `$${job.salaryRange.max.toLocaleString()}`
      : 'Competitive';

    return `${idx + 1}. **${title}** @ ${company}\n   📍 ${location} | 💰 ${salary}`;
  }).join('\n\n');

  return jobList;
}

/**
 * Format companies into a readable list
 */
export function formatCompaniesList(companies = [], maxCompanies = 5) {
  if (!Array.isArray(companies) || companies.length === 0) {
    return "No companies found.";
  }

  const companyList = companies.slice(0, maxCompanies).map((company, idx) => {
    const name = company.name || company.company?.name || 'Company Name';
    const industry = company.industry || company.company?.industry || 'Industry';
    return `${idx + 1}. **${name}** • ${industry}`;
  }).join('\n');

  return companyList;
}

/**
 * Format aggregated field (category) salary results into readable list
 * expected input: [{ _id: 'technology', avgMax: 120000, maxSalary: 150000, count: 10 }, ...]
 */
export function formatTopFields(fields = []) {
  if (!Array.isArray(fields) || fields.length === 0) return 'No field salary data available.';

  return fields.map((f, idx) => {
    const name = f._id || 'Other';
    const avg = typeof f.avgMax === 'number' ? Math.round(f.avgMax).toLocaleString() : 'N/A';
    const maxS = typeof f.maxSalary === 'number' ? Math.round(f.maxSalary).toLocaleString() : 'N/A';
    return `${idx + 1}. **${name}** — Avg top salary: ${avg} | Max listed: ${maxS} | Openings: ${f.count || 0}`;
  }).join('\n\n');
}

/**
 * Build salary statistics message
 */
export function formatSalaryStats(stats = {}) {
  if (!stats.avgSalary) return '';
  const currency = stats.currency || 'RWF';
  return `📊 **Salary Insights**: Average: ${currency} ${stats.avgSalary?.toLocaleString() || 'N/A'} | Max: ${currency} ${stats.maxSalary?.toLocaleString() || 'N/A'}`;
}

export default {
  responseTemplates,
  getResponseTemplate,
  formatJobsList,
  formatCompaniesList,
  formatSalaryStats
  ,formatTopFields
};
