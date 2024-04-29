import fetch from 'node-fetch';
// import LRU from 'lru-cache';
const LRU = require('lru-cache').LRUCache;

const cache = new LRU({
    maxAge: 1000 * 60 * 15, // 15 minutes
    max: 100 // Maximum 100 items
});

async function fetchAccessToken() {
    const response = await fetch('http://localhost:3000/auth-api/token');
    if (!response.ok) {
        throw new Error('Failed to fetch access token');
    }
    const data = await response.json();
    return data.accessToken;
}

export default async function handler(req, res) {
    const { query } = req.query;

    if (cache.has(query)) {
        return res.json(cache.get(query));
    }

    try {
        const accessToken = await fetchAccessToken();
        const url = `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(query)}`;
        const headers = { 'Authorization': `Bearer ${accessToken}` };

        const spotifyRes = await fetch(url, { headers });
        const data = await spotifyRes.json();

        // Cache the response
        cache.set(query, data);
        res.status(200).json(data);
    } catch (error) {
        console.error('Error searching Spotify:', error);
        res.status(500).json({ message: 'Failed to fetch data from Spotify', error: error.message });
    }
}
