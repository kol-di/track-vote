const express = require('express');
const { getAccessToken } = require('../auth.js');


const router = express.Router();

router.get('/token', (req, res) => {
    const token = getAccessToken();
    if (token) {
        console.log("Sending token to client.");
        res.json({ accessToken: token });
    } else {
        console.log("Token not available, sending error.");
        res.status(500).json({ error: 'No access token available' });
    }
});

module.exports = router;
