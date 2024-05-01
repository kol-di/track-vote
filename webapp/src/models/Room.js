const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tracks: [{
    spotifyId: { type: String, required: true },
    name: { type: String, required: true },
    artists: [{ type: String }], // Assuming multiple artists could be involved
    albumCoverUrl: { type: String },
    votes: { type: Number, default: 0 }
  }]
});

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
module.exports = Room;
