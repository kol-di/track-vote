import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  adminRooms: [{ type: String, ref: 'Room' }],
  userRooms: [{ type: String, ref: 'Room' }]
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
