const mongoose = require('mongoose');

const schema = mongoose.Schema;
const NoteSchema = new schema({
    user:{
        type: schema.ObjectId,
        ref: 'User',
        required: [true, 'Note must belong to a user'],
        index: true
    },
    collaborators: [{
        type: schema.ObjectId,
        ref: 'User',
        index: true,
        default: []
    }],
    isCollabEnabled: {
        type: Boolean,
        default: false
    },
    title:{
        type: String, 
        required: [true, 'Title is required'],
        trim: true,
        minlength: [1, 'Title must be at least 1 character long'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    body:{
        type: String,
        required: [true, 'Note content is required'],
        trim: true,
        minlength: [1, 'Note content must be at least 1 character long'],
        maxlength: [50000, 'Note content cannot exceed 50,000 characters']
    },
    summary: {
        type: String,
        default: '',
        maxlength: [5000, 'Summary cannot exceed 5,000 characters']
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [50, 'Tag cannot exceed 50 characters']
    }],
    isArchived: {
        type: Boolean,
        default: false
    },
    createdAt:{
        type: Date,
        default: Date.now,
        immutable: true
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
});

// Compound index for user and createdAt for efficient queries
NoteSchema.index({ user: 1, createdAt: -1 });
NoteSchema.index({ user: 1, updatedAt: -1 });
NoteSchema.index({ user: 1, title: 'text', body: 'text' });
// Index to query by collaborator
NoteSchema.index({ collaborators: 1, updatedAt: -1 });

// Update the updatedAt field before saving
NoteSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.updatedAt = Date.now();
    }
    next();
});

// Update the updatedAt field for findOneAndUpdate operations
NoteSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Virtual for note excerpt
NoteSchema.virtual('excerpt').get(function() {
    return this.body.substring(0, 100) + (this.body.length > 100 ? '...' : '');
});

// Virtual for word count
NoteSchema.virtual('wordCount').get(function() {
    return this.body.split(/\s+/).filter(word => word.length > 0).length;
});

// Ensure virtuals are included in JSON output
NoteSchema.set('toJSON', { virtuals: true });
NoteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Note', NoteSchema);