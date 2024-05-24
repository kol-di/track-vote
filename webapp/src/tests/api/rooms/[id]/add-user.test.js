const request = require('supertest');
const express = require('express');
const handler = require('../../../../pages/api/rooms/[id]/add-user');
const Room = require('../../../../models/Room');
const User = require('../../../../models/User');
const { ensureUserExists } = require('../../../../utils/database');

jest.mock('../../../../utils/database', () => ({
  ensureUserExists: jest.fn()
}));

const app = express();
app.use(express.json());
app.post('/api/rooms/:id/add-user', (req, res) => {
    req.query.id = req.params.id;
    handler(req, res);
    });

describe('POST /api/rooms/:id/add-user', () => {
  it('should add a user to a room', async () => {
    const mockRoom = new Room({ _id: '60f6c45d9d1a9b3a4c8b4567', name: 'Test Room', admins: [], users: [] });
    const mockUser = new User({ _id: '60f6c45d9d1a9b3a4c8b1234', telegramId: '123456', adminRooms: [], userRooms: [] });

    await mockRoom.save();
    ensureUserExists.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/rooms/60f6c45d9d1a9b3a4c8b4567/add-user')
      .send({ telegramId: '123456', role: 'a' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User role in the room has been updated successfully.');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/rooms/60f6c45d9d1a9b3a4c8b4567/add-user')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Room ID, Telegram ID, and role are required.');
  });

  it('should return 404 if room is not found', async () => {
    const res = await request(app)
      .post('/api/rooms/60f6c45d9d1a9b3a4c8b4567/add-user')
      .send({ telegramId: '123456', role: 'a' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Room not found.');
  });
});
