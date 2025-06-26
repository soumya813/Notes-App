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
            title: { $substr: ["$title", 0, 30] },
            body: { $substr: ["$body", 0, 100] },
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
 * GET
 * Export all notes
 * EXPORT FEATURE: Handles bulk export of all notes for the current user
 * - Fetches all notes belonging to the logged-in user
 * - Sorts them by most recently updated (newest first)
 * - Renders the export view with all notes displayed
 * - Includes print/PDF functionality for easy sharing and backup
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
 * EXPORT FEATURE: Handles export of a single note by its ID
 * - Validates that the note belongs to the current user (security)
 * - Fetches the complete note data (not truncated like dashboard)
 * - Renders a focused view for single note export
 * - Includes print/PDF functionality for individual note sharing
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