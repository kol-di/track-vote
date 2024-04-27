import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }]
});

export default mongoose.models.Room || mongoose.model('Room', roomSchema);
