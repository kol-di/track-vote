import request from 'supertest';
import express from 'express';
import handler from '../../../pages/api/rooms/[id]';
import Room from '../../../models/Room';
import User from '../../../models/User';

const app = express();
app.get('/api/rooms/:id', (req, res) => {
  req.query.id = req.params.id;
  handler(req, res);
  });

describe('GET /api/rooms/:id', () => {
  it('should fetch room details', async () => {
    const mockAdmin = new User({ _id: '60f6c45d9d1a9b3a4c8b1234', telegramId: '123456' });
    await mockAdmin.save();

    const mockRoom = new Room({
      _id: '60f6c45d9d1a9b3a4c8b4567',
      name: 'Test Room',
      admins: [mockAdmin._id],
      tracks: [{ spotifyId: 'track123', name: 'Track 1', artists: ['Artist 1'], albumCoverUrl: 'url', votes: 10 }]
    });
    await mockRoom.save();

    const res = await request(app)
      .get('/api/rooms/60f6c45d9d1a9b3a4c8b4567');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: '60f6c45d9d1a9b3a4c8b4567',
      roomName: 'Test Room',
      admins: ['60f6c45d9d1a9b3a4c8b1234'],
      tracks: [{ spotifyId: 'track123', name: 'Track 1', artists: ['Artist 1'], albumCoverUrl: 'url', votes: 10 }]
    });
  });

  it('should return 404 if room is not found', async () => {
    const res = await request(app)
      .get('/api/rooms/60f6c45d9d1a9b3a4c8b4567');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Room not found');
  });
});
