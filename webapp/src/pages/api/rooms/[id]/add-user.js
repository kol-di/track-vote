import connectDB from '../../../../db/mongoose';
import Room from '../../../../models/Room';
import { ensureUserExists } from '../../../../utils/database';


const handler = async (req, res) => {
  await connectDB();

  if (req.method === 'POST') {
    const { id } = req.query; // Room ID
    const { telegramId, role } = req.body; // User ID and desired role

    if (!id || !telegramId || !role) {
      return res.status(400).json({ message: 'Room ID, Telegram ID, and role are required.' });
    }

    try {
      // Find the room
      const room = await Room.findById(id).exec();
      if (!room) {
        return res.status(404).json({ message: 'Room not found.' });
      }

      // Find the user or create a new one
      const user = await ensureUserExists(telegramId);

      const isAdmin = room.admins.includes(user._id);
      const isOrdinaryUser = room.users.includes(user._id);

      // If user is already an admin, keep them as an admin regardless of role provided
      if (isAdmin) {
        if (!user.adminRooms.includes(room._id)) {
          user.adminRooms.push(room._id);
        }
        // Ensure user is still in the admins list
        if (!room.admins.includes(user._id)) {
          room.admins.push(user._id);
        }

      // If user is not an admin but role is admin, promote them to admin
      } else if (!isAdmin && role === 'a') {
        // Remove user from the `users` list if present
        if (isOrdinaryUser) {
          room.users = room.users.filter(uid => uid.toString() !== user._id.toString());
          user.userRooms = user.userRooms.filter(rid => rid.toString() !== room._id.toString());
        }

        // Add user to the admin list
        room.admins.push(user._id);
        if (!user.adminRooms.includes(room._id)) {
          user.adminRooms.push(room._id);
        }

      // If user is joining as an ordinary user and isn't an admin
      } else if (!isAdmin && role !== 'a') {
        if (!isOrdinaryUser) {
          room.users.push(user._id);
          user.userRooms.push(room._id);
        }
      }

      // Save the updated room and user
      await user.save();
      await room.save();

      res.status(200).json({ message: 'User role in the room has been updated successfully.' });
    } catch (error) {
      console.error('Error updating user role in room:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

module.exports = handler;
