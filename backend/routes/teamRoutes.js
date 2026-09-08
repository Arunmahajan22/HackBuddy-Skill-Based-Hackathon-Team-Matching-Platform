const express = require('express');
const { body, param, query } = require('express-validator');
const { createTeam, getTeams, getMyTeams, getJoinedTeams, getTeamById } = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const { actionRateLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();
const objectIdParam = param('teamId').isMongoId().withMessage('A valid team ObjectId is required.');

// Explore teams with search filters and pagination
router.get(
  '/',
  [
    query('q').optional().trim().isLength({ max: 100 }),
    query('skill').optional().trim().isLength({ max: 50 }),
    query('page').optional().isInt({ min: 1, max: 10000 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  validateRequest,
  getTeams,
);

// Get teams created by the logged-in user
router.get('/mine', protect, getMyTeams);
router.get('/joined', protect, getJoinedTeams);

// Create a new team
router.post(
  '/',
  protect,
  actionRateLimiter,
  [
    body('hackathonName')
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Hackathon name must be between 2 and 150 characters.'),
    body('description')
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Description must be between 20 and 2000 characters.'),
    body('requiredSkills')
      .isArray({ min: 1, max: 30 })
      .withMessage('At least one required skill is needed.'),
    body('requiredSkills.*')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each required skill must be between 1 and 50 characters.'),
    body('teamSizeLimit')
      .isInt({ min: 2, max: 20 })
      .toInt()
      .withMessage('Team size limit must be between 2 and 20 members.'),
  ],
  validateRequest,
  createTeam,
);

// Get single team details
router.get('/:teamId', [objectIdParam], validateRequest, getTeamById);

module.exports = router;
