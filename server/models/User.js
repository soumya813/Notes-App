const mongoose = require('mongoose');

const schema = mongoose.Schema;
const UserSchema = new schema({
    googleId: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true,
        default: 'Unknown'
    },
    profileImage: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return v != null && v.length > 0;
            },
            message: 'Email is required and cannot be null or empty'
        }
    },
    profilePicture: {
        type: String,
        default: '/img/default-profile.png'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('User', UserSchema);