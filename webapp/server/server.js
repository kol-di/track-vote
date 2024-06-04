const express = require('express');
const next = require('next');
const { createServer } = require('http');
const socketIo = require('socket.io');
const { spotifyAuth } = require('./auth.js');
const tokenRouter = require('./routes/tokenRouter.js');
const Room = require('../src/models/Room.js'); 
const User = require('../src/models/User.js'); 
const { generateToken, verifyToken } = require('./jwtUtils');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

function authenticate(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
  
    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload) {
          req.user = payload; // Attach user info to request
          return next();
        }
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    else {
        return res.status(401).json({ message: 'No auth token' })
    }
  }

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
    path: '/ws',
    cors: {
      origin: process.env.NEXT_PUBLIC_URL, // Use the environment variable
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
      credentials: true
    }
  });

  // JWT authentication route for the bot
  server.use('/jwt-auth/token', express.raw({ type: '*/*', limit: '10mb' }));
  server.post('/jwt-auth/token', (req, res) => {
    console.log("Auth received body", JSON.parse(req.body));
    const { payload } = JSON.parse(req.body);
    const token = generateToken(payload);
    return res.json({ token });
  });

  // routes used by the bot require JWT auth
  server.use('/api/users/:tid', authenticate);
  server.use('/api/rooms/:id/add-user', authenticate);
  server.use('/api/rooms/:id/exists', authenticate);
  

  // Setup WebSocket connections
  io.on('connection', socket => {
    console.log('New client connected');

    socket.on('joinRoom', async (roomId) => {
        console.log(`Socket ${socket.id} joining room ${roomId}`);
        socket.join(roomId);
    });

    socket.on('updateTopChart', async ({ roomId, tracks }) => {
        console.log('updating top chart');
        try {
            const room = await Room.findById(roomId);
            if (!room) {
                console.error(`Room with ID ${roomId} not found.`);
                socket.emit('error', 'Room not found.');
                return;
            }
    
            // Process each track in the input tracks array
            for (const trackInfo of tracks) {
                const { track, increment } = trackInfo;
    
                if (increment > 0) {
                    // Handle the incremented track
                    let existingTrack = room.tracks.find(t => t.spotifyId === track.spotifyId);
                    if (existingTrack) {
                        existingTrack.votes += increment;
                    } else {
                        // Add the new track with 1 vote if it doesn't exist
                        existingTrack = { ...track, votes: increment };
                        room.tracks.push(existingTrack);
                    }
                } else if (increment < 0) {
                    // Handle the decremented track
                    const decrementedTrack = room.tracks.find(t => t.spotifyId === track.spotifyId);
                    if (decrementedTrack) {
                        decrementedTrack.votes = Math.max(decrementedTrack.votes + increment, 0);
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
            socket.broadcast.to(roomId).emit('topChartUpdated', tracks);
        } catch (error) {
            console.error('Error updating top chart:', error);
            socket.emit('error', 'Failed to update top chart');
        }
    });


    socket.on('deleteTrack', async ({ roomId, trackUpdates }) => {
        try {
            const room = await Room.findById(roomId);
            if (!room) {
                console.error(`Room with ID ${roomId} not found.`);
                socket.emit('error', 'Room not found.');
                return;
            }

            const trackUpdate = trackUpdates[0]; // Assumption: Only one track is deleted at a time
            const { track, increment } = trackUpdate;
            const trackIndex = room.tracks.findIndex(t => t.spotifyId === track.spotifyId);
            
            if (trackIndex !== -1) {
                room.tracks[trackIndex].votes += increment;
                if (room.tracks[trackIndex].votes <= 0) {
                    room.tracks.splice(trackIndex, 1);
                }
            }

            const userIds = [...room.users, ...room.admins];
            const users = await User.find({ _id: { $in: userIds }, [`currentVote.${roomId}`]: track.spotifyId });

            for (const user of users) {
                delete user.currentVote[roomId];
                await user.save();
            }

            await room.save();

            socket.broadcast.to(roomId).emit('topChartUpdated', trackUpdates);
        } catch (error) {
            console.error('Error deleting track:', error);
            socket.emit('error', 'Failed to delete track');
        }
    });

    socket.on('requestLatestData', async ({ roomId }) => {
        try {
            const room = await Room.findById(roomId)
                .populate('admins', '_id')
                .populate({
                    path: 'tracks',
                    select: 'votes spotifyId name artists albumCoverUrl',
                    options: { sort: { votes: -1 } }
                });
    
            if (!room) {
                console.error(`Room with ID ${roomId} not found.`);
                socket.emit('error', 'Room not found.');
                return;
            }

            room.tracks.sort((a, b) => b.votes - a.votes);
    
            const response = {
                id: room._id,
                roomName: room.name,
                admins: room.admins.map(admin => admin._id),
                tracks: room.tracks.map(track => ({
                    spotifyId: track.spotifyId,
                    name: track.name,
                    artists: track.artists,
                    albumCoverUrl: track.albumCoverUrl,
                    votes: track.votes
                }))
            };
    
            console.log('Websocket emmited latest data');
            socket.emit('latestData', response);
        } catch (error) {
            console.error('Error fetching latest data:', error);
            socket.emit('error', 'Failed to fetch latest data');
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
