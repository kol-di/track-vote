import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true }, // Store telegramId directly here
  adminRooms: [{ type: String, ref: 'Room' }],
  userRooms: [{ type: String, ref: 'Room' }],
  currentVote: {
    type: Map,
    of: String,
    default: new Map() // Initialize as an empty map by default
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
