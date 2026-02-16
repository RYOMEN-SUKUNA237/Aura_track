const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be set in .env and be at least 32 characters.');
  process.exit(1);
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { algorithm: 'HS256', expiresIn: '24h' }
  );
}

module.exports = { authMiddleware, generateToken };
