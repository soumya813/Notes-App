/**
 * GET /
 *  Homepage
 */

exports.homepage = async(req,res) => {
    const locals = {
        title: "NotesApp",
        description: "Free Notes App",
    }
    res.render('index', {
        locals,
        layout: '../views/layouts/front-page'
    });
}

/**
 * GET /
 *  About
 */

exports.about = async(req,res) => {
    const locals = {
        title: "About NotesApp",
        description: "Free Notes App",
    }
    res.render('about',locals);
}