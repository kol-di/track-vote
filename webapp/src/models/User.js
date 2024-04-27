import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
});

export default mongoose.models.User || mongoose.model('User', userSchema);
