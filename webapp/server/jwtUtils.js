const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'your-secret-key';

function generateToken(payload) {
    const options = { expiresIn: 3 * 60 * 60 };
    console.log('Generating new JWT token for', payload);
    return jwt.sign({ payload: payload }, secret, options);
}

function verifyToken(token) {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
}

module.exports = { generateToken, verifyToken };
