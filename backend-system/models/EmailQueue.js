import mongoose from 'mongoose';

const emailQueueSchema = new mongoose.Schema({
  to: { type: String, required: true },
  from: { type: String, default: '' },
  subject: { type: String, default: '' },
  html: { type: String, default: '' },
  attempts: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'processing', 'sent', 'failed'], default: 'pending' },
  lastError: { type: String, default: '' },
  nextAttemptAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  lastAttemptAt: { type: Date }
});

export default mongoose.model('EmailQueue', emailQueueSchema);
