import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  requirements: {
    type: [String],
    required: [true, 'Job requirements are required'],
    validate: {
      validator: function(requirements) {
        return requirements.length > 0;
      },
      message: 'At least one requirement is needed'
    }
  },
  skillsRequired: {
    type: [String],
    default: [],
    index: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'executive'],
    default: 'mid'
  },
  educationLevel: {
    type: String,
    enum: ['high-school', 'diploma', 'bachelors', 'masters', 'phd'],
    default: 'bachelors'
  },
  location: {
    type: String,
    required: [true, 'Job location is required'],
    default: 'Kigali, Rwanda'
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
    required: [true, 'Job type is required'],
    default: 'full-time'
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    enum: [
      'technology', 'business', 'healthcare', 'education', 'engineering',
      'design', 'marketing', 'sales', 'customer-service', 'other'
    ]
  },
  salaryRange: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'RWF'
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  
  // Company Information
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  
  // Application Details
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  applicationProcess: {
    type: String,
    enum: ['quick-apply', 'external-link', 'email'],
    default: 'quick-apply'
  },
  externalLink: {
    type: String,
    default: ''
  },
  applicationEmail: {
    type: String,
    default: ''
  },
  
  // Job Status
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'draft'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: true // Changed to true since we're skipping admin approval
  },
  
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date,
    default: Date.now // Auto-publish since no approval needed
  }
});

// Update the updatedAt field before saving
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-set publishedAt when job is created and active
  if (this.isNew && this.status === 'active') {
    this.publishedAt = new Date();
  }
  
  next();
});

// Index for better search performance
jobSchema.index({ title: 'text', description: 'text', 'requirements': 'text' });
jobSchema.index({ category: 1, jobType: 1, location: 1 });
jobSchema.index({ company: 1, status: 1 });
jobSchema.index({ 'skillsRequired': 1, 'experienceLevel': 1, 'category': 1 });

export default mongoose.model('Job', jobSchema);