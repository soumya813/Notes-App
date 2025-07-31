// Note service for business logic
const Note = require('../models/Notes');
const mongoose = require('mongoose');

const getUserNotes = async (userId, perPage, page) => {
  return await Note.aggregate([
    { $sort: { updatedAt: -1 } },
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $project: {
        title: { $substr: ["$title", 0, 30] },
        body: { $substr: ["$body", 0, 100] },
      },
    },
  ])
    .skip(perPage * page - perPage)
    .limit(perPage)
    .exec();
};

const countUserNotes = async (userId) => {
  return await Note.countDocuments({ user: userId });
};

module.exports = {
  getUserNotes,
  countUserNotes,
};
