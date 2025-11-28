import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

// Ensure bcrypt is available
const bcrypt = bcryptjs;

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
  
  profile: {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: 'Kigali, Rwanda' },
    bio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },
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
    documents: {
      cv: {
        filename: { type: String, default: '' },
        url: { type: String, default: '' },
        publicId: { type: String, default: '' },
        uploadedAt: { type: Date, default: null },
        fileSize: { type: Number, default: 0 },
        format: { type: String, default: '' }
      },
      idDocument: {
        filename: { type: String, default: '' },
        url: { type: String, default: '' },
        publicId: { type: String, default: '' },
        uploadedAt: { type: Date, default: null },
        fileSize: { type: Number, default: 0 },
        format: { type: String, default: '' },
        idType: { type: String, default: 'national_id' }
      }
    }
  },
  
  company: {
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
    industry: { type: String, default: '' },
    logo: { type: String, default: '' },
    logoPublicId: { type: String, default: '' },
    contact: {
      phone: { type: String, default: '' },
      personName: { type: String, default: '' },
      personPosition: { type: String, default: '' },
      email: { type: String, default: '' }
    },
    businessRegistration: {
      registrationNumber: { type: String, default: '' },
      certificate: {
        filename: { type: String, default: '' },
        url: { type: String, default: '' },
        publicId: { type: String, default: '' },
        uploadedAt: { type: Date, default: null },
        fileSize: { type: Number, default: 0 },
        format: { type: String, default: '' }
      }
    }
  },
  
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: { 
    type: String, 
    default: '' 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isNew && this.userType === 'jobseeker') {
    this.approvalStatus = 'approved';
  }
  
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);