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
        required: true
    },
    profileImage: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model('User', UserSchema);