const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(limit).lean();
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, readAt: null });
    return res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) { return next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { readAt: new Date() } },
      { new: true },
    ).lean();
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    return res.status(200).json({ success: true, notification });
  } catch (error) { return next(error); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ recipient: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
    return res.status(200).json({ success: true, markedRead: result.modifiedCount });
  } catch (error) { return next(error); }
};
