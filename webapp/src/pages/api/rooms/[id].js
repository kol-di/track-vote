import connectDB from '../../../db/mongoose'; // Adjust the path as necessary
import Room from '../../../models/Room'; // Ensure this path is correct
import User from '../../../models/User'; // Ensure you have this model and it's correct
import Track from '../../../models/Track'; // Ensure this path is correct

export default async function handler(req, res) {
  await connectDB();
  const { id } = req.query;

  console.log('PIZDEC');
  if (req.method === 'GET') {
    try {
      // Ensures that only valid MongoDB object IDs are processed
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Invalid room ID format' });
      }

      const room = await Room.findById(id)
        .populate('admins', 'telegramId') // Populating admins, assuming 'name' is a field in the User model
        .populate({
          path: 'tracks',
          select: 'votes spotifyId', // Selecting fields to return for tracks
          options: { sort: { votes: -1 } } // Sorting tracks by votes
        });

      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      res.status(200).json({
        roomName: room.name,
        admins: room.admins.map(admin => admin.telegramId), // Mapping over admins to return names
        tracks: room.tracks.map(track => ({
          votes: track.votes,
          spotifyId: track.spotifyId
        }))
      });
    } catch (error) {
      console.error('Fetch room error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
  }
}
