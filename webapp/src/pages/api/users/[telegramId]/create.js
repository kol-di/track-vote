import { ensureUserExists } from '../../../../utils/database'; // Adjust path as needed
import connectDB from '../../../../db/mongoose';

export default async function handler(req, res) {
    await connectDB();

    if (req.method === 'POST') {
        const { telegramId } = req.query;

        if (!telegramId) {
            return res.status(400).json({ status: 'error', message: 'Telegram ID is required' });
        }

        try {
            // Ensure the user exists or create a new one using the utility function
            const user = await ensureUserExists(telegramId);

            // Respond with the appropriate message
            return res.status(200).json({
                status: 'success',
                message: 'User created or already exists',
                userId: user._id
            });
        } catch (error) {
            console.error('Error ensuring user existence:', error);
            return res.status(500).json({ status: 'error', message: 'Internal server error', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
