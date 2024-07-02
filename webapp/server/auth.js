const express = require('express');
const fetch = require('node-fetch');
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
let accessToken, refreshToken;

const spotifyAuth = express();

const setAccessToken = (token) => { accessToken = token; };
const setRefreshToken = (token) => { refreshToken = token; };

const refreshAccessToken = async () => {
  if (!refreshToken) {
      console.error('No refresh token available.');
      return; // Early exit if there's no refresh token
  }

  try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
              'Authorization': 'Basic ' + (Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')),
              'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: refreshToken
          })
      });

      if (!response.ok) {
          throw new Error(`Failed to refresh access token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.access_token) {
          accessToken = data.access_token;
          console.log('Access Token Refreshed:', accessToken);
          if (data.refresh_token) {
              refreshToken = data.refresh_token; // Update refresh token if a new one is provided
          }
          setTimeout(refreshAccessToken, (data.expires_in - 300) * 1000); // Refresh 5 minutes before expiry
      } else {
          throw new Error('Invalid token data received from Spotify');
      }
  } catch (error) {
      console.error('Error refreshing the Spotify token:', error.message);
  }
};


spotifyAuth.get('/login', (req, res) => {
  console.log(CLIENT_ID);
  console.log(process.env.SPOTIFY_CLIENT_ID);
  console.log(process.env.NODE_ENV);
  const scope = 'user-read-private user-read-email';
  res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`);
});

spotifyAuth.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + (Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  const data = await response.json();
  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  
  // Start the automatic refresh process
  refreshAccessToken();
  
  console.log('Initial Access Token:', accessToken);
  console.log('Refresh Token:', refreshToken);
  res.redirect('/'); // Redirect to the home page or dashboard as per your app's flow
});

const getAccessToken = () => accessToken;

// Exporting both named and default exports
module.exports = { getAccessToken, refreshAccessToken, setAccessToken, setRefreshToken, spotifyAuth: spotifyAuth };

