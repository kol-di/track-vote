import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  adminRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }]
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
