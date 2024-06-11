import connectDB from '../../../../db/mongoose';
import User from '../../../../models/User';

export default async function handler(req, res) {
    await connectDB();

    const { telegramId, roomId } = req.query;

    if (!telegramId || !roomId) {
        return res.status(400).json({ error: 'Missing telegramId or roomId' });
    }

    try {
        const user = await User.findById(telegramId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentVote = user.currentVote.get(roomId);

        if (!currentVote) {
            return res.status(200).json({ spotifyId: null });
        }

        return res.status(200).json({ spotifyId: currentVote });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
