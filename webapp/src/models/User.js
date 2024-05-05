import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true }, // Store telegramId directly here
  adminRooms: [{ type: String, ref: 'Room' }],
  userRooms: [{ type: String, ref: 'Room' }]
});

// Create a virtual field to map `telegramId` to `_id`
userSchema.virtual('telegramId').get(function () {
  return this._id;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
