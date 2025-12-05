// Load environment variables FIRST before any other imports
// v3: Fixed bcryptjs import compatibility
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import chatbotRoutes from './routes/chatbot.js';
import aiRoutes from './routes/ai.js';
import testEmailRoutes from './routes/test-email.js';
import contactRoutes from './routes/contact.js';
import { initializeEmailServiceOnStartup } from './utils/emailService.js';

const app = express();

// CORS Configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:4173',
      'https://jobify-rw.vercel.app',                            // Custom Vercel domain
      'https://job-matching-platform.vercel.app',                // Vercel main domain
      'https://jobify.vercel.app',                               // Alternative Vercel domain
      process.env.FRONTEND_URL                                   // Environment variable
    ].filter(url => url && url.length > 0);
    
    console.log('🔒 CORS - Incoming origin:', origin);
    console.log('🔒 CORS - Allowed origins:', allowedOrigins);
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all vercel.app domains (for preview deployments)
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow all localhost variants
    if (origin.includes('localhost')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    message: 'JobIFY Backend is running!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/test-email', testEmailRoutes);
app.use('/api/contact', contactRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-platform-rwanda')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.log('❌ MongoDB connection error:', err);
  });

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  
  // Initialize email service on startup to verify configuration
  initializeEmailServiceOnStartup();
});