import request from 'supertest';
import express from 'express';
import handler from '../../../pages/api/users/[telegramId]';
import User from '../../../models/User';

const app = express();
app.use(express.json());
app.get('/api/users/:telegramId', (req, res) => {
    req.query.telegramId = req.params.telegramId;
    handler(req, res);
});

jest.mock('../../../models/User', () => ({
    findOne: jest.fn()
}));

describe('GET /api/users/:telegramId', () => {
  it('should return 400 if telegramId is missing', async () => {
    const req = {
      method: 'GET',
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
    expect(res.json).toHaveBeenCalledWith({ exists: false, message: 'Telegram ID is required' });
  });

  it('should return user existence status', async () => {
    User.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: '123' }),
    });

    const res = await request(app).get('/api/users/123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: true });
  });

  
  it('should return user non-existence status', async () => {
    User.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).get('/api/users/123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: false });
  });

  it('should handle internal server error', async () => {
    User.findOne.mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error('Database error')),
    });

    const res = await request(app).get('/api/users/123');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});
