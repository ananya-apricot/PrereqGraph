const jwt = require('jsonwebtoken');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the Bearer token and attaches the user (without password) to req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new HttpError(401, 'Not authorised: missing token');
  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Not authorised: invalid or expired token');
  }
  const user = await User.findById(decoded.id).lean();
  if (!user) throw new HttpError(401, 'Not authorised: user no longer exists');
  delete user.password;
  req.user = user;
  next();
});

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden: insufficient permissions'));
  next();
};

module.exports = { protect, requireRole };
