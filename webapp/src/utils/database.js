import User from '../models/User'; // Adjust the import path to your actual User model location


export async function ensureUserExists(telegramId) {
    try {
        // Attempt to find the user by their Telegram ID
        let user = await User.findOne({ telegramId });

        // If the user doesn't exist, create a new one
        if (!user) {
            user = new User({ telegramId });
            await user.save();
        }

        return user; // Return the existing or new user
    } catch (error) {
        console.error(`Error ensuring user existence: ${error.message}`);
        throw new Error('Database error occurred');
    }
}
