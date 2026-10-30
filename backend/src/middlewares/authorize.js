const { AppError } = require('../utils/appError');

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Role '${req.user.role}' lacks permissions for this resource`));
    }
    next();
  };
}

module.exports = { authorize };