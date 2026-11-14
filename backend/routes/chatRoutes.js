const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const { actionRateLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();
router.use(protect);

// Conversation feeds & direct messaging
router.get('/conversations', controller.getConversations);
router.post(
  '/conversations',
  actionRateLimiter,
  [body('userId').isMongoId().withMessage('A valid user ObjectId is required.')],
  validateRequest,
  controller.createConversation,
);
router.get(
  '/conversations/:conversationId/messages',
  [param('conversationId').isMongoId().withMessage('A valid conversation ObjectId is required.'), query('limit').optional().isInt({ min: 1, max: 100 })],
  validateRequest,
  controller.getMessages,
);
router.post(
  '/conversations/:conversationId/messages',
  actionRateLimiter,
  [
    param('conversationId').isMongoId().withMessage('A valid conversation ObjectId is required.'),
    body('content').isString().trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters.'),
  ],
  validateRequest,
  controller.sendMessage,
);
router.post(
  '/conversations/:conversationId/read',
  [param('conversationId').isMongoId().withMessage('A valid conversation ObjectId is required.')],
  validateRequest,
  controller.markRead,
);

// Team Group Chat routes with backend membership authorization
router.get(
  '/teams/:teamId',
  [param('teamId').isMongoId().withMessage('A valid team ObjectId is required.')],
  validateRequest,
  controller.getTeamChat,
);
router.get(
  '/teams/:teamId/messages',
  [
    param('teamId').isMongoId().withMessage('A valid team ObjectId is required.'),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  controller.getTeamMessages,
);
router.post(
  '/teams/:teamId/messages',
  actionRateLimiter,
  [
    param('teamId').isMongoId().withMessage('A valid team ObjectId is required.'),
    body('content').isString().trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters.'),
  ],
  validateRequest,
  controller.sendTeamMessage,
);

module.exports = router;
