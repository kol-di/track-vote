import request from 'supertest';
import express from 'express';
import handler from '../../../../pages/api/rooms/[id]/exists';
import Room from '../../../../models/Room';

const app = express();
app.get('/api/rooms/exists', handler);

describe('GET /api/rooms/exists', () => {
  it('should return room existence status', async () => {
    const mockRoom = new Room({ _id: '60f6c45d9d1a9b3a4c8b4567', name: 'Test Room' });
    await mockRoom.save();

    const res = await request(app)
      .get('/api/rooms/exists?id=60f6c45d9d1a9b3a4c8b4567');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: true, roomName: 'Test Room' });
  });

  it('should return 400 if room ID is not provided', async () => {
    const res = await request(app)
      .get('/api/rooms/exists');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Room ID is required');
  });

  it('should return 200 with exists false if room is not found', async () => {
    const res = await request(app)
      .get('/api/rooms/exists?id=60f6c45d9d1a9b3a4c8b4567');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ exists: false });
  });
});
