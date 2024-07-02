import Room from '../../../../models/Room';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method not allowed' });
        return;
    }

    const { roomId, trackId } = req.body;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const track = room.tracks.find(track => track.spotifyId === trackId);
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }

        const deletedTrackVoteCount = track.votes;

        res.status(200).json({ decrementedTrackId: trackId, deletedTrackVoteCount });
    } catch (error) {
        console.error('Error fetching track:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
