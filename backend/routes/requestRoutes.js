const express = require('express');
const { body, param } = require('express-validator');
const {
  sendJoinRequest,
  getIncomingRequests,
  getTeamRequests,
  updateRequestStatus,
} = require('../controllers/requestController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const { actionRateLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();
const teamIdParam = param('teamId').isMongoId().withMessage('A valid team ObjectId is required.');
const requestIdParam = param('requestId').isMongoId().withMessage('A valid request ObjectId is required.');

router.use(protect);

// Optimized batch fetch of all incoming requests for the authenticated creator
router.get('/incoming', getIncomingRequests);

// Send a join request to a team
router.post(
  '/teams/:teamId',
  actionRateLimiter,
  [
    teamIdParam,
    body('message')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Message cannot exceed 500 characters.'),
  ],
  validateRequest,
  sendJoinRequest,
);

// Get requests for a specific team
router.get('/teams/:teamId', [teamIdParam], validateRequest, getTeamRequests);

// Update status of a request (accept / reject)
router.patch(
  '/:requestId',
  [
    requestIdParam,
    body('status')
      .isIn(['accepted', 'rejected'])
      .withMessage('Status must be either accepted or rejected.'),
  ],
  validateRequest,
  updateRequestStatus,
);

module.exports = router;
