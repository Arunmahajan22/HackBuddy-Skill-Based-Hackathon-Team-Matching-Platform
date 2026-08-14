/**
 * 404 Not Found Middleware for unhandled route matching.
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global Error Handling Middleware:
 * Centralizes error formatting, preventing leaky stack traces in production
 * while providing precise error messages for database and validation exceptions.
 */
const errorHandler = (err, req, res, _next) => {
  // Log unexpected errors for server observability
  if (!err.isOperational && process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  // 1. Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format for field: ${err.path}`,
    });
  }

  // 2. Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    const errorDetails = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors: errorDetails,
    });
  }

  // 3. MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    const duplicateKeys = Object.keys(err.keyPattern || err.keyValue || {});
    const keyName = duplicateKeys[0] || 'record';
    return res.status(409).json({
      success: false,
      message: `A record with this ${keyName} already exists.`,
    });
  }

  // 4. JSON parse error in body payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload received.',
    });
  }

  // 5. Default internal error or custom error with status code
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected server error occurred. Please try again later.'
    : err.message || 'Internal server error.';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
