const mongoose = require('mongoose');

const schema = mongoose.Schema;
const UserSchema = new schema({
    googleId: {
        type: String,
        required: [true, 'Google ID is required'],
        unique: true,
        index: true
    },
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true,
        minlength: [1, 'Display name must be at least 1 character'],
        maxlength: [100, 'Display name cannot exceed 100 characters']
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [1, 'First name must be at least 1 character'],
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        default: 'Unknown',
        minlength: [1, 'Last name must be at least 1 character'],
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    profileImage: {
        type: String,
        required: [true, 'Profile image is required'],
        default: '/img/default-profile.png',
        validate: {
            validator: function(v) {
                // Allow URLs and local paths
                return /^(https?:\/\/|\/img\/)/.test(v);
            },
            message: 'Profile image must be a valid URL or local path'
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please provide a valid email address'
        }
    },
    profilePicture: {
        type: String,
        default: '/img/default-profile.png',
        validate: {
            validator: function(v) {
                // Allow URLs and local paths
                return /^(https?:\/\/|\/img\/)/.test(v);
            },
            message: 'Profile picture must be a valid URL or local path'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Update the updatedAt field for findOneAndUpdate operations
UserSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Method to update last login
UserSchema.methods.updateLastLogin = function() {
    this.lastLoginAt = Date.now();
    return this.save();
};

// Ensure virtuals are included in JSON output
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);