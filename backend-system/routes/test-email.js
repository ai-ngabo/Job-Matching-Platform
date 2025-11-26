import express from 'express';
import { sendApplicationStatusEmail, sendCompanyApprovalEmail, sendCompanyRejectionEmail } from '../utils/emailService.js';

const router = express.Router();

// @route   POST /api/test-email/application-status
// @desc    Test application status email
// @access  Public (for testing only - remove in production)
router.post('/application-status', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: 'Email address is required for testing'
      });
    }

    console.log('🧪 Testing application status email to:', email);

    await sendApplicationStatusEmail({
      email: email,
      candidateName: 'Test Candidate',
      companyName: 'Test Company',
      jobTitle: 'Test Job Position',
      newStatus: 'shortlisted',
      note: 'This is a test email to verify email automation is working.'
    });

    res.json({
      message: 'Test email sent successfully!',
      recipient: email,
      type: 'application-status'
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// @route   POST /api/test-email/company-approval
// @desc    Test company approval email
// @access  Public (for testing only - remove in production)
router.post('/company-approval', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: 'Email address is required for testing'
      });
    }

    console.log('🧪 Testing company approval email to:', email);

    await sendCompanyApprovalEmail({
      email: email,
      companyName: 'Test Company',
      contactPerson: 'Test Contact'
    });

    res.json({
      message: 'Test email sent successfully!',
      recipient: email,
      type: 'company-approval'
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// @route   POST /api/test-email/company-rejection
// @desc    Test company rejection email
// @access  Public (for testing only - remove in production)
router.post('/company-rejection', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: 'Email address is required for testing'
      });
    }

    console.log('🧪 Testing company rejection email to:', email);

    await sendCompanyRejectionEmail({
      email: email,
      companyName: 'Test Company',
      contactPerson: 'Test Contact',
      reason: 'This is a test rejection email to verify email automation is working.'
    });

    res.json({
      message: 'Test email sent successfully!',
      recipient: email,
      type: 'company-rejection'
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

export default router;

