const express = require('express');
const { body, param } = require('express-validator');
const {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const { authRateLimiter, resendVerificationLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();
const experienceLevels = ['beginner', 'intermediate', 'advanced'];
const availabilityStatusOptions = ['open', 'weekends', 'evenings', 'limited', 'unavailable'];

// Registration route with strict rate limiting & validation
router.post(
  '/register',
  authRateLimiter,
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Name must be between 2 and 80 characters.'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('A valid email address is required.'),
    body('password')
      .isString()
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be at least 8 characters long.'),
    body('branch')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Branch is required.'),
    body('year')
      .isInt({ min: 1, max: 10 })
      .toInt()
      .withMessage('Year must be an integer between 1 and 10.'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters.'),
    body('github')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 255 })
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('GitHub URL must be a valid http(s) URL.'),
    body('skills')
      .optional()
      .isArray({ max: 50 })
      .withMessage('Skills must be an array of at most 50 items.'),
    body('skills.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each skill must be between 1 and 50 characters.'),
    body('interests').optional().isArray({ max: 20 }).withMessage('Interests must be an array of up to 20 items.'),
    body('interests.*').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Each interest must be between 1 and 50 characters.'),
    body('preferredRoles').optional().isArray({ max: 10 }).withMessage('Preferred roles must be an array of up to 10 items.'),
    body('preferredRoles.*').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Each preferred role must be between 1 and 50 characters.'),
    body('experienceLevel')
      .isIn(experienceLevels)
      .withMessage('Experience level must be beginner, intermediate, or advanced.'),
    body('availability')
      .optional()
      .custom((val) => {
        if (typeof val === 'string') {
          if (!availabilityStatusOptions.includes(val)) {
            throw new Error(`Availability status must be one of: ${availabilityStatusOptions.join(', ')}`);
          }
          return true;
        }
        if (typeof val === 'object' && val !== null) {
          if (val.status && !availabilityStatusOptions.includes(val.status)) {
            throw new Error(`Availability status must be one of: ${availabilityStatusOptions.join(', ')}`);
          }
          return true;
        }
        throw new Error('Availability must be a string or object.');
      }),
  ],
  validateRequest,
  register,
);

// Login route with strict rate limiting & validation
router.post(
  '/login',
  authRateLimiter,
  [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('A valid email address is required.'),
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Password is required.'),
  ],
  validateRequest,
  login,
);

// Email verification via GET URL param (clicked from email)
router.get(
  '/verify-email/:token',
  [
    param('token')
      .isHexadecimal()
      .isLength({ min: 64, max: 64 })
      .withMessage('Invalid verification token format.'),
  ],
  validateRequest,
  verifyEmail,
);

// Email verification via POST JSON body
router.post(
  '/verify-email',
  [
    body('token')
      .isHexadecimal()
      .isLength({ min: 64, max: 64 })
      .withMessage('Invalid verification token format.'),
  ],
  validateRequest,
  verifyEmail,
);

// Resend verification email with rate limiting
router.post(
  '/resend-verification',
  resendVerificationLimiter,
  [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('A valid email address is required.'),
  ],
  validateRequest,
  resendVerification,
);

// Session rehydration endpoint
router.get('/me', protect, getMe);

// Server-side logout endpoint
router.post('/logout', logout);

module.exports = router;
