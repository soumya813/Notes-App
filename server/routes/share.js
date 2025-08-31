const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const { validateObjectId } = require('../middleware/validation');
const noteService = require('../services/noteService');
const { asyncHandler } = require('../utils/errors');
const { sendMail } = require('../utils/mailer');
const User = require('../models/User');

// Toggle collaboration on/off (owner only)
router.post('/dashboard/item/:id/collab/toggle', isLoggedIn, validateObjectId(), asyncHandler(async (req, res) => {
  const noteId = req.params.id;
  const enable = req.body.enable === 'true' || req.body.enable === true;
  await noteService.updateNote(noteId, req.user.id, { isCollabEnabled: enable });
  req.session.successMessage = enable ? 'Collaboration enabled.' : 'Collaboration disabled.';
  res.redirect(`/dashboard/item/${noteId}`);
}));

// Add collaborator by email (owner only)
router.post('/dashboard/item/:id/collab/add', isLoggedIn, validateObjectId(), asyncHandler(async (req, res) => {
  const noteId = req.params.id;
  const email = (req.body.email || '').trim();
  try {
    await noteService.addCollaboratorByEmail(noteId, req.user.id, email);
    // Compose email (best-effort)
    const owner = await User.findById(req.user.id).select('firstName email').lean();
    const subject = `${owner?.firstName || 'A user'} invited you to collaborate on a note`;
    const link = `${req.protocol}://${req.get('host')}/dashboard/item/${noteId}`;
    const html = `<p>You have been added as a collaborator to a note.</p><p><a href="${link}">Open the note</a></p>`;
    const result = await sendMail({ to: email, subject, html, text: `Open the note: ${link}` });
    req.session.successMessage = result.sent
      ? `Added collaborator and sent an invite to ${email}.`
      : `Added collaborator: ${email}. (Email not sent: ${result.reason})`;
  } catch (e) {
    req.session.errorMessage = e.message || 'Failed to add collaborator';
  }
  res.redirect(`/dashboard/item/${noteId}`);
}));

// Remove collaborator (owner only)
router.post('/dashboard/item/:id/collab/remove', isLoggedIn, validateObjectId(), asyncHandler(async (req, res) => {
  const noteId = req.params.id;
  const collaboratorId = req.body.userId;
  try {
    await noteService.removeCollaborator(noteId, req.user.id, collaboratorId);
    req.session.successMessage = 'Removed collaborator.';
  } catch (e) {
    req.session.errorMessage = e.message || 'Failed to remove collaborator';
  }
  res.redirect(`/dashboard/item/${noteId}`);
}));

module.exports = router;
