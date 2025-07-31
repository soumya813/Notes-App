const noteService = require('../server/services/noteService');

describe('Note Service', () => {
  it('should export getUserNotes and countUserNotes functions', () => {
    expect(typeof noteService.getUserNotes).toBe('function');
    expect(typeof noteService.countUserNotes).toBe('function');
  });

  // Add more tests for business logic as needed
});
