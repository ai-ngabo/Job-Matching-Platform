import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import huggingfaceService from '../utils/huggingfaceService.js';
import {
  classifyIntentKeyword,
  classifyIntentWithLLM,
  safeParseJSON
} from '../utils/chatbotIntentClassifier.js';
import {
  getResponseTemplate,
  formatJobsList,
  formatCompaniesList,
  formatSalaryStats
  ,formatTopFields
} from '../utils/chatbotResponseTemplates.js';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { message, userId, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.json({
        message: getResponseTemplate('help'),
        type: 'help',
        success: false
      });
    }

    console.log('📩 Chatbot message:', message.substring(0, 50) + '...', 'UserId:', userId);

    // Validate userId if provided
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      console.warn('⚠️ Invalid userId format:', userId);
      return res.json({
        message: getResponseTemplate('error'),
        type: 'error',
        success: false
      });
    }

    // Fetch context data
    const recentJobs = await Job.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean()
      .catch(err => {
        console.warn('Error fetching jobs:', err);
        return [];
      });

    const companies = await User.find({ userType: 'company', approvalStatus: 'approved' })
      .select('company')
      .limit(10)
      .lean()
      .catch(err => {
        console.warn('Error fetching companies:', err);
        return [];
      });

    console.log('📊 Context: ', recentJobs.length, 'jobs,', companies.length, 'companies');

    // Classify intent (keyword-based with LLM fallback)
    let intent = 'generic';
    let confidence = 0.5;

    try {
      const classified = classifyIntentKeyword(message);
      intent = classified.intent;
      confidence = classified.confidence;
      console.log('🧠 Intent:', intent, 'Confidence:', confidence);
    } catch (err) {
      console.error('Intent classification error:', err);
      intent = 'generic';
    }

    // Build response based on intent
    let responseMessage = '';
    let responseType = intent;
    let jobs = [];
    let companiesList = [];

    try {
      switch (intent) {
        case 'greeting':
          responseMessage = getResponseTemplate('greeting');
          break;

        case 'job_search':
          jobs = recentJobs.slice(0, 5);
          responseMessage = getResponseTemplate('job_search').replace(
            '{jobs}',
            formatJobsList(jobs, 5)
          );
          break;

        case 'best_salary':
          const topSalaryJobs = recentJobs
            .sort((a, b) => (b.salaryRange?.max || 0) - (a.salaryRange?.max || 0))
            .slice(0, 5);
          jobs = topSalaryJobs;
          responseMessage = getResponseTemplate('best_salary').replace(
            '{topJobs}',
            formatJobsList(topSalaryJobs, 5)
          );
          break;

        case 'salary_info':
          const salaryJobs = recentJobs
            .filter(j => j.salaryRange && (j.salaryRange.max || j.salaryRange.min))
            .sort((a, b) => (b.salaryRange?.max || 0) - (a.salaryRange?.max || 0))
            .slice(0, 5);

          const salaries = salaryJobs
            .map(j => j.salaryRange?.max || j.salaryRange?.min)
            .filter(v => typeof v === 'number');

          const stats = {
            maxSalary: salaries.length ? Math.max(...salaries) : null,
            minSalary: salaries.length ? Math.min(...salaries) : null,
            avgSalary: salaries.length
              ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
              : null,
            currency: salaryJobs[0]?.salaryRange?.currency || 'RWF'
          };

          jobs = salaryJobs;
          responseMessage = getResponseTemplate('salary_info')
            .replace('{topJobs}', formatJobsList(salaryJobs, 5))
            .replace('{stats}', formatSalaryStats(stats));
          break;

        case 'remote_work':
          const remoteJobs = recentJobs
            .filter(
              j =>
                (j.jobType && j.jobType.toLowerCase().includes('remote')) ||
                (j.location && j.location.toLowerCase().includes('remote'))
            )
            .slice(0, 5);

          jobs = remoteJobs.length > 0 ? remoteJobs : recentJobs.slice(0, 5);
          responseMessage = getResponseTemplate('remote_work').replace(
            '{jobs}',
            formatJobsList(jobs, 5)
          );
          break;

        case 'companies':
          companiesList = companies.slice(0, 5);
          responseMessage = getResponseTemplate('companies').replace(
            '{companies}',
            formatCompaniesList(companiesList, 5)
          );
          break;

        case 'most_paying_field': {
          // Aggregate by category to find fields with highest average top salaries
          const agg = await Job.aggregate([
            { $match: { status: 'active', 'salaryRange.max': { $gt: 0 } } },
            { $group: { _id: '$category', avgMax: { $avg: '$salaryRange.max' }, maxSalary: { $max: '$salaryRange.max' }, count: { $sum: 1 } } },
            { $sort: { avgMax: -1 } },
            { $limit: 5 }
          ]).catch(err => {
            console.warn('Aggregation error for most_paying_field:', err);
            return [];
          });

          let exampleJobsText = 'No example jobs available.';
          if (agg && agg.length > 0) {
            const topCategory = agg[0]._id;
            const topJobsInCategory = await Job.find({ category: topCategory, status: 'active' })
              .sort({ 'salaryRange.max': -1 })
              .limit(3)
              .lean()
              .catch(() => []);

            exampleJobsText = formatJobsList(topJobsInCategory, 3);
          }

          responseMessage = getResponseTemplate('most_paying_field')
            .replace('{fields}', formatTopFields(agg))
            .replace('{exampleJobs}', exampleJobsText);
          jobs = [];
          break;
        }

        case 'career_guidance':
          responseMessage = getResponseTemplate('career_guidance');
          break;

        case 'interview_prep':
          responseMessage = getResponseTemplate('interview_prep');
          break;

        case 'profile_completion':
          responseMessage = getResponseTemplate('profile_completion');
          break;

        case 'how_to_get_job':
          responseMessage = getResponseTemplate('how_to_get_job');
          break;

        case 'about_platform':
          companiesList = companies.slice(0, 3);
          jobs = recentJobs.slice(0, 3);
          responseMessage = getResponseTemplate('about_platform');
          break;

        case 'help':
          responseMessage = getResponseTemplate('help');
          break;

        default:
          responseMessage = getResponseTemplate('generic');
          responseType = 'generic';
      }
    } catch (err) {
      console.error('Response building error:', err);
      responseMessage = getResponseTemplate('error');
      responseType = 'error';
    }

    return res.json({
      message: responseMessage,
      type: responseType,
      jobs: jobs.length > 0 ? jobs : undefined,
      companies: companiesList.length > 0 ? companiesList : undefined,
      confidence,
      aiPowered: true,
      success: true
    });
  } catch (error) {
    console.error('❌ Chatbot route error:', error);
    return res.json({
      message: getResponseTemplate('error'),
      type: 'error',
      success: false
    });
  }
});


export default router;