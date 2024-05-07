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

    socket.on('updateTopChart', async ({ roomId, tracks }) => {
        try {
            const room = await Room.findById(roomId);
            if (!room) {
                console.error(`Room with ID ${roomId} not found.`);
                socket.emit('error', 'Room not found.');
                return;
            }
    
            // Process each track in the input tracks array
            for (const trackInfo of tracks) {
                const { track, incremented } = trackInfo;
    
                if (incremented) {
                    // Handle the incremented track
                    let existingTrack = room.tracks.find(t => t.spotifyId === track.spotifyId);
                    if (existingTrack) {
                        existingTrack.votes += 1;
                    } else {
                        // Add the new track with 1 vote if it doesn't exist
                        existingTrack = { ...track, votes: 1 };
                        room.tracks.push(existingTrack);
                    }
                } else {
                    // Handle the decremented track
                    const decrementedTrack = room.tracks.find(t => t.spotifyId === track.spotifyId);
                    if (decrementedTrack) {
                        decrementedTrack.votes = Math.max(decrementedTrack.votes - 1, 0);
                        if (decrementedTrack.votes === 0) {
                            room.tracks = room.tracks.filter(t => t.spotifyId !== decrementedTrack.spotifyId);
                        }
                    }
                }
            }
    
            // Save changes to the room
            await room.save();
    
            // Emit the updated tracks to all other clients in the room
            console.log('Emitting topChartUpdated');
            socket.to(roomId).emit('topChartUpdated', tracks);
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
