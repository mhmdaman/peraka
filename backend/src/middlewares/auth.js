const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query(
      'SELECT e.id, e.first_name, e.last_name, e.email, e.avatar, e.status, r.name as role FROM employees e JOIN roles r ON e.role_id = r.id WHERE e.id = ?',
      [decoded.id]
    );
    if (!rows.length || rows[0].status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account inactive or not found' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied: insufficient role' });
  }
  next();
};

module.exports = { authenticate, authorize };
