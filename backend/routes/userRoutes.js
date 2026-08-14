const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middlewares/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/userController');
const { validateRequest } = require('../middlewares/validateMiddleware');

const router = express.Router();
const experienceLevels = ['beginner', 'intermediate', 'advanced'];

router.use(protect);

router
  .route('/me')
  .get(getProfile)
  .patch(
    [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 80 })
        .withMessage('Name must be between 2 and 80 characters.'),
      body('branch')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Branch cannot exceed 100 characters.'),
      body('year')
        .optional()
        .isInt({ min: 1, max: 10 })
        .toInt()
        .withMessage('Year must be between 1 and 10.'),
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
        .withMessage('Skills must be an array of up to 50 items.'),
      body('skills.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each skill must be between 1 and 50 characters.'),
      body('experienceLevel')
        .optional()
        .isIn(experienceLevels)
        .withMessage('Experience level must be beginner, intermediate, or advanced.'),
    ],
    validateRequest,
    updateProfile,
  );

module.exports = router;
