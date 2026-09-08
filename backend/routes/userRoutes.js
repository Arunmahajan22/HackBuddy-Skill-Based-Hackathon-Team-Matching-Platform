const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middlewares/authMiddleware');
const { getProfile, updateProfile, getRecommendations } = require('../controllers/userController');
const { validateRequest } = require('../middlewares/validateMiddleware');

const router = express.Router();
const experienceLevels = ['beginner', 'intermediate', 'advanced'];
const availabilityOptions = ['open', 'weekends', 'evenings', 'limited', 'unavailable'];
const urlField = (field, label) => body(field).optional({ checkFalsy: true }).trim().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage(`${label} must be a valid http(s) URL.`);

router.use(protect);

router.get('/recommendations', getRecommendations);

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
        .optional({ checkFalsy: true }).trim().isLength({ max: 255 }).isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('GitHub URL must be a valid http(s) URL.'),
      urlField('avatarUrl', 'Avatar URL').isLength({ max: 500 }),
      urlField('linkedin', 'LinkedIn URL').isLength({ max: 255 }),
      urlField('portfolio', 'Portfolio URL').isLength({ max: 255 }),
      body('skills')
        .optional()
        .isArray({ max: 50 })
        .withMessage('Skills must be an array of up to 50 items.'),
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
        .optional()
        .isIn(experienceLevels)
        .withMessage('Experience level must be beginner, intermediate, or advanced.'),
      body('hackathonExperience').optional().isInt({ min: 0, max: 100 }).toInt().withMessage('Hackathon experience must be between 0 and 100.'),
      body('availability').optional().isIn(availabilityOptions).withMessage('Availability must be a supported option.'),
      body('preferredTeamSize').optional().isInt({ min: 2, max: 20 }).toInt().withMessage('Preferred team size must be between 2 and 20.'),
      body('projects').optional().isArray({ max: 10 }).withMessage('Projects must contain at most 10 entries.'),
      body('projects.*.title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Project titles must be between 1 and 100 characters.'),
      body('projects.*.description').optional().trim().isLength({ max: 500 }).withMessage('Project descriptions cannot exceed 500 characters.'),
      body('projects.*.url').optional({ checkFalsy: true }).trim().isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Project URLs must be valid http(s) URLs.'),
      body('projects.*.technologies').optional().isArray({ max: 20 }).withMessage('Project technologies must contain at most 20 entries.'),
      body('projects.*.technologies.*').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Each project technology must be between 1 and 50 characters.'),
    ],
    validateRequest,
    updateProfile,
  );

module.exports = router;
