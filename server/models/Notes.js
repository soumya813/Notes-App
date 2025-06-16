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
    folder: {
        type: String,
        default: 'Uncategorized', 
    },
    color: {
        type: String,
        default: '#ffffff', 
    },
    body:{
        type:String,
        required:true,
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