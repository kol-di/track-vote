import fetch from 'node-fetch';
const { LRUCache } = require('lru-cache');

const cache = new LRUCache({
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

async function fetchData(url, headers) {
    try {
        const response = await fetch(url, { headers });
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || 1; // Get the retry after value in seconds
            console.warn(`Rate limit exceeded, retrying after ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000)); // Sleep for retryAfter seconds
            return fetchData(url, headers); // Retry the request
        }
        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }
        const text = await response.text();  // First get response as text to check if it's empty
        try {
            return JSON.parse(text);  // Then parse it as JSON
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            throw new Error('Invalid JSON response');
        }
    } catch (error) {
        console.error('Failed to fetch data:', error);
        throw error;
    }
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

        const data = await fetchData(url, headers);
        cache.set(query, data);
        res.status(200).json(data);
    } catch (error) {
        if (error.message.includes('429')) {
            res.status(429).json({ message: 'Rate limit exceeded, please try again later' });
        } else {
            res.status(500).json({ message: 'Failed to fetch data from Spotify', error: error.message });
        }
    }
}
