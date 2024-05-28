import connectDB from '../../../db/mongoose';
import Room from '../../../models/Room';
import { ensureUserExists } from '../../../utils/database';

export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'POST') {
        const { name, telegramId } = req.body;
        if (!name || !telegramId) {
            return res.status(400).json({ message: 'Room name and Telegram ID are required.' });
        }

        try {
            // Check if the user already exists or create a new one
            const user = await ensureUserExists(telegramId);
            console.log('Created new user inside /api/rooms/create');

            // Create new room with the user as admin
            const room = new Room({
                name,
                admins: [user._id],
                tracks: []
            });
            await room.save();
            console.log('Created new room inside /api/rooms/create');

            // Add the newly created room to the user's list of rooms
            user.adminRooms.push(room._id);
            await user.save();
            console.log('Added room to users room list inside /api/rooms/create');

            // Return id for created room
            const roomId = room._id;

            res.status(201).json({ roomId, message: 'Room created successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
