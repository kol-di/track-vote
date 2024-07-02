import request from 'supertest';
import express from 'express';
import handler from '../../pages/api/vote';
import { ensureUserExists } from '../../utils/database';
import mongoose from 'mongoose';

jest.mock('../../utils/database', () => ({
  ensureUserExists: jest.fn()
}));

const app = express();
app.use(express.json());
app.post('/api/vote', handler);

describe('POST /api/vote', () => {
  beforeEach(() => {
    ensureUserExists.mockReset();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return 400 if required parameters are missing', async () => {
    const res = await request(app).post('/api/vote').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing required parameters.');
  });

  it('should return 200 and the previous vote if the same song is voted for', async () => {
    const mockUser = {
      _id: 'user123',
      currentVote: new Map([['room123', 'spotify123']]),
      save: jest.fn()
    };

    ensureUserExists.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/vote').send({
      roomId: 'room123',
      spotifyId: 'spotify123',
      telegramId: 'telegram123'
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ decrementedTrackId: null, sameClick: true });
  });

  it('should update the vote and return the previous vote if a different song is voted for', async () => {
    const mockUser = {
      _id: 'user123',
      currentVote: new Map([['room123', 'spotify123']]),
      save: jest.fn()
    };

    ensureUserExists.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/vote').send({
      roomId: 'room123',
      spotifyId: 'spotify456',
      telegramId: 'telegram123'
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ decrementedTrackId: 'spotify123' });
    expect(mockUser.currentVote.get('room123')).toBe('spotify456');
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should handle internal server error', async () => {
    ensureUserExists.mockRejectedValue(new Error('Mock error'));

    const res = await request(app).post('/api/vote').send({
      roomId: 'room123',
      spotifyId: 'spotify123',
      telegramId: 'telegram123'
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});
