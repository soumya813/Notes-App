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
        required: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);