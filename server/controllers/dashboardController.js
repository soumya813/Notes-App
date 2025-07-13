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
      const notes = await Note.find({ user: req.user.id, archived: false })
      .sort({ updatedAt: -1 })
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();
  
      const count = await Note.countDocuments({ user: req.user.id, archived: false });
      const archivedCount = await Note.countDocuments({ user: req.user.id, archived: true });
  
      res.render('dashboard/index', {
        userName: req.user.firstName,
        locals,
        notes,
        layout: "../views/layouts/dashboard",
        current: page,
        pages: Math.ceil(count / perPage),
        archivedCount
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
        await Note.findOneAndUpdate(
            {_id: req.params.id},
            {title: req.body.title , body: req.body.body , updatedAt: Date.now() }
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
        if (!req.body.title || req.body.title.trim() === "") {
            return res.render('dashboard/add', {
                layout: '../views/layouts/dashboard',
                error: 'Title is required',
                formData: req.body
            });
        }
        req.body.user = req.user.id;
        await Note.create(req.body);
        res.redirect('/dashboard');
    } catch (error) {
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
 export-feature
 * GET
 * Export all notes

 */
exports.dashboardExport = async(req,res) => {
    try {
        // Fetch all notes for the current user, sorted by update date
        const notes = await Note.find({ user: req.user.id })
            .sort({ updatedAt: -1 })
            .lean();

        // Render the export view with all notes
        res.render('dashboard/export', {
            userName: req.user.firstName,
            notes,
            layout: '../views/layouts/dashboard'
        });
    } catch (error) {
        console.log(error);
        res.redirect('/dashboard');
    }
}

/**
 * GET
 * Export individual note
 
 */
exports.dashboardExportNote = async(req,res) => {
    try {
        // Find the specific note and ensure it belongs to the current user
        const note = await Note.findById({_id: req.params.id})
            .where({user: req.user.id})
            .lean();

        if(note){
            // Render the individual note export view
            res.render('dashboard/export-note', {
                userName: req.user.firstName,
                note,
                layout: '../views/layouts/dashboard'
            });
        } else{
            // Redirect if note not found or doesn't belong to user
            res.redirect('/dashboard');
        }
    } catch (error) {
        console.log(error);
        res.redirect('/dashboard');
    }
}


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

// Archive a note
exports.archiveNote = async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { archived: true, archivedAt: new Date() },
            { new: true }
        );
        if (!note) return res.status(404).send('Note not found');
        req.flash('success_msg', 'Note archived successfully.');
        res.redirect('/dashboard');
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Restore a note
exports.restoreNote = async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { archived: false, archivedAt: null },
            { new: true }
        );
        if (!note) return res.status(404).send('Note not found');
        req.flash('success_msg', 'Note restored successfully.');
        res.redirect('/dashboard/archived');
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Permanently delete a note
exports.deleteNotePermanently = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id, archived: true });
        if (!note) return res.status(404).send('Note not found or not archived');
        req.flash('success_msg', 'Note permanently deleted.');
        res.redirect('/dashboard/archived');
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// GET /dashboard/archived - Show archived notes
exports.dashboardArchivedNotes = async (req, res) => {
    try {
        const archivedNotes = await Note.find({ user: req.user.id, archived: true })
            .sort({ archivedAt: -1 })
            .lean();
        const archivedCount = archivedNotes.length;
        res.render('dashboard/archived', {
            userName: req.user.firstName,
            archivedNotes,
            layout: '../views/layouts/dashboard',
            archivedCount
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};

