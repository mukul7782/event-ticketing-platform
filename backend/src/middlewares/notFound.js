const { AppError } = require('../utils/appError');

const notFoundHandler = (req, _res, next) => {
  next(AppError.notFound(`Route not found - ${req.method} ${req.originalUrl}`));
};

module.exports = { notFoundHandler };