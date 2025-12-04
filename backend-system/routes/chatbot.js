import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';
import huggingfaceService from '../utils/huggingfaceService.js'; // ✅ lowercase instance
import mongoose from 'mongoose';

const router = express.Router();

router.post('/message', async (req, res) => {
  try {
    const { message, userId } = req.body;
    console.log('📩 Incoming chatbot message:', message, 'UserId:', userId);

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
      console.warn('⚠️ Invalid userId format:', userId);
      return res.json({ message: "Invalid user ID format", type: "error" });
    }

    const recentJobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10).lean();
    const companies = await User.find({ userType: 'company', approvalStatus: 'approved' }).limit(5).lean();

    console.log('📊 Jobs fetched:', recentJobs.length, 'Companies fetched:', companies.length);

    const intentResult = await huggingfaceService.classifyIntent(message);
    console.log('🧠 Intent result:', intentResult);

    const intent = intentResult.intent || 'generic';

    if (intent === 'greeting') {
      return res.json({ message: "👋 Welcome to JobIFY! How can I help you today?", type: 'greeting', aiPowered: true });
    }

    if (intent === 'profile') {
      const userProfile = await User.findById(userId).lean();
      console.log('👤 User profile:', userProfile?.profile);

      if (userProfile?.profile?.skills?.length > 0) {
        const matchedJobs = await Job.find({
          status: 'active',
          skillsRequired: { $in: userProfile.profile.skills },
          experienceLevel: userProfile.profile.experienceLevel
        }).limit(5).lean();

        console.log('🎯 Matched jobs:', matchedJobs.length);
        return res.json({ message: "Jobs matching your profile:", jobs: matchedJobs, type: 'profile_matched_jobs', aiPowered: true });
      }
      return res.json({ message: "Please complete your profile with skills!", type: 'profile_needed' });
    }

    if (intent === 'best_salary') {
      const topJobs = await Job.find({ status: 'active' }).sort({ "salaryRange.max": -1 }).limit(5).lean();
      console.log('💰 Top salary jobs:', topJobs.length);
      return res.json({ message: "Top Paying Jobs:", jobs: topJobs, type: 'best_salary_jobs', aiPowered: true });
    }

    // ✅ Fallback AI
    const aiResponse = await huggingfaceService.generateResponse(message);
    return res.json({
      message: aiResponse,
      jobs: recentJobs.slice(0, 2),
      type: "generic",
      aiPowered: true
    });

  } catch (error) {
    console.error('❌ Chatbot route error:', error);
    res.json({ message: "⚠️ Something went wrong. Please try again.", type: 'error' });
  }
});

export default router;