const request = require('supertest');
const express = require('express');
const tokenRouter = require('../../routes/tokenRouter');
const { setAccessToken } = require('../../auth');

const app = express();
app.use('/auth-api', tokenRouter);

describe('Token Router', () => {
  it('should return an access token', async () => {
    const accessToken = 'mock-access-token';
    setAccessToken(accessToken);

    const res = await request(app).get('/auth-api/token');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken', accessToken);
  });

  it('should return an error if no access token is available', async () => {
    setAccessToken(null);

    const res = await request(app).get('/auth-api/token');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error', 'No access token available');
  });
});
