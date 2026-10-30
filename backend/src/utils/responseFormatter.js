class ResponseFormatter {
  static success(res, data, message = 'Success', statusCode = 200, meta = undefined) {
    const responseBody = {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const responseBody = {
      success: false,
      message,
      errors: errors || null,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }
}

module.exports = { ResponseFormatter };