const dashboardController = require('../server/controllers/dashboardController');

describe('Dashboard Controller', () => {
  it('should export dashboard function', () => {
    expect(typeof dashboardController.dashboard).toBe('function');
  });

  // Add more tests for controller logic as needed
});
