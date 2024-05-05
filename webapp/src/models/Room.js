const mongoose = require('mongoose');

// Import nanoid with require
const { customAlphabet } = require('nanoid');

// Define the nanoid function with a specified alphabet and length
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);


const roomSchema = new mongoose.Schema({
  _id: { type: String, default: () => nanoid() },
  name: { type: String, required: true },
  admins: [{ type: String, ref: 'User' }],
  users: [{ type: String, ref: 'User' }],
  tracks: [{
    spotifyId: { type: String, required: true },
    name: { type: String, required: true },
    artists: [{ type: String }],
    albumCoverUrl: { type: String },
    votes: { type: Number, default: 0 }
  }]
});

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
module.exports = Room;
