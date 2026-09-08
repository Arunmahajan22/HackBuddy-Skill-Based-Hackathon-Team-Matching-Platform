const express = require('express');
const { param } = require('express-validator');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/validateMiddleware');
const controller = require('../controllers/notificationController');

const router = express.Router();
router.use(protect);
router.get('/', controller.getNotifications);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', [param('id').isMongoId().withMessage('A valid notification identifier is required.')], validateRequest, controller.markRead);
module.exports = router;
