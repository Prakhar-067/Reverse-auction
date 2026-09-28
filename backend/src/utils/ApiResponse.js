// Standardized API response helpers

class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, data = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, code = 'SERVER_ERROR') {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
    });
  }

  static badRequest(res, message = 'Bad Request', code = 'BAD_REQUEST') {
    return ApiResponse.error(res, message, 400, code);
  }

  static unauthorized(res, message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return ApiResponse.error(res, message, 401, code);
  }

  static forbidden(res, message = 'Forbidden', code = 'FORBIDDEN') {
    return ApiResponse.error(res, message, 403, code);
  }

  static notFound(res, message = 'Not Found', code = 'NOT_FOUND') {
    return ApiResponse.error(res, message, 404, code);
  }

  static conflict(res, message = 'Conflict', code = 'CONFLICT') {
    return ApiResponse.error(res, message, 409, code);
  }

  static validationError(res, message = 'Validation Error', errors = [], code = 'VALIDATION_ERROR') {
    return res.status(422).json({
      success: false,
      message,
      code,
      errors,
    });
  }

  static tooMany(res, message = 'Too many requests', code = 'RATE_LIMITED') {
    return ApiResponse.error(res, message, 429, code);
  }

  static paginated(res, data, page, limit, total, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
}

module.exports = ApiResponse;
