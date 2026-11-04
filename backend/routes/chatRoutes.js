const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const { actionRateLimiter } = require('../middlewares/rateLimitMiddleware');

const router = express.Router();
router.use(protect);
router.get('/conversations', controller.getConversations);
router.post('/conversations', actionRateLimiter, [body('userId').isMongoId(),], validateRequest, controller.createConversation);
router.get('/conversations/:conversationId/messages', [param('conversationId').isMongoId(), query('limit').optional().isInt({ min: 1, max: 100 })], validateRequest, controller.getMessages);
router.post('/conversations/:conversationId/messages', actionRateLimiter, [param('conversationId').isMongoId(), body('content').isString().trim().isLength({ min: 1, max: 2000 })], validateRequest, controller.sendMessage);
router.post('/conversations/:conversationId/read', [param('conversationId').isMongoId()], validateRequest, controller.markRead);
module.exports = router;
