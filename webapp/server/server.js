const express = require('express');
const next = require('next');
const { spotifyAuth } = require('./auth.js');
const tokenRouter = require('./routes/tokenRouter.js');

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

  server.use('/spotify', spotifyAuth);  // Mount the Spotify auth routes
  server.use('/auth-api', onlyLocalRequests, tokenRouter);      // Use the tokenRouter for token retrieval routes

  // Serve all other requests via Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
