import request from 'supertest';
import express from 'express';
import handler, { cache } from '../../../pages/api/search/index';
import fetch from 'node-fetch';

jest.mock('node-fetch', () => jest.fn());

const app = express();
app.use(express.json());
app.get('/api/search', handler);

describe('GET /api/search', () => {
  beforeEach(() => {
    fetch.mockReset();
    cache.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return data from Spotify API', async () => {
    // Mock fetchAccessToken call
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'mock-access-token' }),
    });

    // Mock Spotify API call
    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ tracks: [] }),
    });

    const res = await request(app).get('/api/search').query({ query: 'test-query' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tracks: [] });
  });

  it('should handle rate limit', async () => {
    // Mock fetchAccessToken call
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'mock-access-token' }),
    });

    // Mock rate limit response
    fetch
      .mockResolvedValueOnce({
        status: 429,
        headers: {
          get: () => '1', // Retry-After 1 second
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ tracks: [] }),
      });

    const res = await request(app).get('/api/search').query({ query: 'test-query' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tracks: [] });
  });

  it('should handle fetch error', async () => {
    // Mock fetchAccessToken call
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'mock-access-token' }),
    });

    // Mock fetch error response
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const res = await request(app).get('/api/search').query({ query: 'test-query' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Failed to fetch data from Spotify');
  });

  it('should handle access token fetch error', async () => {
    // Mock access token fetch failure
    fetch.mockResolvedValueOnce({
      ok: false,
    });

    const res = await request(app).get('/api/search').query({ query: 'test-query' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch access token');
  });
});
