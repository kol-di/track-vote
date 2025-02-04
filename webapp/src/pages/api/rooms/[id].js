import connectDB from '../../../db/mongoose'; // Adjust the path as necessary
import Room from '../../../models/Room'; // Ensure this path is correct

export default async function handler(req, res) {
    await connectDB();
    const { id } = req.query;
    console.log('Looking for room:', id);

    if (req.method === 'GET') {
        try {
            const room = await Room.findById(id)
                .populate('admins', '_id') // Populating admins, assuming '_id' is a field in the User model
                .populate({
                    path: 'tracks',
                    // Selecting all fields for tracks
                    select: 'votes spotifyId name artists albumCoverUrl',
                    options: { sort: { votes: -1 } } // Sorting tracks by votes
                });

            if (!room) {
                console.error('Cant find room with id:', id);
                return res.status(404).json({ message: 'Room not found' });
            }

            // Format the response
            const response = {
                id: room._id,
                roomName: room.name,
                admins: room.admins.map(admin => admin._id),
                tracks: room.tracks.map(track => ({
                    spotifyId: track.spotifyId,
                    name: track.name,
                    artists: track.artists,
                    albumCoverUrl: track.albumCoverUrl,
                    votes: track.votes
                }))
            };

            res.status(200).json(response);
        } catch (error) {
            console.error('Fetch room error:', error);
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', 'GET');
        res.status(405).end('Method Not Allowed');
    }
}
