const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { assertParticipant, sendMessage } = require('../services/chatService');
const { createNotification } = require('../services/notificationService');

const acknowledge = (callback, payload) => { if (typeof callback === 'function') callback(payload); };

module.exports = (io, socket) => {
  const userId = socket.data.userId;
  socket.on('conversation:join', async (conversationId, callback) => {
    try {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) throw Object.assign(new Error('Conversation not found.'), { status: 404 });
      assertParticipant(conversation, userId);
      socket.join(`conversation:${conversationId}`);
      acknowledge(callback, { ok: true });
    } catch (error) { acknowledge(callback, { ok: false, message: error.message || 'Unable to join conversation.' }); }
  });

  socket.on('conversation:leave', (conversationId) => socket.leave(`conversation:${conversationId}`));

  socket.on('message:send', async ({ conversationId, content } = {}, callback) => {
    try {
      const result = await sendMessage({ conversationId, senderId: userId, content });
      const payload = { conversationId: result.conversation._id.toString(), message: result.message.toObject() };
      io.to(`conversation:${result.conversation._id}`).emit('message:new', payload);
      io.to(`user:${result.message.receiver}`).except(`conversation:${result.conversation._id}`).emit('message:new', payload);
      await createNotification({ io, recipient: result.message.receiver, type: 'chat_message', title: 'New message', message: result.message.content.slice(0, 160), relatedEntity: { entityType: 'conversation', entityId: result.conversation._id, link: `/chat?conversation=${result.conversation._id}` } });
      acknowledge(callback, { ok: true, message: payload.message });
    } catch (error) { acknowledge(callback, { ok: false, message: error.message || 'Message could not be sent.' }); }
  });

  socket.on('typing:start', async ({ conversationId } = {}) => {
    try {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) return;
      assertParticipant(conversation, userId);
      socket.to(`conversation:${conversationId}`).emit('typing:update', { conversationId, userId, isTyping: true });
    } catch (_error) { /* ignore unauthorized transient typing events */ }
  });
  socket.on('typing:stop', async ({ conversationId } = {}) => {
    try {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) return;
      assertParticipant(conversation, userId);
      socket.to(`conversation:${conversationId}`).emit('typing:update', { conversationId, userId, isTyping: false });
    } catch (_error) { /* ignore unauthorized transient typing events */ }
  });

  socket.on('messages:read', async ({ conversationId } = {}, callback) => {
    try {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) throw new Error('Conversation not found.');
      assertParticipant(conversation, userId);
      const readAt = new Date();
      await Message.updateMany({ conversation: conversationId, receiver: userId, readAt: null }, { $set: { readAt } });
      io.to(`conversation:${conversationId}`).emit('message:read', { conversationId, readerId: userId, readAt });
      acknowledge(callback, { ok: true });
    } catch (error) { acknowledge(callback, { ok: false, message: error.message }); }
  });
};
