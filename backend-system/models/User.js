import mongoose from 'mongoose';
import bcrypt, { genSalt } from 'bcryptjs';

// Define the user Schema
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
        enum: ['jobseeker', 'employer', 'admin'],
        required: true
    },

    // Job Seeker's Profile
    profile: {
        firstName: { type: String, default: ''},
        lastName: { type: String, default: ''},
        phone: { type: String, default: ''},
        location: { type: String, default: 'Kigali, Rwanda'},
        bio: { type: String, default: ''},
        skills: { type: [String], default: []},
        education: { type: [String], default: []},
        documents: {
            cv: { type: Object, default: null },
            idDocument: {type: Object, default: null }
        }
    },

    // Company info for employers
    company: {
        name: { type: String, default: '' },
        description: { type: String, default: ''},
        website: { type: String, default: ''},
        industry: { type: String, default: ''}
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hashing the password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, genSalt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare the password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

// Export the model
const User = mongoose.model('User', userSchema);
export default User;