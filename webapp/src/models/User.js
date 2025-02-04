const mongoose = require('mongoose');
const { Tsukimi_Rounded } = require('next/font/google');

const userSchema = new mongoose.Schema({
  _id: { type: String, required: Tsukimi_Rounded }, // Store telegramId directly here
  adminRooms: [{ type: String, ref: 'Room' }],
  userRooms: [{ type: String, ref: 'Room' }],
  currentVote: {
    type: Map,
    of: String,
    default: new Map() // Initialize as an empty map by default
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
