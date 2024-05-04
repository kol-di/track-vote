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

            // Create new room with the user as admin
            const room = new Room({
                name,
                admins: [user._id],
                tracks: []
            });
            await room.save();

            // Add the newly created room to the user's list of rooms
            user.adminRooms.push(room._id);
            await user.save();

            // Define base URL manually or via environment variables
            const baseURL = process.env.NEXT_PUBLIC_WEB_APP_BASE_URL; // Example: 'https://myapp.com'
            const roomLink = `${baseURL}/rooms/${room._id}`;

            res.status(201).json({ roomLink, message: 'Room created successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
