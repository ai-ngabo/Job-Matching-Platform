import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  // Job Information
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },

  // Applicant Information
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantName: {
    type: String,
    required: true
  },
  applicantEmail: {
    type: String,
    required: true
  },

  // Application Content
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
    default: ''
  },
  resume: {
    url: String,
    filename: String,
    uploadedAt: Date
  },

  // Application Status
  status: {
    type: String,
    enum: [
      'submitted',       // Application received
      'reviewing',       // Company is reviewing  
      'shortlisted',     // Made it to next round
      'interview',       // Interview scheduled
      'rejected',        // Application rejected
      'accepted'         // Job offered
    ],
    default: 'submitted'
  },

  // Status Timeline
  statusHistory: [{
    status: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: String,
    changedBy: {
      type: String,
      enum: ['applicant', 'company', 'system'],
      default: 'system'
    }
  }],

  // Company Feedback
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String,
    internalNotes: String, // Only visible to company
    respondedAt: Date
  },

  // Interview Details (if applicable)
  interview: {
    scheduledAt: Date,
    interviewType: {
      type: String,
      enum: ['phone', 'video', 'in-person', 'technical-test']
    },
    location: String,
    notes: String,
    completed: {
      type: Boolean,
      default: false
    }
  },

  // Metadata
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  viewedByCompany: {
    type: Boolean,
    default: false
  },
  viewedAt: Date
});

// Update timestamps
applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Add to status history when status changes
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: 'system'
    });
  }
  
  next();
});

// Indexes for performance
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1, appliedAt: -1 });
applicationSchema.index({ company: 1, status: 1 });
applicationSchema.index({ status: 1, appliedAt: -1 });

export default mongoose.model('Application', applicationSchema);