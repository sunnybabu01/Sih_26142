const jwt = require('jsonwebtoken');
const store = require('../services/store');

const JWT_SECRET = process.env.JWT_SECRET || 'geovision_satellite_srm_secret_key_2026';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No Bearer token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await store.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.', error: err.message });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource. Required: [${roles.join(', ')}]`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize, JWT_SECRET };
