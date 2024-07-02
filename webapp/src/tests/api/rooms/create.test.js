import request from 'supertest';
import express from 'express';
import handler from '../../../pages/api/rooms/create';
import User from '../../../models/User';
import { ensureUserExists } from '../../../utils/database';

jest.mock('../../../utils/database', () => ({
  ensureUserExists: jest.fn()
}));

const app = express();
app.use(express.json());
app.post('/api/rooms/create', handler);

describe('POST /api/rooms/create', () => {
  it('should create a room', async () => {
    const mockUser = new User({ _id: '60f6c45d9d1a9b3a4c8b1234', telegramId: '123456' });
    ensureUserExists.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/rooms/create')
      .send({ name: 'Test Room', telegramId: '123456' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Room created successfully.');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/rooms/create')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Room name and Telegram ID are required.');
  });

  it('should handle server error', async () => {
    ensureUserExists.mockRejectedValue(new Error('Mock error'));

    const res = await request(app)
      .post('/api/rooms/create')
      .send({ name: 'Test Room', telegramId: '123456' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});
