// public/js/ai-summary.js

document.addEventListener('DOMContentLoaded', function() {
  const summarizeButton = document.getElementById('summarizeButton');
  if (summarizeButton) {
    summarizeButton.addEventListener('click', summarizeNote);
  }
});

// Move summarizeNote function here if you want to fully decouple from inline, or keep it in EJS if it uses EJS variables.
// If you want to move it, copy the function from view-notes.ejs and replace <%= noteID %> with a data attribute or window.NOTE_ID.
