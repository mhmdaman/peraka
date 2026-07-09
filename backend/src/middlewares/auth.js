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
    const employee = await db.employee.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });
    if (!employee || employee.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account inactive or not found' });
    }
    req.user = {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      avatar: employee.avatar,
      status: employee.status,
      role: employee.role.name,
    };
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
