import connectDB from '../../../../db/mongoose';
import Room from '../../../../models/Room';
import { ensureUserExists } from '../../../../utils/database';


export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'GET') {
        const { telegramId } = req.query;

        if (!telegramId) {
            return res.status(400).json({ message: 'Telegram ID is required' });
        }

        try {
            // Find the user by Telegram ID
            const user = await ensureUserExists(telegramId);

            // Retrieve the list of room IDs where the user is an ordinary user
            const userRoomIds = user.userRooms || [];

            // Fetch details of rooms using the stored user room IDs
            const rooms = await Room.find({ _id: { $in: userRoomIds } }).exec();

            // Prepare the response data, returning an empty array if no rooms are found
            const roomsData = rooms.map(room => ({
                id: room._id,
                name: room.name
            }));

            res.status(200).json(roomsData);

        } catch (error) {
            console.error('Error fetching user rooms:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
