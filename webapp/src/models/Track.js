import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true, unique: true },
  votes: { type: Number, default: 0 }
});

export default mongoose.models.Track || mongoose.model('Track', trackSchema);
