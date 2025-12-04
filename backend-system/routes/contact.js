import express from 'express';
import { sendContactMessage } from '../utils/emailService.js';

const router = express.Router();

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, contact, message } = req.body;
    await sendContactMessage({ firstName, lastName, fromEmail: email, contactPhone: contact, message });
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact endpoint error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

export default router;
