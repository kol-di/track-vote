import request from 'supertest';
import express from 'express';
import handler from '../../../../pages/api/users/[telegramId]/create';
import { ensureUserExists } from '../../../../utils/database';

jest.mock('../../../../utils/database', () => ({
  ensureUserExists: jest.fn(),
}));

const app = express();
app.use(express.json());
app.post('/api/users/:telegramId/create', (req, res) => {
    req.query.telegramId = req.params.telegramId;
    handler(req, res);
});

describe('POST /api/users/:telegramId/create', () => {
  it('should return 400 if telegramId is missing', async () => {
    const req = {
      method: 'POST',
      query: {},
      headers: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Telegram ID is required' });
  });

  it('should create or find existing user', async () => {
    ensureUserExists.mockResolvedValueOnce({ _id: '123' });

    const res = await request(app).post('/api/users/123/create');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'success',
      message: 'User created or already exists',
      userId: '123',
    });
  });

  it('should handle internal server error', async () => {
    ensureUserExists.mockRejectedValueOnce(new Error('Database error'));

    const res = await request(app).post('/api/users/123/create');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});
