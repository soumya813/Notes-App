const Note = require('../models/Notes');
const mongoose = require('mongoose');

/**
 * GET /
 *  dashboard
 */

exports.dashboard = async (req, res) => {

    let perPage = 12;
    let page = req.query.page || 1;
  
    const locals = {
      title: "Dashboard",
      description: "Free NodeJS Notes App.",
    };
  
    try {
      // Mongoose "^7.0.0 Update
      const notes = await Note.aggregate([
        { $sort: { updatedAt: -1 } },
        { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
        {
          $project: {
            _id: 1,
            title: { $substr: ["$title", 0, 30] },
            body: { $substr: ["$body", 0, 100] },
            images: 1
          },
        },
      ])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();
  
      const count = await Note.countDocuments();
  
      res.render('dashboard/index', {
        userName: req.user.firstName,
        locals,
        notes,
        layout: "../views/layouts/dashboard",
        current: page,
        pages: Math.ceil(count / perPage)
      });
     } catch (error) {
      console.log(error);
    }
  };



/**
 * GET/
 * View Specific Note 
 */

exports.dashboardViewNote = async(req,res) => {
    const note = await Note.findById({_id: req.params.id})
    .where({user: req.user.id}).lean();

    if(note){
        res.render('dashboard/view-notes',{
            noteID: req.params.id,
            note,
            layout: '../views/layouts/dashboard'
        });
    } else{
        res.send("something went wrong")
    }
}

/**
 * PUT/
 * Update Specific Note 
 */

exports.dashboardUpdateNote = async(req,res) => {
    try {
        let images = [];
        if (req.body.imageUrls) {
            try {
                images = JSON.parse(req.body.imageUrls);
            } catch (e) { images = []; }
        }
        await Note.findOneAndUpdate(
            {_id: req.params.id},
            {
                title: req.body.title,
                body: req.body.body,
                images: images,
                updatedAt: Date.now()
            }
        ).where({ user: req.user.id });
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }
}


/**
 * PUT/
 * Delete Note 
 */

exports.dashboardDeleteNote = async(req,res) => {
    try {
        await Note.deleteOne(
            {_id: req.params.id},
            ).where({ user: req.user.id });
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
    }
}


/**
 * GET
 * Add notes
 */

exports.dashboardAddNote = async(req,res) => {
    res.render('dashboard/add', {
        layout: '../views/layouts/dashboard'
    });
}


/**
 * POST
 * Add Notes
 */

exports.dashboardAddNote = async(req,res) => {
    try {
        console.log('Received body:', req.body);
        if (!req.body.title || req.body.title.trim() === "") {
            return res.render('dashboard/add', {
                layout: '../views/layouts/dashboard',
                error: 'Title is required',
                formData: req.body
            });
        }
        req.body.user = req.user.id;
        let images = [];
        if (req.body.imageUrls) {
            try {
                images = JSON.parse(req.body.imageUrls);
            } catch (e) { images = []; }
        }
        await Note.create({
            user: req.body.user,
            title: req.body.title,
            body: req.body.body,
            images: images
        });
        res.redirect('/dashboard');
    } catch (error) {
        console.log('Error saving note:', error);
        let errorMsg = 'An error occurred while adding the note.';
        if (error.name === 'ValidationError') {
            errorMsg = error.message;
        }
        res.render('dashboard/add', {
            layout: '../views/layouts/dashboard',
            error: errorMsg,
            formData: req.body
        });
    }
}


/**
 * GET
 * Search
 */

exports.dashboardSearch = async(req,res) => {
    try{
        res.render('dashboard/search', {
            searchResults: '',
            layout: '../views/layouts/dashboard'
        })
    } catch(error){

    }
}


/**
 * POST
 * search for notes
 */

exports.dashboardSearchSubmit = async(req,res) => {
    try{
        let searchTerm = req.body.searchTerm;
        const searchNoSpecialChars = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

        const searchResults = await Note.find({
            $or: [
                {title: {$regex: new RegExp(searchNoSpecialChars, 'i') }},
                {body: {$regex: new RegExp(searchNoSpecialChars, 'i') }}
            ]
        }).where({user:req.user.id});
        res.render('dashboard/search', {
            searchResults,
            layout: '../views/layouts/dashboard'
        })


    }catch(error){
        console.log(error);
    }
}

/**
 * POST
 * for summarize notes using Hugging Face API
 */

const axios = require('axios');

exports.dashboardSummarizeNote = async (req, res) => {
  try {
    const textToSummarize = req.body.text;

    // Call Hugging Face API or your summarization logic
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      { inputs: textToSummarize },
      {
        headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API}` }
      }
    );

    const summary = response.data?.[0]?.summary_text || "No summary returned.";

    res.json({ summary });
  } catch (error) {
    console.error('Summarize Error:', error.message);
    res.status(500).json({ summary: "Failed to generate summary." });
  }
};
