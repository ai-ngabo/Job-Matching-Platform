import express from 'express';
import EmailQueue from '../models/EmailQueue.js';

const router = express.Router();

const ADMIN_HEALTH_TOKEN = process.env.ADMIN_HEALTH_TOKEN || '';

// Simple token protection
const protect = (req, res, next) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!ADMIN_HEALTH_TOKEN) return res.status(400).json({ message: 'ADMIN_HEALTH_TOKEN not configured' });
  if (!token || token !== ADMIN_HEALTH_TOKEN) return res.status(403).json({ message: 'Forbidden - invalid token' });
  next();
};

// GET /api/email-queue?status=pending&limit=50
router.get('/', protect, async (req, res) => {
  try {
    const { status = 'pending', limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;
    const items = await EmailQueue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await EmailQueue.countDocuments(filter);
    res.json({ ok: true, total, items });
  } catch (err) {
    console.error('❌ Email queue list error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/email-queue/:id/resend  -> sets nextAttemptAt = now and status pending
router.post('/:id/resend', protect, async (req, res) => {
  try {
    const id = req.params.id;
    const item = await EmailQueue.findByIdAndUpdate(id, { status: 'pending', nextAttemptAt: new Date(), attempts: 0 }, { new: true }).lean();
    if (!item) return res.status(404).json({ ok: false, message: 'Not found' });
    res.json({ ok: true, item });
  } catch (err) {
    console.error('❌ Email queue resend error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/email-queue/:id -> remove
router.delete('/:id', protect, async (req, res) => {
  try {
    const id = req.params.id;
    await EmailQueue.findByIdAndDelete(id);
    res.json({ ok: true, message: 'Deleted' });
  } catch (err) {
    console.error('❌ Email queue delete error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
