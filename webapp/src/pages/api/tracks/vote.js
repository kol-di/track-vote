import connectDB from '../../../db/mongoose';
import Track from '../../../models/Track';

export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'POST') {
        const { spotifyId } = req.body;

        try {
            // Increment votes for a track
            const track = await Track.findOneAndUpdate(
                { spotifyId },
                { $inc: { votes: 1 } },
                { new: true, upsert: true }
            );
            res.status(200).json(track);
        } catch (error) {
            res.status(500).json({ message: 'Failed to vote for track' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
