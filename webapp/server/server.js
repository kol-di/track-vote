const express = require('express');
const next = require('next');
const { createServer } = require('http');
const socketIo = require('socket.io');
const { spotifyAuth } = require('./auth.js');
const tokenRouter = require('./routes/tokenRouter.js');
const Room = require('../src/models/Room.js'); // Assuming Room model is required
const cors = require('cors');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();


function onlyLocalRequests(req, res, next) {
  if (req.hostname === 'localhost' || req.ip === '127.0.0.1' || req.ip === '::1') {
      next();
  } else {
      res.status(403).send('Access Denied');
  }
}

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server); // Create an HTTP server
  const io = socketIo(httpServer, {
    transports: ['websocket'],
    cors: {
      origin: process.env.NEXT_PUBLIC_WEB_APP_BASE_URL, // Use the environment variable
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    }
  });

  // Setup WebSocket connections
  io.on('connection', socket => {
    console.log('New client connected');

    socket.on('joinRoom', async (roomId) => {
        console.log(`Socket ${socket.id} joining room ${roomId}`);
        socket.join(roomId);
    });

    socket.on('updateTopChart', async ({ roomId, track }) => {
      try {
          console.log(`Updating top chart in room ${roomId} with track ${track.spotifyId}`);
  
          // Check if the track exists and update the votes or decrement them based on the input
          const updateResult = await Room.findOneAndUpdate(
              { _id: roomId, "tracks.spotifyId": track.spotifyId },
              { $inc: { "tracks.$.votes": track.votes > 0 ? 1 : -1 } },
              { new: true }
          );
  
          if (updateResult) {
              // If update was successful and votes are not zero, emit only spotifyId and updated votes
              if (track.votes !== 0) {
                  const updatedTrack = updateResult.tracks.find(t => t.spotifyId === track.spotifyId);
                  socket.to(roomId).emit('topChartUpdated', { spotifyId: updatedTrack.spotifyId, votes: updatedTrack.votes });
              } else {
                  // If votes reach zero, remove the track and inform clients
                  await Room.updateOne(
                      { _id: roomId },
                      { $pull: { tracks: { spotifyId: track.spotifyId } } }
                  );
                  socket.to(roomId).emit('topChartUpdated', { spotifyId: track.spotifyId, votes: 0 });
              }
          } else {
              // If the track does not exist and votes > 0, add it
              if (track.votes > 0) {
                  await Room.updateOne(
                      { _id: roomId },
                      { $push: { tracks: track } }
                  );
                  // Emit the full track data as it's newly added
                  socket.to(roomId).emit('topChartUpdated', track);
              }
          }
      } catch (error) {
          console.error('Error updating top chart:', error);
          socket.emit('error', 'Failed to update top chart');
      }
  });  

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
  });

  server.use('/spotify', spotifyAuth);  // Mount the Spotify auth routes
  server.use('/auth-api', onlyLocalRequests, tokenRouter);      // Use the tokenRouter for token retrieval routes

  // Serve all other requests via Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
