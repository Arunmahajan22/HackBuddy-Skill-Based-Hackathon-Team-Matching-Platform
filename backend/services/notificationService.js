const Notification = require('../models/Notification');

/** Persists and delivers one notification through the recipient's authenticated private room. */
const createNotification = async ({ io, recipient, type, title, message, relatedEntity = {} }) => {
  const notification = await Notification.create({ recipient, type, title, message, relatedEntity });
  const payload = notification.toObject();
  io?.to(`user:${recipient.toString()}`).emit('notification:new', payload);
  return payload;
};

module.exports = { createNotification };
