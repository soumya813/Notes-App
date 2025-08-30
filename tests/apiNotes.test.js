const request = require('supertest');
const express = require('express');
const app = require('../app');

describe('API /api/v1/notes', () => {
  it('should require authentication for GET /api/v1/notes', async () => {
    const res = await request(app)
      .get('/api/v1/notes')
      .set('Accept', 'application/json'); // This ensures API response
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Authentication required');
  });

  // Add more endpoint tests as needed
});
