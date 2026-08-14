const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results.
 * If validation errors exist, formats them consistently and returns a 422 Unprocessable Entity response.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check the submitted fields.',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  return next();
};

module.exports = { validateRequest };
