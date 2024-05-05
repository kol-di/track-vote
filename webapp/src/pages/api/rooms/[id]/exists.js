// api/rooms/[id]/exists.js
import connectDB from '../../../../db/mongoose';
import Room from '../../../../models/Room';

export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'GET') {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ exists: false, message: 'Room ID is required' });
        }

        try {
            // Find the room by its ID
            const room = await Room.findById(id).exec();
            const exists = !!room;

            // Respond based on the existence of the room
            if (exists) {
                return res.status(200).json({ exists, roomName: room.name });    
            } else {
                return res.status(200).json({ exists });
            }
        } catch (error) {
            console.error('Error checking room existence:', error);
            return res.status(500).json({ exists: false, message: 'Internal server error', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
