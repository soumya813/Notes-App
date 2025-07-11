const mongoose = require('mongoose');

const schema = mongoose.Schema;
const NoteSchema = new schema({
    user:{
    type: schema.ObjectId,
    ref: 'User'
    },
    title:{
        type: String, 
        required: true,
    },
    body:{
        type:String,
        required:true,
    },
    summary: {
        type: String,
        default: '',
    },
    archived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date
    },
    createdAt:{
        type:Date,
        default: Date.now()
    },
    updatedAt:{
        type:Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Note',NoteSchema);