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
    const notes = await Note.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean();

    const count = await Note.countDocuments({ user: req.user.id });

    res.render('dashboard/index', {
      userName: req.user.firstName,
      locals,
      notes,
      layout: "../views/layouts/dashboard",
      current: page,
      pages: Math.ceil(count / perPage),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
};


/**
 * GET/
 * View Specific Note 
 */

exports.dashboardViewNote = async (req, res) => {
  try {
    const noteId = req.params.id.trim(); // Remove any leading/trailing spaces

    // Validate if noteId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).send("Invalid note ID");
    }

    const note = await Note.findById(noteId)
      .where({ user: req.user.id })
      .lean();

    if (note) {
      res.render('dashboard/view-notes', {
        noteID: noteId,
        note,
        layout: '../views/layouts/dashboard',
      });
    } else {
      res.status(404).send("Note not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Something went wrong");
  }
};

/**
 * PUT/
 * Update Specific Note 
 */

exports.dashboardUpdateNote = async (req, res) => {
  try {
    const { title, body, folder, color } = req.body;
    await Note.findOneAndUpdate(
      { _id: req.params.id },
      {
        title,
        body,
        folder: folder || 'Uncategorized', 
        color: color || '#ffffff', 
        updatedAt: Date.now(),
      }
    ).where({ user: req.user.id });
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
};


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

exports.dashboardAddNote = async (req, res) => {
  try {
    if (!req.body.title || req.body.title.trim() === "") {
      return res.render('dashboard/add', {
        layout: '../views/layouts/dashboard',
        error: 'Title is required',
        formData: req.body,
      });
    }

    const { title, body, folder, color } = req.body;
    const newNote = {
      title,
      body,
      folder: folder || 'Uncategorized', 
      color: color || '#ffffff', 
      user: req.user.id,
    };

    await Note.create(newNote);
    res.redirect('/dashboard');
  } catch (error) {
    let errorMsg = 'An error occurred while adding the note.';
    if (error.name === 'ValidationError') {
      errorMsg = error.message;
    }
    res.render('dashboard/add', {
      layout: '../views/layouts/dashboard',
      error: errorMsg,
      formData: req.body,
    });
  }
};


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
        }).where({yser:req.user.id});
        res.render('dashboard/search', {
            searchResults,
            layout: '../views/layouts/dashboard'
        })


    }catch(error){
        console.log(error);
    }
}