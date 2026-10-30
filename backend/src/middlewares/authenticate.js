const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('../utils/appError');

async function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Access token is missing'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

module.exports = { authenticate };