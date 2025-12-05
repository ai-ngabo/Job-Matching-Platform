import express from 'express';
import { verifyEmailTransport } from '../utils/emailService.js';

const router = express.Router();

// Protect this route with a simple token header to avoid exposing it publicly
const ADMIN_HEALTH_TOKEN = process.env.ADMIN_HEALTH_TOKEN || '';

router.get('/', async (req, res) => {
  try {
    const token = req.headers['x-admin-token'] || req.query.token;
    if (!ADMIN_HEALTH_TOKEN) {
      return res.status(400).json({ message: 'ADMIN_HEALTH_TOKEN not configured on server' });
    }
    if (!token || token !== ADMIN_HEALTH_TOKEN) {
      return res.status(403).json({ message: 'Forbidden - invalid token' });
    }

    const to = req.query.to; // optional override recipient
    const result = await verifyEmailTransport({ to });
    res.json({ ok: result.ok, transport: result.transport, detail: result.detail || result.error });
  } catch (err) {
    console.error('❌ Email health check error:', err);
    res.status(500).json({ message: 'Email health check failed', error: err.message });
  }
});

export default router;
