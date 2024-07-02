import request from 'supertest';
import express from 'express';
import handler from '../../../../pages/api/users/[telegramId]/user-rooms';
import Room from '../../../../models/Room';
import { ensureUserExists } from '../../../../utils/database';

jest.mock('../../../../utils/database', () => ({
  ensureUserExists: jest.fn(),
}));

jest.mock('../../../../models/Room', () => ({
    find: jest.fn(),
  }));

const app = express();
app.use(express.json());
app.get('/api/users/:telegramId/user-rooms', (req, res) => {
    req.query.telegramId = req.params.telegramId;
    handler(req, res);
});

describe('GET /api/users/:telegramId/user-rooms', () => {
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
      expect(res.json).toHaveBeenCalledWith({ message: 'Telegram ID is required' });
  });

  it('should return user rooms', async () => {
    ensureUserExists.mockResolvedValueOnce({
      _id: '123',
      userRooms: ['1', '2'],
    });

    Room.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { _id: '1', name: 'Room 1' },
          { _id: '2', name: 'Room 2' },
        ]),
      });

    const res = await request(app).get('/api/users/123/user-rooms');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: '1', name: 'Room 1' },
      { id: '2', name: 'Room 2' },
    ]);
  });

  it('should handle internal server error', async () => {
    ensureUserExists.mockRejectedValueOnce(new Error('Database error'));

    const res = await request(app).get('/api/users/123/user-rooms');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});
