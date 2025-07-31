const mainController = require('../server/controllers/mainController');

describe('Main Controller', () => {
  it('should export homepage function', () => {
    expect(typeof mainController.homepage).toBe('function');
  });

  // Add more tests for controller logic as needed
});
