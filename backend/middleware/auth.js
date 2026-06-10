const { verifyToken } = require('../utils/jwt');
const { sendError }   = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token.', 401);
  }
};

const requireCoordinator = (req, res, next) => {
  if (req.user?.role !== 'coordinator') {
    return sendError(res, 'Access denied. Coordinators only.', 403);
  }
  next();
};

const requireStudent = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return sendError(res, 'Access denied. Students only.', 403);
  }
  next();
};

module.exports = { authenticate, requireCoordinator, requireStudent };