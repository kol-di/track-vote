import connectDB from '../../../db/mongoose';
import User from '../../../models/User';


export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'GET') {
        const { telegramId } = req.query;

        if (!telegramId) {
            return res.status(400).json({ exists: false, message: 'Telegram ID is required' });
        }

        try {
            // Find the user by Telegram ID
            const user = await User.findOne({ telegramId }).exec();
            const exists = !!user;
            res.status(200).json({ exists });
        } catch (error) {
            console.error('Error checking user existence:', error);
            res.status(500).json({ exists: false, message: 'Internal server error', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
