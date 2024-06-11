import request from 'supertest';
import express from 'express';
import handler from '../../../../pages/api/users/[telegramId]/currentVote';
import User from '../../../../models/User';


jest.mock('../../../../utils/database', () => ({
    ensureUserExists: jest.fn(),
}));

jest.mock('../../../../models/User', () => ({
    findById: jest.fn(),
}));

const app = express();
app.use(express.json());
app.get('/api/users/:telegramId/currentVote', (req, res) => {
    handler(req, res);
});

describe('GET /api/users/:telegramId/currentVote', () => {
    afterEach(async () => {
        jest.clearAllMocks();
    });

    it('should return 400 if telegramId or roomId is missing', async () => {
        const res = await request(app).get('/api/users/123/currentVote?telegramId=123');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Missing telegramId or roomId' });
    });

    it('should return 404 if user is not found', async () => {
        const res = await request(app).get('/api/users/123/currentVote?telegramId=123&roomId=room1');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'User not found' });
    });

    it('should return null if user has no vote in the room', async () => {
        User.findById.mockResolvedValueOnce({
            _id: '123',
            currentVote: new Map(),
        });

        const res = await request(app).get('/api/users/123/currentVote?telegramId=123&roomId=room1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ spotifyId: null });
    });

    it('should return the current vote if it exists', async () => {
        const currentVote = new Map();
        currentVote.set('room1', 'spotify123');
        User.findById.mockResolvedValueOnce({
            _id: '123',
            currentVote,
        });

        const res = await request(app).get('/api/users/123/currentVote?telegramId=123&roomId=room1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ spotifyId: 'spotify123' });
    });

    it('should handle internal server error', async () => {
        User.findById.mockRejectedValueOnce(new Error('Mock error'));

        const res = await request(app).get('/api/users/123/currentVote?telegramId=123&roomId=room1');

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal server error');
    });
});
