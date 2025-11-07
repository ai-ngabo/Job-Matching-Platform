import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    enum: ['jobseeker', 'company', 'admin'],
    required: true
  },

  // JOB SEEKER PROFILE
  profile: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: 'Kigali, Rwanda' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [], index: true },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'executive'],
      default: 'entry'
    },
    educationLevel: {
      type: String,
      enum: ['high-school', 'diploma', 'bachelors', 'masters', 'phd'],
      default: 'high-school'
    },
    preferences: {
      jobTypes: {
        type: [String],
        enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
        default: ['full-time']
      },
      locations: {
        type: [String],
        default: ['Kigali, Rwanda']
      },
      minSalary: {
        type: Number,
        default: 0
      },
      categories: {
        type: [String],
        enum: [
          'technology', 'business', 'healthcare', 'education', 'engineering',
          'design', 'marketing', 'sales', 'customer-service', 'other'
        ],
        default: []
      }
    },
    documents: {
      cv: { type: Object, default: null },
      idDocument: { type: Object, default: null }
    }
  },

  // ENHANCED COMPANY PROFILE
  company: {
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
    industry: { type: String, default: '' },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
      default: '1-10'
    },
    founded: { type: Number, default: null },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: 'Kigali' },
      district: { type: String, default: '' },
      province: { type: String, default: 'Kigali City' }
    },
    contact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      personName: { type: String, default: '' },
      personPosition: { type: String, default: '' }
    },
    businessRegistration: {
      registrationNumber: { type: String, default: '' },
      tinNumber: { type: String, default: '' },
      certificate: {
        filename: { type: String, default: '' },
        url: { type: String, default: '' },
        uploadedAt: { type: Date, default: null }
      },
      isVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date, default: null }
    },
    socialMedia: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' }
    }
  },

  // APPROVAL SYSTEM
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectionReason: {
    type: String,
    default: ''
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// MIDDLEWARE: Auto-approve job seekers, keep companies pending
userSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (this.userType === 'jobseeker') {
      this.approvalStatus = 'approved';
      this.approvedAt = new Date();
    }
  }

  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

export default mongoose.model('User', userSchema);