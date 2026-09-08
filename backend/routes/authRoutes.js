const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const { authRateLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();
const experienceLevels = ['beginner', 'intermediate', 'advanced'];

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
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('GitHub URL cannot exceed 255 characters.'),
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

// Session rehydration endpoint
router.get('/me', protect, getMe);

// Server-side logout endpoint
router.post('/logout', logout);

module.exports = router;
