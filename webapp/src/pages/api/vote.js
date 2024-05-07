import connectDB from '../../db/mongoose';
import { ensureUserExists } from '../../utils/database';

export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'POST') {
        const { roomId, spotifyId, telegramId } = req.body;

        // Check for required parameters
        if (!roomId || !spotifyId || !telegramId) {
            return res.status(400).json({ message: 'Missing required parameters.' });
        }

        try {
            // Ensure the user exists or create a new one
            const user = await ensureUserExists(telegramId);

            // Get the previous vote for this room (if any)
            const previousVote = user.currentVote?.get(roomId);

            if (previousVote === spotifyId) {
                res.status(200).json({ decrementedTrackId: null, sameClick: true });

            } else {
                // Update the current vote for the user
                user.currentVote.set(roomId, spotifyId);
                await user.save();
                res.status(200).json({ decrementedTrackId: previousVote ?? null });
            }
        } catch (error) {
            console.error('Error updating vote:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
