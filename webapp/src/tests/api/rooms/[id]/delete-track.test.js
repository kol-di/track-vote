import request from 'supertest';
import express from 'express';
import handler from '../../../../pages/api/rooms/[id]/delete-track';
import Room from '../../../../models/Room';

const app = express();
app.use(express.json());
app.post('/api/rooms/delete-track', handler);

describe('POST /api/rooms/delete-track', () => {
  it('should delete a track from a room', async () => {
    const mockRoom = new Room({
      _id: '60f6c45d9d1a9b3a4c8b4567',
      name: 'Test Room',
      tracks: [{ spotifyId: 'track123', votes: 10, name: '200 по встречной' }]
    });
    await mockRoom.save();

    const res = await request(app)
      .post('/api/rooms/delete-track')
      .send({ roomId: '60f6c45d9d1a9b3a4c8b4567', trackId: 'track123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ decrementedTrackId: 'track123', deletedTrackVoteCount: 10 });
  });

  it('should return 404 if room is not found', async () => {
    const res = await request(app)
      .post('/api/rooms/delete-track')
      .send({ roomId: '60f6c45d9d1a9b3a4c8b4567', trackId: 'track123' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Room not found');
  });

  it('should return 404 if track is not found', async () => {
    const mockRoom = new Room({ _id: '60f6c45d9d1a9b3a4c8b4567', name: 'Test Room', tracks: [] });
    await mockRoom.save();

    const res = await request(app)
      .post('/api/rooms/delete-track')
      .send({ roomId: '60f6c45d9d1a9b3a4c8b4567', trackId: 'track123' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Track not found');
  });
});
